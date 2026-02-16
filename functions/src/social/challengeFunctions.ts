/**
 * Challenge System Functions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

function getDb() {
  return admin.firestore();
}

interface CreateChallengeRequest {
  friendId: string;
  type: "streak" | "xp" | "lessons";
  goal: number;
  durationDays: number;
}

/**
 * Create Challenge
 */
export const createChallenge = functions.https.onCall(
  async (data: CreateChallengeRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const userId = context.auth.uid;
    const { friendId, type, goal, durationDays } = data;
    const db = getDb();

    // 1. Validate friend relationship
    const friendDoc = await db
      .collection("users")
      .doc(userId)
      .collection("friends")
      .doc(friendId)
      .get();

    if (!friendDoc.exists) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "친구 관계가 아닙니다."
      );
    }

    // 2. Get user profiles
    const userDoc = await db.collection("users").doc(userId).get();
    const friendUserDoc = await db.collection("users").doc(friendId).get();

    const userProfile = userDoc.data()!;
    const friendProfile = friendUserDoc.data()!;

    // 3. Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // 4. Create challenge
    const challengeRef = db.collection("challenges").doc();
    await challengeRef.set({
      type,
      createdBy: userId,
      createdByName: userProfile.displayName || "익명",
      participants: [userId, friendId],
      participantNames: [
        userProfile.displayName || "익명",
        friendProfile.displayName || "익명",
      ],
      status: "active",
      startDate: admin.firestore.Timestamp.fromDate(startDate),
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      goal,
      progress: {
        [userId]: 0,
        [friendId]: 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      challengeId: challengeRef.id,
      challenge: {
        id: challengeRef.id,
        type,
        goal,
        endDate: endDate.toISOString(),
      },
    };
  }
);

/**
 * Update Challenge Progress
 */
export const updateChallenge = functions.https.onCall(
  async (data: { challengeId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const userId = context.auth.uid;
    const { challengeId } = data;
    const db = getDb();

    // 1. Get challenge
    const challengeDoc = await db.collection("challenges").doc(challengeId).get();

    if (!challengeDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "챌린지를 찾을 수 없습니다."
      );
    }

    const challenge = challengeDoc.data()!;

    // 2. Verify participant
    if (!challenge.participants.includes(userId)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "챌린지 참가자가 아닙니다."
      );
    }

    // 3. Check if already completed or expired
    if (challenge.status !== "active") {
      return {
        alreadyCompleted: true,
        winner: challenge.winner,
      };
    }

    // 4. Get current progress based on challenge type
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data()!;

    let currentProgress = 0;

    if (challenge.type === "streak") {
      currentProgress = userData.currentStreak || 0;
    } else if (challenge.type === "xp") {
      // Get weekly XP since challenge started
      const weekNumber = getWeekNumber(challenge.startDate.toDate());
      const weeklyXPDoc = await db
        .collection("weeklyXP")
        .doc(`${userId}_${weekNumber}`)
        .get();

      currentProgress = weeklyXPDoc.exists ? weeklyXPDoc.data()!.xp || 0 : 0;
    } else if (challenge.type === "lessons") {
      // Count completed lessons since challenge started
      const lessonsSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("lessonProgress")
        .where("completedAt", ">=", challenge.startDate)
        .get();

      currentProgress = lessonsSnapshot.size;
    }

    // 5. Update progress
    await challengeDoc.ref.update({
      [`progress.${userId}`]: currentProgress,
    });

    // 6. Check if goal reached
    if (currentProgress >= challenge.goal) {
      await challengeDoc.ref.update({
        status: "completed",
        winner: userId,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        completed: true,
        winner: userId,
        progress: currentProgress,
      };
    }

    return {
      completed: false,
      progress: currentProgress,
    };
  }
);

/**
 * Complete Challenge (called by scheduled function to check expiration)
 */
export const completeChallenge = functions.https.onCall(
  async (data: { challengeId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { challengeId } = data;
    const db = getDb();

    const challengeDoc = await db.collection("challenges").doc(challengeId).get();

    if (!challengeDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "챌린지를 찾을 수 없습니다."
      );
    }

    const challenge = challengeDoc.data()!;

    // Check if expired
    if (challenge.endDate.toDate() > new Date()) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "챌린지가 아직 종료되지 않았습니다."
      );
    }

    // Determine winner
    const progress = challenge.progress;
    const participants = challenge.participants;

    let winner = null;
    let maxProgress = 0;

    for (const userId of participants) {
      if (progress[userId] > maxProgress) {
        maxProgress = progress[userId];
        winner = userId;
      }
    }

    // Update challenge
    await challengeDoc.ref.update({
      status: "completed",
      winner,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      winner,
      progress,
    };
  }
);

/**
 * Send Cheer Message
 */
export const sendCheerMessage = functions.https.onCall(
  async (
    data: {
      friendId: string;
      message: string;
      emoji: string;
    },
    context
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const userId = context.auth.uid;
    const { friendId, message, emoji } = data;
    const db = getDb();

    // 1. Validate friend relationship
    const friendDoc = await db
      .collection("users")
      .doc(userId)
      .collection("friends")
      .doc(friendId)
      .get();

    if (!friendDoc.exists) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "친구 관계가 아닙니다."
      );
    }

    // 2. Get user profile
    const userDoc = await db.collection("users").doc(userId).get();
    const userProfile = userDoc.data()!;

    // 3. Create cheer message
    const cheerRef = db.collection("cheerMessages").doc();
    await cheerRef.set({
      fromUserId: userId,
      fromUserName: userProfile.displayName || "익명",
      fromUserPhoto: userProfile.photoURL || "",
      toUserId: friendId,
      message,
      emoji,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });

    return {
      messageId: cheerRef.id,
      success: true,
    };
  }
);

/**
 * Helper: Get week number from date
 */
function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}
