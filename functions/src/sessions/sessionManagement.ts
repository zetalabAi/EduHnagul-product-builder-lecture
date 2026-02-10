import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth } from "../utils/auth";
import { AppError } from "../types";

export const createSession = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { persona, responseStyle, correctionStrength, formalityLevel, isVoiceSession } = data;

    // Validate settings
    const validPersonas = ["same-sex-friend", "opposite-sex-friend", "boyfriend", "girlfriend"];
    const validStyles = ["empathetic", "balanced", "blunt"];
    const validCorrections = ["minimal", "strict"];
    const validFormality = ["formal", "polite", "casual", "intimate"];

    if (!validPersonas.includes(persona) || !validStyles.includes(responseStyle) || !validCorrections.includes(correctionStrength) || !validFormality.includes(formalityLevel)) {
      throw new AppError("INVALID_SETTINGS", "Invalid session settings", 400);
    }

    const db = admin.firestore();
    const sessionRef = db.collection("sessions").doc();

    const now = admin.firestore.FieldValue.serverTimestamp();

    await sessionRef.set({
      id: sessionRef.id,
      userId,
      title: isVoiceSession ? "Voice conversation" : "New conversation",
      persona,
      responseStyle,
      correctionStrength,
      formalityLevel,
      // Voice session specific
      isVoiceSession: isVoiceSession || false,
      totalDurationSeconds: 0,
      userSpeakingSeconds: 0,
      aiSpeakingSeconds: 0,
      isPaused: false,
      rollingSummary: null,
      lastSummaryAt: null,
      summaryVersion: 0,
      messageCount: 0,
      lastMessageAt: now,
      // Session management
      isPinned: false,
      lastMessagePreview: "",
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    return {
      sessionId: sessionRef.id,
      createdAt: new Date().toISOString(),
    };
  } catch (error: any) {
    functions.logger.error("createSession error:", error);

    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        error.statusCode === 401 ? "unauthenticated" : "invalid-argument",
        error.message,
        { code: error.code }
      );
    }

    throw new functions.https.HttpsError("internal", "Internal server error");
  }
});

export const updateSession = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { sessionId, persona, responseStyle, correctionStrength, formalityLevel } = data;

    if (!sessionId) {
      throw new AppError("INVALID_INPUT", "Session ID is required", 400);
    }

    const db = admin.firestore();
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();

    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      throw new AppError("INVALID_SESSION", "Session not found or not owned by user", 404);
    }

    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (persona) updates.persona = persona;
    if (responseStyle) updates.responseStyle = responseStyle;
    if (correctionStrength) updates.correctionStrength = correctionStrength;
    if (formalityLevel) updates.formalityLevel = formalityLevel;

    await sessionDoc.ref.update(updates);

    return { success: true };
  } catch (error: any) {
    functions.logger.error("updateSession error:", error);

    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        error.statusCode === 401 ? "unauthenticated" :
        error.statusCode === 404 ? "not-found" : "invalid-argument",
        error.message,
        { code: error.code }
      );
    }

    throw new functions.https.HttpsError("internal", "Internal server error");
  }
});

export const renameSession = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { sessionId, title } = data;

    if (!sessionId) {
      throw new AppError("INVALID_INPUT", "Session ID is required", 400);
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      throw new AppError("INVALID_INPUT", "Title must be a non-empty string", 400);
    }

    if (title.length > 100) {
      throw new AppError("INVALID_INPUT", "Title must be 100 characters or less", 400);
    }

    const db = admin.firestore();
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();

    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      throw new AppError("INVALID_SESSION", "Session not found or not owned by user", 404);
    }

    await sessionDoc.ref.update({
      title: title.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    functions.logger.error("renameSession error:", error);

    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        error.statusCode === 401 ? "unauthenticated" :
        error.statusCode === 404 ? "not-found" : "invalid-argument",
        error.message,
        { code: error.code }
      );
    }

    throw new functions.https.HttpsError("internal", "Internal server error");
  }
});

export const togglePinSession = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { sessionId } = data;

    if (!sessionId) {
      throw new AppError("INVALID_INPUT", "Session ID is required", 400);
    }

    const db = admin.firestore();
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();

    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      throw new AppError("INVALID_SESSION", "Session not found or not owned by user", 404);
    }

    const currentPinned = sessionDoc.data()?.isPinned || false;

    await sessionDoc.ref.update({
      isPinned: !currentPinned,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, isPinned: !currentPinned };
  } catch (error: any) {
    functions.logger.error("togglePinSession error:", error);

    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        error.statusCode === 401 ? "unauthenticated" :
        error.statusCode === 404 ? "not-found" : "invalid-argument",
        error.message,
        { code: error.code }
      );
    }

    throw new functions.https.HttpsError("internal", "Internal server error");
  }
});

export const deleteSession = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { sessionId } = data;

    if (!sessionId) {
      throw new AppError("INVALID_INPUT", "Session ID is required", 400);
    }

    const db = admin.firestore();
    const sessionDoc = await db.collection("sessions").doc(sessionId).get();

    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      throw new AppError("INVALID_SESSION", "Session not found or not owned by user", 404);
    }

    // Delete all messages in this session
    const messagesSnapshot = await db
      .collection("messages")
      .where("sessionId", "==", sessionId)
      .get();

    const batch = db.batch();
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the session document
    batch.delete(sessionDoc.ref);

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    functions.logger.error("deleteSession error:", error);

    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        error.statusCode === 401 ? "unauthenticated" :
        error.statusCode === 404 ? "not-found" : "invalid-argument",
        error.message,
        { code: error.code }
      );
    }

    throw new functions.https.HttpsError("internal", "Internal server error");
  }
});
