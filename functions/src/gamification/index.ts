import * as functions from "firebase-functions";
import { StreakManager } from "./streakManager";
import { XPManager, XP_REWARDS } from "./xpManager";

/**
 * Record user activity and update streak
 */
export const recordActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;

  try {
    const result = await StreakManager.recordActivity(userId);
    return result;
  } catch (error: any) {
    console.error("recordActivity error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get streak status
 */
export const getStreakStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;

  try {
    const result = await StreakManager.getStreakStatus(userId);
    return result;
  } catch (error: any) {
    console.error("getStreakStatus error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get streak calendar (last 30 days)
 */
export const getStreakCalendar = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;

    try {
      const result = await StreakManager.getStreakCalendar(userId);
      return result;
    } catch (error: any) {
      console.error("getStreakCalendar error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * Grant streak freeze
 */
export const grantStreakFreeze = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;
    const { count = 1 } = data;

    try {
      await StreakManager.grantFreeze(userId, count);
      return { success: true, count };
    } catch (error: any) {
      console.error("grantStreakFreeze error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * Grant XP to user
 */
export const grantXP = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;
  const { amount, reason } = data;

  if (!amount || !reason) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "amount and reason are required"
    );
  }

  try {
    const result = await XPManager.grantXP(userId, amount, reason);
    return result;
  } catch (error: any) {
    console.error("grantXP error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get XP status
 */
export const getXPStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;

  try {
    const result = await XPManager.getXPStatus(userId);
    return result;
  } catch (error: any) {
    console.error("getXPStatus error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get daily XP earned
 */
export const getDailyXP = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;

  try {
    const result = await XPManager.getDailyXP(userId);
    return { dailyXP: result };
  } catch (error: any) {
    console.error("getDailyXP error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get weekly XP earned
 */
export const getWeeklyXP = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;

  try {
    const result = await XPManager.getWeeklyXP(userId);
    return { weeklyXP: result };
  } catch (error: any) {
    console.error("getWeeklyXP error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get XP leaderboard
 */
export const getXPLeaderboard = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { limit = 10 } = data;

    try {
      const result = await XPManager.getLeaderboard(limit);
      return { leaderboard: result };
    } catch (error: any) {
      console.error("getXPLeaderboard error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

// Export XP rewards for reference
export { XP_REWARDS };
