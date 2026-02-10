import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "../auth/authMiddleware";
import { AppError } from "../utils/errors";
import { checkVoiceCredits, deductVoiceCredits } from "../speech/creditManager";
import { assemblePrompt } from "./prompts";
import { UserDocument, SessionDocument, MessageDocument } from "../types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface TextChatRequest {
  sessionId: string;
  userMessage: string;
}

interface TextChatResponse {
  messageId: string;
  aiMessage: string;
  remainingMinutes: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

/**
 * Text Chat Handler
 * Similar to voiceChat but without TTS
 * For desktop/keyboard users
 */
export const textChat = functions.https.onCall(
  async (data: TextChatRequest, context): Promise<TextChatResponse> => {
    const startTime = Date.now();
    const userId = verifyAuth(context);
    const { sessionId, userMessage } = data;

    if (!sessionId || !userMessage) {
      throw new AppError("INVALID_PARAMS", "Missing required parameters", 400);
    }

    if (userMessage.trim().length === 0) {
      throw new AppError("EMPTY_MESSAGE", "Message cannot be empty", 400);
    }

    const db = admin.firestore();

    // 1. Check credits (text chat uses same voice credits for now)
    // TODO: Consider separate text message quota
    const remainingMinutes = await checkVoiceCredits(userId);
    if (remainingMinutes <= 0) {
      throw new AppError(
        "QUOTA_EXCEEDED",
        "You have used all your weekly minutes. Please upgrade or wait for reset.",
        429
      );
    }

    // 2. Get user document
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new AppError("USER_NOT_FOUND", "User not found", 404);
    }
    const user = userDoc.data() as UserDocument;

    // 3. Get session document
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      throw new AppError("SESSION_NOT_FOUND", "Session not found", 404);
    }
    const session = sessionDoc.data() as SessionDocument;

    if (session.userId !== userId) {
      throw new AppError("UNAUTHORIZED", "Session does not belong to user", 403);
    }

    // 4. Save user message
    const userMessageRef = db.collection("messages").doc();
    const userMessageData: Partial<MessageDocument> = {
      id: userMessageRef.id,
      sessionId,
      userId,
      role: "user",
      content: userMessage,
      audioUrl: null,
      durationSeconds: null,
      modelUsed: null,
      inputTokens: null,
      outputTokens: null,
      latencyMs: null,
      createdAt: admin.firestore.Timestamp.now(),
    };
    await userMessageRef.set(userMessageData);

    // 5. Get conversation history (last 20 messages)
    const messagesSnapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const messages = messagesSnapshot.docs
      .map((doc) => doc.data() as MessageDocument)
      .reverse();

    // 6. Build Claude conversation
    const systemPrompt = assemblePrompt(session, user, session.rollingSummary);

    const conversationMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // 7. Call Claude API
    let aiResponse: string;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversationMessages,
      });

      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in Claude response");
      }

      aiResponse = textContent.text;
      inputTokens = response.usage.input_tokens;
      outputTokens = response.usage.output_tokens;
    } catch (error: any) {
      functions.logger.error("Claude API error:", error);
      throw new AppError(
        "AI_ERROR",
        "Failed to generate AI response: " + error.message,
        500
      );
    }

    // 8. Save AI message
    const aiMessageRef = db.collection("messages").doc();
    const aiMessageData: Partial<MessageDocument> = {
      id: aiMessageRef.id,
      sessionId,
      userId,
      role: "assistant",
      content: aiResponse,
      audioUrl: null,
      durationSeconds: null,
      modelUsed: "claude-sonnet-4-20250514",
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startTime,
      createdAt: admin.firestore.Timestamp.now(),
    };
    await aiMessageRef.set(aiMessageData);

    // 9. Update session
    const sessionUpdates: any = {
      messageCount: admin.firestore.FieldValue.increment(2),
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessagePreview: userMessage.slice(0, 100),
    };

    // Auto-generate title from first message
    if (session.messageCount === 0 && (session.title === "New conversation" || session.title === "Voice conversation")) {
      sessionUpdates.title = userMessage.slice(0, 50);
    }

    await db
      .collection("sessions")
      .doc(sessionId)
      .update(sessionUpdates);

    // 10. Deduct credits (estimate: 1 text message = 30 seconds)
    // This is generous - text is much cheaper than voice
    const secondsToDeduct = 30; // 0.5 minutes
    const newRemainingMinutes = await deductVoiceCredits(userId, secondsToDeduct);

    // 11. Return response
    return {
      messageId: aiMessageRef.id,
      aiMessage: aiResponse,
      remainingMinutes: newRemainingMinutes,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startTime,
    };
  }
);
