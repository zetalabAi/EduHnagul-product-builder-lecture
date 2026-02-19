import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import * as crypto from "crypto";
import {TextToSpeechClient} from "@google-cloud/text-to-speech";
import {verifyAuth} from "../auth/authMiddleware";
import {AppError} from "../utils/errors";
import {UserDocument, SessionDocument, MessageDocument} from "../types";
import {assemblePrompt} from "../chat/prompts";
import {checkVoiceCredits, deductVoiceCredits} from "./creditManager";
import {generateGeminiTTS, buildStyleInstructions, TUTOR_VOICE_MAP} from "./geminiTTS";
import {getGeminiModel} from "../ai/gemini";

// Lazy initialization
function getDb() {
  return admin.firestore();
}

const ttsClient = new TextToSpeechClient();

/**
 * Parse AI response into dialogue (for TTS) and learning tip (text only)
 * Supports both explicit markers and "*" prefix format
 */
function parseAIResponse(fullResponse: string): {
  dialogue: string;
  learningTip: string;
} {
  // Try explicit [DIALOGUE] and [LEARNING_TIP] markers first
  const dialogueMatch = fullResponse.match(/\[DIALOGUE\]([\s\S]*?)(?:\[LEARNING_TIP\]|$)/);
  const learningTipMatch = fullResponse.match(/\[LEARNING_TIP\]([\s\S]*?)$/);

  if (dialogueMatch || learningTipMatch) {
    const dialogue = dialogueMatch ? dialogueMatch[1].trim() : fullResponse.split("[LEARNING_TIP]")[0].trim();
    const learningTip = learningTipMatch ? learningTipMatch[1].trim() : "";
    return {dialogue, learningTip: cleanLearningTip(learningTip)};
  }

  // Fallback: parse "*" prefix format
  const lines = fullResponse.split("\n");
  const dialogueLines: string[] = [];
  const noteLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("*")) {
      // "*" 제거하고 학습 노트에 추가
      noteLines.push(trimmed.substring(1).trim());
    } else if (trimmed) {
      dialogueLines.push(line);
    }
  }

  return {
    dialogue: dialogueLines.join("\n").trim(),
    learningTip: cleanLearningTip(noteLines.join("\n").trim()),
  };
}

/**
 * Clean learning tip: remove incomplete sentences
 */
function cleanLearningTip(tip: string): string {
  if (!tip) return "";

  const lines = tip
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      // Keep lines that end with proper punctuation
      return (
        trimmed.endsWith(".") ||
        trimmed.endsWith("!") ||
        trimmed.endsWith("?") ||
        trimmed.endsWith("요") ||
        trimmed.endsWith("다") ||
        trimmed.endsWith("니다") ||
        trimmed.endsWith("어요") ||
        trimmed.endsWith("에요")
      );
    });

  return lines.join("\n").trim();
}

interface VoiceChatRequest {
  sessionId: string;
  userMessage: string;
  userSpeakingDuration?: number; // in seconds
  settings?: {
    persona: string;
    responseStyle: string;
    correctionStrength: string;
    formalityLevel: string;
  };
}

interface VoiceChatResponse {
  messageId: string;
  aiMessage: string; // Full AI response (dialogue + learning tip)
  audioUrl: string; // Cloud Storage URL
  inputTokens: number;
  outputTokens: number;
  remainingMinutes: number;
  learningTip?: string; // Learning tip (text only, not in TTS)
}

/**
 * Voice chat function that handles user speech input, generates AI response,
 * and synthesizes speech with emotional expression.
 */
