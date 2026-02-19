import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { verifyAuth } from "../auth/authMiddleware";
import { AppError } from "../utils/errors";
import { assemblePrompt } from "./prompts";
import { UserDocument, SessionDocument, MessageDocument } from "../types";
import {getGeminiModel} from "../ai/gemini";

interface TextChatRequest {
  sessionId: string;
  userMessage: string;
  nativeLanguage?: string;
  settings?: {
    persona: string;
    responseStyle: string;
    correctionStrength: string;
    formalityLevel: string;
    nativeLanguage?: string;
  };
}

interface TextChatResponse {
  messageId: string;
  aiMessage: string;
  learningTip?: string;
  remainingMinutes: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

/**
 * Parse AI response into dialogue and learning tip
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
    return {dialogue, learningTip};
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
    learningTip: noteLines.join("\n").trim(),
  };
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
    const { sessionId, userMessage, nativeLanguage, settings } = data;

    if (!sessionId || !userMessage) {
      throw new AppError("INVALID_PARAMS", "Missing required parameters", 400);
    }

    if (userMessage.trim().length === 0) {
      throw new AppError("EMPTY_MESSAGE", "Message cannot be empty", 400);
    }

    const db = admin.firestore();

    // 1. Text chat does NOT consume voice credits
    // Text-only chat is unlimited for all users
    // Voice credits only apply to voice chat (TTS generation)

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

    // 6. Build Gemini conversation
    // Apply settings + nativeLanguage from request if provided
    const effectiveSession = {
      ...session,
      ...(settings ?? {}),
      ...(nativeLanguage ? { nativeLanguage } : {}),
    } as SessionDocument;
    const systemPrompt = assemblePrompt(effectiveSession, user, session.rollingSummary);

    const conversationContents = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{text: msg.content}],
    }));

    const contents = [
      {role: "user", parts: [{text: systemPrompt}]},
      ...conversationContents,
    ];

    // 7. Call Gemini API
    let aiResponse: string;
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const model = getGeminiModel("gemini-2.5-flash");
      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 1024,
        },
      });

      aiResponse = result.response.text();
      const usage = result.response?.usageMetadata;
      inputTokens = usage?.promptTokenCount ?? 0;
      outputTokens = usage?.candidatesTokenCount ?? 0;
    } catch (error: any) {
      functions.logger.error("Gemini API error:", error);
      throw new AppError(
        "AI_ERROR",
        "Failed to generate AI response: " + error.message,
        500
      );
    }

    // 8. Parse response: separate dialogue and learning tip
    const {dialogue, learningTip} = parseAIResponse(aiResponse);
    functions.logger.info(`📝 Parsed - Dialogue: ${dialogue.length} chars, Learning Tip: ${learningTip.length} chars`);

    // 9. Save AI message
    const aiMessageRef = db.collection("messages").doc();
    const aiMessageData: Partial<MessageDocument> = {
      id: aiMessageRef.id,
      sessionId,
      userId,
      role: "assistant",
      content: dialogue, // Store dialogue only (not learningTip)
      learningTip: learningTip || null, // Store learning tip separately
      audioUrl: null,
      durationSeconds: null,
      modelUsed: "gemini-2.5-flash",
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startTime,
      createdAt: admin.firestore.Timestamp.now(),
    };
    await aiMessageRef.set(aiMessageData);

    // 10. Update session
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

    // 11. Text chat does NOT deduct voice credits
    // Text is unlimited for all users
    // Use -1 to represent unlimited (matches voiceChat for Pro users)

    // 12. Return response
    return {
      messageId: aiMessageRef.id,
      aiMessage: dialogue, // Return dialogue only
      learningTip: learningTip || undefined, // Optional learning tip
      remainingMinutes: -1, // Unlimited for text chat
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - startTime,
    };
  }
);
