import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { requireAuth } from "../utils/auth";
import { AppError } from "../types";

export const createSession = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { persona, responseStyle, correctionStrength, formalityLevel } = data;

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
      title: "New conversation",
      persona,
      responseStyle,
      correctionStrength,
      formalityLevel,
      rollingSummary: null,
      lastSummaryAt: null,
      summaryVersion: 0,
      messageCount: 0,
      lastMessageAt: now,
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
