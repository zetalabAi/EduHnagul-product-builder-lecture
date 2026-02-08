import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {verifyAuth} from "../auth/authMiddleware";
import {AppError} from "../utils/errors";
import {SessionDocument, MessageDocument} from "../types";

function getDb() {
  return admin.firestore();
}

interface SessionSummaryRequest {
  sessionId: string;
}

interface SessionSummaryResponse {
  // Basic stats (all users)
  totalDurationMinutes: number;
  userSpeakingPercentage: number;
  speakingLevel: string;

  // Detailed stats (Pro only)
  messageCount: number;
  averageMessageLength: number;

  // Session info
  isComplete: boolean;
}

/**
 * Get learning summary for a voice conversation session
 */
export const getSessionSummary = functions.https.onCall(
  async (data: SessionSummaryRequest, context): Promise<SessionSummaryResponse> => {
    const userId = verifyAuth(context);
    const {sessionId} = data;

    if (!sessionId) {
      throw new AppError("INVALID_INPUT", "Session ID required", 400);
    }

    try {
      const sessionDoc = await getDb().collection("sessions").doc(sessionId).get();

      if (!sessionDoc.exists) {
        throw new AppError("NOT_FOUND", "Session not found", 404);
      }

      const session = sessionDoc.data() as SessionDocument;

      if (session.userId !== userId) {
        throw new AppError("FORBIDDEN", "Not your session", 403);
      }

      // Calculate basic stats
      const totalDurationMinutes = Math.round(session.totalDurationSeconds / 60);
      const totalSpeaking = session.userSpeakingSeconds + session.aiSpeakingSeconds;
      const userSpeakingPercentage = totalSpeaking > 0
        ? Math.round((session.userSpeakingSeconds / totalSpeaking) * 100)
        : 0;

      // Determine speaking level based on participation
      let speakingLevel = "초급 (Beginner)";
      if (userSpeakingPercentage >= 60) {
        speakingLevel = "고급 (Advanced)";
      } else if (userSpeakingPercentage >= 45) {
        speakingLevel = "중급 (Intermediate)";
      } else if (userSpeakingPercentage >= 30) {
        speakingLevel = "초중급 (Pre-Intermediate)";
      }

      // Get message stats
      const messagesSnapshot = await getDb()
        .collection("messages")
        .where("sessionId", "==", sessionId)
        .where("role", "==", "user")
        .get();

      const userMessages = messagesSnapshot.docs.map(doc => doc.data() as MessageDocument);
      const avgLength = userMessages.length > 0
        ? Math.round(userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length)
        : 0;

      return {
        totalDurationMinutes,
        userSpeakingPercentage,
        speakingLevel,
        messageCount: session.messageCount,
        averageMessageLength: avgLength,
        isComplete: !session.isPaused,
      };
    } catch (error: any) {
      functions.logger.error("Session summary error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "SUMMARY_ERROR",
        `Failed to get summary: ${error.message}`,
        500
      );
    }
  }
);

/**
 * End a voice session (mark as complete, not paused)
 */
export const endSession = functions.https.onCall(
  async (data: { sessionId: string }, context) => {
    const userId = verifyAuth(context);
    const {sessionId} = data;

    if (!sessionId) {
      throw new AppError("INVALID_INPUT", "Session ID required", 400);
    }

    const sessionRef = getDb().collection("sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      throw new AppError("FORBIDDEN", "Not your session", 403);
    }

    await sessionRef.update({
      isPaused: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true};
  }
);