export const voiceChat = functions.https.onCall(
  async (data: VoiceChatRequest, context): Promise<VoiceChatResponse> => {
    const startTime = Date.now();
    const userId = verifyAuth(context);

    const {sessionId, userMessage, userSpeakingDuration = 0, settings} = data;

    // Performance tracking
    let geminiStartTime = 0;
    let geminiTime = 0;
    let ttsStartTime = 0;
    let ttsTime = 0;

    if (!sessionId || !userMessage) {
      throw new AppError("INVALID_INPUT", "Session ID and message are required", 400);
    }

    try {
      // 1. Check voice credits
      const remainingMinutes = await checkVoiceCredits(userId);
      functions.logger.info(`User ${userId} has ${remainingMinutes} minutes remaining`);

      // 2. Get user and session
      const userDoc = await getDb().collection("users").doc(userId).get();
      const sessionDoc = await getDb().collection("sessions").doc(sessionId).get();

      if (!userDoc.exists || !sessionDoc.exists) {
        throw new AppError("NOT_FOUND", "User or session not found", 404);
      }

      const user = userDoc.data() as UserDocument;
      const session = sessionDoc.data() as SessionDocument;

      if (session.userId !== userId) {
        throw new AppError("FORBIDDEN", "Session does not belong to user", 403);
      }

      // 3. Save user message
      const userMessageRef = getDb().collection("messages").doc();
      const userMessageDoc: MessageDocument = {
        id: userMessageRef.id,
        sessionId,
        userId,
        role: "user",
        content: userMessage,
        audioUrl: null,
        durationSeconds: userSpeakingDuration,
        modelUsed: null,
        inputTokens: null,
        outputTokens: null,
        latencyMs: null,
        createdAt: Timestamp.now(),
      };
      await userMessageRef.set(userMessageDoc);

      // 4. Get recent conversation history
      const messagesSnapshot = await getDb()
        .collection("messages")
        .where("sessionId", "==", sessionId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const messages = messagesSnapshot.docs
        .reverse()
        .map((doc) => doc.data() as MessageDocument);

      // 5. Build Gemini API contents
      // Apply settings from request if provided
      const effectiveSession = settings
        ? ({ ...session, ...settings } as SessionDocument)
        : session;
      const systemPrompt = assemblePrompt(effectiveSession, user, session.rollingSummary);

      const conversationContents = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{text: msg.content}],
      }));

      const contents = [
        {role: "user", parts: [{text: systemPrompt}]},
        ...conversationContents,
      ];

      // 6. Call Gemini 2.5 Flash for text response
      const model = getGeminiModel("gemini-2.5-flash");

      geminiStartTime = Date.now();
      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 1024,
        },
      });
      geminiTime = Date.now() - geminiStartTime;
      functions.logger.info(`⚡ Gemini API: ${geminiTime}ms`);

      const fullAIMessage = result.response.text();
      const usage = result.response?.usageMetadata;
      const inputTokens = usage?.promptTokenCount ?? 0;
      const outputTokens = usage?.candidatesTokenCount ?? 0;

      // Parse response: separate dialogue (for TTS) and learning tip (text only)
      const {dialogue, learningTip} = parseAIResponse(fullAIMessage);
      functions.logger.info(`📝 Parsed - Dialogue: ${dialogue.length} chars, Learning Tip: ${learningTip.length} chars`);

      // 7. Extract audio (dialogue only, NOT learning tip!)
      // Performance: TTS start
      ttsStartTime = Date.now();

      // Build style instructions from session settings
      const styleInstructions = buildStyleInstructions({
        persona: effectiveSession.persona,
        responseStyle: effectiveSession.responseStyle,
        formalityLevel: effectiveSession.formalityLevel,
      });

      // ⚠️ 절대 수정 금지: Aoede(지민)/Puck(민준) 감정 보이스
      const tutorId = (effectiveSession as any).selectedTutor || (effectiveSession as any).persona || "jimin";
      const tutorVoice = TUTOR_VOICE_MAP[tutorId] ?? "Aoede";
      const emotionalStylePrompt = `${styleInstructions}\n감정을 충분히 담아서, 자연스럽고 따뜻하게 말해주세요.`;

      let audioUrl = "";
      try {
        functions.logger.info(`🎤 Generating Gemini TTS audio (voice: ${tutorVoice})...`);
        audioUrl = await generateGeminiTTS({
          text: dialogue,
          voiceName: tutorVoice, // Aoede(지민) or Puck(민준)
          temperature: 1.5,
          styleInstructions: emotionalStylePrompt,
        });
        functions.logger.info("✅ Gemini TTS 사용 (감정 음성)");
      } catch (ttsError) {
        functions.logger.warn("⚠️ Gemini TTS 실패, Google Cloud TTS fallback 사용", ttsError);
        const fallbackBuffer = await generateGoogleTTS(dialogue);
        audioUrl = await saveTTSToStorage(fallbackBuffer, dialogue, "gcloud");
      }

      ttsTime = Date.now() - ttsStartTime;
      functions.logger.info(`🔊 TTS: ${ttsTime}ms`);

      // Estimate AI speaking duration based on dialogue only (not learning tip)
      const estimatedDuration = Math.ceil(dialogue.length / 2.5); // ~150 chars/min = 2.5 chars/sec

      // 8. Save AI message (dialogue + learning tip stored separately)
      const aiMessageRef = getDb().collection("messages").doc();
      const aiMessageDoc: Partial<MessageDocument> = {
        id: aiMessageRef.id,
        sessionId,
        userId,
        role: "assistant",
        content: dialogue, // Store dialogue only (not learningTip)
        learningTip: learningTip || null, // Store learning tip separately
        audioUrl: audioUrl, // Cloud Storage URL (dialogue only)
        durationSeconds: estimatedDuration,
        modelUsed: "gemini-2.5-flash",
        inputTokens,
        outputTokens,
        latencyMs: Date.now() - startTime,
        createdAt: Timestamp.now(),
      };
      await aiMessageRef.set(aiMessageDoc);

      // 9. Update session
      const totalConversationTime = userSpeakingDuration + estimatedDuration;
      const sessionUpdates: any = {
        messageCount: admin.firestore.FieldValue.increment(2),
        lastMessageAt: Timestamp.now(),
        totalDurationSeconds: admin.firestore.FieldValue.increment(totalConversationTime),
        userSpeakingSeconds: admin.firestore.FieldValue.increment(userSpeakingDuration),
        aiSpeakingSeconds: admin.firestore.FieldValue.increment(estimatedDuration),
        updatedAt: Timestamp.now(),
        lastMessagePreview: userMessage.slice(0, 100),
      };

      // Auto-generate title from first message
      if (session.messageCount === 0 && (session.title === "New conversation" || session.title === "Voice conversation")) {
        sessionUpdates.title = userMessage.slice(0, 50);
      }

      await getDb().collection("sessions").doc(sessionId).update(sessionUpdates);

      // 10. Deduct credits and get updated remaining minutes
      let finalRemaining: number;
      if (user.subscriptionTier === "free" || user.subscriptionTier === "free+") {
        finalRemaining = await deductVoiceCredits(userId, totalConversationTime);
      } else {
        // Pro/Pro+ users have unlimited
        // Use -1 to represent unlimited (Infinity cannot be JSON serialized)
        finalRemaining = -1;
      }

      // Performance: Total time
      const totalTime = Date.now() - startTime;
      functions.logger.info(
        `📊 Performance Summary - Total: ${totalTime}ms | ` +
        `Gemini: ${geminiTime}ms (${Math.round((geminiTime / totalTime) * 100)}%) | ` +
        `TTS: ${ttsTime}ms (${Math.round((ttsTime / totalTime) * 100)}%)`
      );

      return {
        messageId: aiMessageRef.id,
        aiMessage: dialogue, // Return only dialogue (what was spoken)
        audioUrl: audioUrl,
        inputTokens,
        outputTokens,
        remainingMinutes: finalRemaining,
        learningTip: learningTip || undefined, // Optional learning tip
      };
    } catch (error: any) {
      functions.logger.error("Voice chat error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "VOICE_CHAT_ERROR",
        `Voice chat failed: ${error.message}`,
        500
      );
    }
  }
);

