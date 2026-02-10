import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { AppError, SessionDocument, UserDocument, MessageDocument } from "../types";
import { requireAuth } from "../utils/auth";
import { assemblePrompt } from "./prompts";

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

export const chatStream = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { sessionId, message } = data;

    // Validate input
    if (!sessionId || !message) {
      throw new AppError("INVALID_INPUT", "Session ID and message are required", 400);
    }

    if (message.length > 2000) {
      throw new AppError("MESSAGE_TOO_LONG", "Message exceeds 2000 characters", 400);
    }

    const db = admin.firestore();

    // Load user and session
    const [userDoc, sessionDoc] = await Promise.all([
      db.collection("users").doc(userId).get(),
      db.collection("sessions").doc(sessionId).get(),
    ]);

    if (!userDoc.exists) {
      throw new AppError("USER_NOT_FOUND", "User not found", 404);
    }

    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      throw new AppError("INVALID_SESSION", "Session not found or not owned by user", 404);
    }

    const user = userDoc.data() as UserDocument;
    const session = sessionDoc.data() as SessionDocument;

    // Check quota and trial
    const now = admin.firestore.Timestamp.now();
    await checkQuotaAndTrial(user, userId, now, db);

    // Load recent messages for context
    const messagesSnapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const recentMessages: Anthropic.MessageParam[] = messagesSnapshot.docs
      .reverse()
      .map((doc) => {
        const msg = doc.data() as MessageDocument;
        return {
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        } as Anthropic.MessageParam;
      });

    // Add current user message to history
    recentMessages.push({
      role: "user",
      content: message,
    });

    // Assemble system prompt
    const systemPrompt = assemblePrompt(session, user, session.rollingSummary);

    // Determine model based on tier
    const modelName = getModelName(user);
    const maxTokens = user.subscriptionTier === "pro" ? 2048 : 1024;

    // Create streaming request
    const startTime = Date.now();
    const stream = await anthropic.messages.stream({
      model: modelName,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: recentMessages,
      temperature: 0.9,
    });

    let fullResponse = "";
    const chunks: string[] = [];

    // Process stream
    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
        const chunkText = chunk.delta.text;
        fullResponse += chunkText;
        chunks.push(chunkText);
      }
    }

    const latencyMs = Date.now() - startTime;

    // Get final message with usage data
    const finalMessage = await stream.finalMessage();
    const usage = finalMessage.usage;

    // Save messages to Firestore
    const batch = db.batch();

    // Save user message
    const userMessageRef = db.collection("messages").doc();
    batch.set(userMessageRef, {
      id: userMessageRef.id,
      sessionId,
      userId,
      role: "user",
      content: message,
      modelUsed: null,
      inputTokens: null,
      outputTokens: null,
      latencyMs: null,
      createdAt: now,
    });

    // Save assistant message
    const assistantMessageRef = db.collection("messages").doc();
    batch.set(assistantMessageRef, {
      id: assistantMessageRef.id,
      sessionId,
      userId,
      role: "assistant",
      content: fullResponse,
      modelUsed: modelName,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      latencyMs,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update session
    const newMessageCount = session.messageCount + 2;
    const sessionUpdate: any = {
      messageCount: newMessageCount,
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Auto-generate title from first exchange
    if (newMessageCount === 2) {
      sessionUpdate.title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
    }

    batch.update(sessionDoc.ref, sessionUpdate);

    // Update quota
    if (user.subscriptionTier === "free") {
      batch.update(userDoc.ref, {
        dailyMessagesUsed: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (user.trialUsed && user.trialEndedAt && user.trialEndedAt.toMillis() > now.toMillis()) {
      batch.update(userDoc.ref, {
        trialMessagesUsed: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    // Return response (client will handle streaming UI)
    return {
      messageId: assistantMessageRef.id,
      content: fullResponse,
      chunks,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      modelUsed: modelName,
    };
  } catch (error: any) {
    functions.logger.error("chatStream error:", error);

    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        error.statusCode === 401 ? "unauthenticated" :
        error.statusCode === 404 ? "not-found" :
        error.statusCode === 429 ? "resource-exhausted" : "internal",
        error.message,
        { code: error.code }
      );
    }

    throw new functions.https.HttpsError("internal", "Internal server error");
  }
});

async function checkQuotaAndTrial(
  user: UserDocument,
  userId: string,
  now: admin.firestore.Timestamp,
  db: admin.firestore.Firestore
): Promise<void> {
  // Pro users have no quota
  if (user.subscriptionTier === "pro" && user.subscriptionStatus === "active") {
    return;
  }

  // Check if trial is active
  if (user.trialUsed && user.trialEndedAt) {
    const trialActive = user.trialEndedAt.toMillis() > now.toMillis();

    if (trialActive) {
      // Check trial message limit
      if (user.trialMessagesUsed >= 50) {
        throw new AppError("TRIAL_EXPIRED", "Trial message limit reached. Upgrade to Pro for unlimited access.", 402);
      }
      return; // Trial is active and within limits
    }
  }

  // Activate trial if not used
  if (!user.trialUsed) {
    const trialEndTime = new Date(now.toMillis() + 5 * 60 * 1000); // 5 minutes from now
    await db.collection("users").doc(userId).update({
      trialUsed: true,
      trialStartedAt: now,
      trialEndedAt: admin.firestore.Timestamp.fromDate(trialEndTime),
      trialMessagesUsed: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    functions.logger.info(`Activated trial for user ${userId}`);
    return;
  }

  // Free tier quota check
  if (user.dailyMessagesUsed >= 20) {
    throw new AppError(
      "QUOTA_EXCEEDED",
      "Daily message limit reached. Upgrade to Pro for unlimited access.",
      429
    );
  }
}

function getModelName(user: UserDocument): "claude-3-haiku-20240307" | "claude-3-5-sonnet-20240620" {
  // Pro users get Claude 3.5 Sonnet
  if (user.subscriptionTier === "pro" && user.subscriptionStatus === "active") {
    return "claude-3-5-sonnet-20240620";
  }

  // Trial users get Claude 3.5 Sonnet
  const now = Date.now();
  if (user.trialUsed && user.trialEndedAt && user.trialEndedAt.toMillis() > now) {
    return "claude-3-5-sonnet-20240620";
  }

  // Free tier gets Claude 3 Haiku
  return "claude-3-haiku-20240307";
}
