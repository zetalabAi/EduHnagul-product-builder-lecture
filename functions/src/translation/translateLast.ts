import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { AppError, MessageDocument, UserDocument } from "../types";
import { requireAuth } from "../utils/auth";
import { getTranslationPrompt } from "../chat/prompts";
import {getGeminiModel} from "../ai/gemini";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  ja: "Japanese",
  zh: "Chinese",
  fr: "French",
};

export const translateLast = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { sessionId, role } = data;

    if (!sessionId || !role || !["user", "assistant"].includes(role)) {
      throw new AppError("INVALID_INPUT", "Valid session ID and role (user/assistant) are required", 400);
    }

    const db = admin.firestore();

    // Load user
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new AppError("USER_NOT_FOUND", "User not found", 404);
    }

    const user = userDoc.data() as UserDocument;

    // Verify session ownership
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      throw new AppError("INVALID_SESSION", "Session not found or not owned by user", 404);
    }

    // Get last message of specified role
    const messagesSnapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .where("role", "==", role)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (messagesSnapshot.empty) {
      throw new AppError("MESSAGE_NOT_FOUND", `No ${role} message found in this session`, 404);
    }

    const message = messagesSnapshot.docs[0].data() as MessageDocument;
    const koreanText = message.content;

    // Translate using Gemini Flash
    const targetLanguage = LANGUAGE_NAMES[user.nativeLanguage];
    const prompt = getTranslationPrompt(koreanText, targetLanguage, user.nativeLanguage);

    const model = getGeminiModel("gemini-2.5-flash");
    const result = await model.generateContent({
      contents: [{role: "user", parts: [{text: prompt}]}],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const translated = result.response.text() || "";

    return {
      original: koreanText,
      translated,
      targetLanguage: user.nativeLanguage,
    };
  } catch (error: any) {
    functions.logger.error("translateLast error:", error);

    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        error.statusCode === 401 ? "unauthenticated" :
        error.statusCode === 404 ? "not-found" : "invalid-argument",
        error.message,
        { code: error.code }
      );
    }

    throw new functions.https.HttpsError("internal", "Translation failed");
  }
});