function getBucket() {
  return admin.storage().bucket("edu-hangul-tts-audio");
}

function detectAudioFormat(buffer: Buffer): {ext: string; contentType: string} {
  const header = buffer.subarray(0, 4).toString("ascii");

  if (header === "RIFF") {
    return {ext: "wav", contentType: "audio/wav"};
  }

  const mp3Header = buffer.subarray(0, 3).toString("ascii");
  if (mp3Header === "ID3" || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) {
    return {ext: "mp3", contentType: "audio/mpeg"};
  }

  return {ext: "mp3", contentType: "audio/mpeg"};
}

async function saveTTSToStorage(buffer: Buffer, text: string, prefix: string): Promise<string> {
  const hash = crypto.createHash("sha256").update(text).digest("hex").substring(0, 16);
  const {ext, contentType} = detectAudioFormat(buffer);
  const fileName = `tts/${prefix}-${hash}.${ext}`;
  const bucket = getBucket();
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=604800",
    },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

async function generateGoogleTTS(text: string): Promise<Buffer> {
  const request = {
    input: {text: text.trim()},
    voice: {
      languageCode: "ko-KR",
      name: "ko-KR-Journey-F",
    },
    audioConfig: {
      audioEncoding: "MP3" as const,
      speakingRate: 1.0,
      pitch: 0.0,
      effectsProfileId: ["small-bluetooth-speaker-class-device"],
    },
  };

  const [response] = await ttsClient.synthesizeSpeech(request);

  if (!response.audioContent) {
    throw new AppError("TTS_ERROR", "Google Cloud TTS returned empty audio", 500);
  }

  return Buffer.isBuffer(response.audioContent)
    ? response.audioContent
    : Buffer.from(response.audioContent as Uint8Array);
}
