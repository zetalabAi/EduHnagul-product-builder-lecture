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

// Lazy initialization
function getDb() {
  return admin.firestore();
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});
const ttsClient = new TextToSpeechClient();

interface VoiceChatRequest {
  sessionId: string;
  userMessage: string;
  userSpeakingDuration?: number; // in seconds
}

interface VoiceChatResponse {
  messageId: string;
  aiMessage: string;
  audioContent: string; // base64 encoded MP3
  inputTokens: number;
  outputTokens: number;
  remainingMinutes: number;
}

/**
 * Voice chat function that handles user speech input, generates AI response,
 * and synthesizes speech with emotional expression.
 */
export const voiceChat = functions.https.onCall(
  async (data: VoiceChatRequest, context): Promise<VoiceChatResponse> => {
    const startTime = Date.now();
    const userId = verifyAuth(context);

    const {sessionId, userMessage, userSpeakingDuration = 0} = data;

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
      const systemPrompt = assemblePrompt(session, user, session.rollingSummary);

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversationMessages,
      });

      const aiMessage = response.content[0].type === "text" ? response.content[0].text : "";
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;

      // 7. Synthesize speech with Google TTS Journey
      const ttsRequest = {
        input: {text: aiMessage},
        voice: {
          languageCode: "ko-KR",
          name: "ko-KR-Journey-F", // Emotional female voice
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

      const audioBase64 = ttsResponse.audioContent.toString("base64");

      // Estimate AI speaking duration (rough: 150 chars per minute)
      const estimatedDuration = Math.ceil(aiMessage.length / 2.5); // ~150 chars/min = 2.5 chars/sec

      // 8. Save AI message
      const aiMessageRef = getDb().collection("messages").doc();
      const aiMessageDoc: MessageDocument = {
        id: aiMessageRef.id,
        sessionId,
        userId,
        role: "assistant",
        content: aiMessage,
        audioUrl: null, // Could upload to Cloud Storage if needed
        durationSeconds: estimatedDuration,
        modelUsed: "claude-3-5-sonnet-20241022",
        inputTokens,
        outputTokens,
        latencyMs: Date.now() - startTime,
        createdAt: Timestamp.now(),
      };
      await aiMessageRef.set(aiMessageDoc);

      // 9. Update session
      const totalConversationTime = userSpeakingDuration + estimatedDuration;
      await getDb().collection("sessions").doc(sessionId).update({
        messageCount: admin.firestore.FieldValue.increment(2),
        lastMessageAt: Timestamp.now(),
        totalDurationSeconds: admin.firestore.FieldValue.increment(totalConversationTime),
        userSpeakingSeconds: admin.firestore.FieldValue.increment(userSpeakingDuration),
        aiSpeakingSeconds: admin.firestore.FieldValue.increment(estimatedDuration),
        updatedAt: Timestamp.now(),
      });

      // 10. Deduct credits (based on total conversation time)
      if (user.subscriptionTier === "free" || user.subscriptionTier === "free+") {
        await deductVoiceCredits(userId, totalConversationTime);
      }

      // 11. Calculate remaining minutes after deduction
      const finalRemaining = user.subscriptionTier === "pro" || user.subscriptionTier === "pro+"
        ? Infinity
        : remainingMinutes - Math.ceil(totalConversationTime / 60);

      return {
        messageId: aiMessageRef.id,
        aiMessage,
        audioContent: audioBase64,
        inputTokens,
        outputTokens,
        remainingMinutes: finalRemaining,
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
