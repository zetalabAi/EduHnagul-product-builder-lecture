import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import {TextToSpeechClient} from "@google-cloud/text-to-speech";
import {verifyAuth} from "../auth/authMiddleware";
import {AppError} from "../utils/errors";
import {UserDocument, SessionDocument, MessageDocument} from "../types";
import {assemblePrompt} from "../chat/prompts";
import {checkVoiceCredits, deductVoiceCredits} from "./creditManager";
import {generateGeminiTTS, buildStyleInstructions} from "./geminiTTS";
import * as crypto from "crypto";

// Lazy initialization
function getDb() {
  return admin.firestore();
}

function getBucket() {
  return admin.storage().bucket("edu-hangul-tts-audio");
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});
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

/**
 * Generate hash for TTS caching
 * Same text + voice = same hash = reuse audio file
 */
function generateTTSHash(text: string, voiceName: string): string {
  return crypto
    .createHash("sha256")
    .update(`${text}:${voiceName}`)
    .digest("hex");
}

/**
 * Upload TTS audio to Cloud Storage and return public URL
 * Uses hash-based caching to avoid duplicate synthesis
 */
async function uploadTTSToStorage(
  audioBuffer: Buffer,
  text: string,
  voiceName: string
): Promise<string> {
  const bucket = getBucket();
  const hash = generateTTSHash(text, voiceName);
  const fileName = `tts/${hash}.mp3`;
  const file = bucket.file(fileName);

  // Check if file already exists (cache hit)
  const [exists] = await file.exists();
  if (exists) {
    functions.logger.info(`TTS cache hit for hash: ${hash}`);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return url;
  }

  // Upload new file
  await file.save(audioBuffer, {
    metadata: {
      contentType: "audio/mpeg",
      cacheControl: "public, max-age=604800", // 7 days
    },
  });

  // Make file publicly readable
  await file.makePublic();

  // Get public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  functions.logger.info(`TTS audio uploaded: ${fileName}`);

  return publicUrl;
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
    let claudeStartTime = 0;
    let claudeTime = 0;
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

      // 5. Build Claude API messages
      const conversationMessages: Anthropic.MessageParam[] = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      // 6. Call Claude API (Sonnet for all plans)
      // Apply settings from request if provided
      const effectiveSession = settings
        ? ({ ...session, ...settings } as SessionDocument)
        : session;
      const systemPrompt = assemblePrompt(effectiveSession, user, session.rollingSummary);

      // Performance: Claude API start
      claudeStartTime = Date.now();
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversationMessages,
      });
      claudeTime = Date.now() - claudeStartTime;
      functions.logger.info(`⚡ Claude API: ${claudeTime}ms`);

      const fullAIMessage = response.content[0].type === "text" ? response.content[0].text : "";
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;

      // Parse response: separate dialogue (for TTS) and learning tip (text only)
      const {dialogue, learningTip} = parseAIResponse(fullAIMessage);
      functions.logger.info(`📝 Parsed - Dialogue: ${dialogue.length} chars, Learning Tip: ${learningTip.length} chars`);

      // 7. Synthesize speech with Gemini TTS (dialogue only, NOT learning tip!)
      // Performance: TTS start
      ttsStartTime = Date.now();
      let audioUrl: string;

      try {
        // Build style instructions from session settings
        const styleInstructions = buildStyleInstructions({
          persona: effectiveSession.persona,
          responseStyle: effectiveSession.responseStyle,
          formalityLevel: effectiveSession.formalityLevel,
        });

        // Try Gemini TTS first (better quality)
        functions.logger.info("🎤 Attempting Gemini TTS...");
        audioUrl = await generateGeminiTTS({
          text: dialogue, // Only dialogue, NOT full message!
          voiceName: "Kore", // Korean female voice
          temperature: 1.5,
          styleInstructions,
        });
        functions.logger.info("✅ Gemini TTS success");
      } catch (geminiError: any) {
        // Fallback to Google Cloud TTS if Gemini fails
        functions.logger.warn(`Gemini TTS failed (${geminiError.message}), falling back to Google Cloud TTS`);

        const ttsRequest = {
          input: {text: dialogue}, // Only dialogue!
          voice: {
            languageCode: "ko-KR",
            name: "ko-KR-Neural2-A", // High-quality neural female voice
          },
          audioConfig: {
            audioEncoding: "MP3" as const,
            speakingRate: 1.0,
            pitch: 0.0,
            effectsProfileId: ["small-bluetooth-speaker-class-device"],
          },
        };

        const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);

        if (!ttsResponse.audioContent) {
          throw new AppError("TTS_ERROR", "Failed to synthesize speech", 500);
        }

        // Upload to Cloud Storage and get URL (with caching)
        try {
          const audioBuffer = Buffer.from(ttsResponse.audioContent);
          audioUrl = await uploadTTSToStorage(audioBuffer, dialogue, "ko-KR-Neural2-A");
        } catch (storageError: any) {
          functions.logger.warn("Storage upload failed, using base64 fallback:", storageError.message);
          // Fallback: return base64 data URL
          const audioBase64 = ttsResponse.audioContent.toString("base64");
          audioUrl = `data:audio/mp3;base64,${audioBase64}`;
        }
      }

      ttsTime = Date.now() - ttsStartTime;
      functions.logger.info(`🔊 TTS: ${ttsTime}ms`);

      // Estimate AI speaking duration based on dialogue only (not learning tip)
      const estimatedDuration = Math.ceil(dialogue.length / 2.5); // ~150 chars/min = 2.5 chars/sec

      // 8. Save AI message (full message with dialogue + learning tip)
      const aiMessageRef = getDb().collection("messages").doc();
      const aiMessageDoc: MessageDocument = {
        id: aiMessageRef.id,
        sessionId,
        userId,
        role: "assistant",
        content: fullAIMessage, // Store full message (dialogue + learning tip)
        audioUrl: audioUrl, // Cloud Storage URL (dialogue only)
        durationSeconds: estimatedDuration,
        modelUsed: "claude-sonnet-4-20250514",
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
        finalRemaining = Infinity;
      }

      // Performance: Total time
      const totalTime = Date.now() - startTime;
      functions.logger.info(
        `📊 Performance Summary - Total: ${totalTime}ms | ` +
        `Claude: ${claudeTime}ms (${Math.round((claudeTime / totalTime) * 100)}%) | ` +
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
