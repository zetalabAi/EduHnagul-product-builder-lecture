import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import {UserDocument} from "../types";
import {AppError} from "../utils/errors";

// Lazy initialization to avoid issues before admin.initializeApp()
function getDb() {
  return admin.firestore();
}

/**
 * Get weekly minute limits based on subscription tier
 *
 * 🧪 TEST MODE: All tiers unlimited during testing
 * Note: -1 represents unlimited (Infinity cannot be JSON serialized)
 */
export function getWeeklyMinuteLimit(tier: UserDocument["subscriptionTier"]): number {
  // 🧪 TEST MODE: Unlimited for all tiers
  return -1;

  /* Original limits (restore after testing):
  switch (tier) {
  case "free":
    return 15;
  case "free+":
    return 25;
  case "pro":
  case "pro+":
    return -1; // Unlimited (was Infinity)
  default:
    return 15;
  }
  */
}

/**
 * Check if weekly credits should be reset (7-day cycle)
 */
function shouldResetWeeklyCredits(
  user: UserDocument,
  now: admin.firestore.Timestamp
): boolean {
  return !user.weeklyResetAt || user.weeklyResetAt.toMillis() <= now.toMillis();
}

/**
 * Check if user has enough credits for voice chat
 * Returns remaining minutes
 */
export async function checkVoiceCredits(userId: string): Promise<number> {
  const userRef = getDb().collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new AppError("USER_NOT_FOUND", "User not found", 404);
  }

  const user = userDoc.data() as UserDocument;
  const now = Timestamp.now();

  // Check if weekly reset is needed (7-day cycle from first conversation)
  if (!user.weeklyResetAt || user.weeklyResetAt.toMillis() <= now.toMillis()) {
    // Reset credits
    await userRef.update({
      weeklyMinutesUsed: 0,
      weeklyResetAt: Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000), // +7 days
      weeklyAssistantUsed: 0, // Also reset assistant usage
    });

    return getWeeklyMinuteLimit(user.subscriptionTier);
  }

  const limit = getWeeklyMinuteLimit(user.subscriptionTier);
  const used = user.weeklyMinutesUsed || 0;
  const remaining = limit < 0 ? -1 : limit - used;

  if (remaining <= 0 && remaining !== -1) {
    const resetDate = user.weeklyResetAt.toDate();
    throw new AppError(
      "QUOTA_EXCEEDED",
      `Weekly voice credits exhausted. Resets on ${resetDate.toISOString()}`,
      429
    );
  }

  return remaining;
}

/**
 * Deduct voice credits after a conversation using transaction for atomicity
 * Returns new remaining minutes
 * Throws error if quota would be exceeded
 */
export async function deductVoiceCredits(
  userId: string,
  durationSeconds: number
): Promise<number> {
  const userRef = getDb().collection("users").doc(userId);
  const minutes = Math.ceil(durationSeconds / 60);

  return await getDb().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new AppError("USER_NOT_FOUND", "User document not found", 404);
    }

    const user = userDoc.data() as UserDocument;

    // Check weekly reset
    const now = admin.firestore.Timestamp.now();
    const needsReset = shouldResetWeeklyCredits(user, now);

    let currentUsed = user.weeklyMinutesUsed || 0;
    if (needsReset) {
      currentUsed = 0;
    }

    const weeklyLimit = getWeeklyMinuteLimit(user.subscriptionTier);

    // Pro/Pro+ have unlimited
    if (weeklyLimit < 0) {
      const updateData: any = {
        weeklyMinutesUsed: admin.firestore.FieldValue.increment(minutes),
      };
      if (needsReset) {
        updateData.weeklyResetAt = admin.firestore.Timestamp.fromMillis(
          now.toMillis() + 7 * 24 * 60 * 60 * 1000
        );
      }
      transaction.update(userRef, updateData);
      return -1; // Unlimited (was Infinity)
    }

    // Check if deduction would exceed limit
    const newUsed = currentUsed + minutes;
    if (newUsed > weeklyLimit) {
      const resetDate = needsReset
        ? new Date(now.toMillis() + 7 * 24 * 60 * 60 * 1000)
        : user.weeklyResetAt.toDate();
      throw new AppError(
        "QUOTA_EXCEEDED",
        `Weekly voice credits exhausted. Resets on ${resetDate.toISOString()}`,
        429
      );
    }

    // Perform atomic update
    const updateData: any = needsReset
      ? {
          weeklyMinutesUsed: minutes,
          weeklyResetAt: admin.firestore.Timestamp.fromMillis(
            now.toMillis() + 7 * 24 * 60 * 60 * 1000
          ),
        }
      : {
          weeklyMinutesUsed: admin.firestore.FieldValue.increment(minutes),
        };

    transaction.update(userRef, updateData);

    return Math.max(0, weeklyLimit - newUsed);
  });
}

/**
 * Check if user can use assistant feature
 */
export async function checkAssistantUsage(userId: string): Promise<boolean> {
  const userRef = getDb().collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new AppError("USER_NOT_FOUND", "User not found", 404);
  }

  const user = userDoc.data() as UserDocument;

  // Pro/Pro+ have unlimited assistant
  if (user.subscriptionTier === "pro" || user.subscriptionTier === "pro+") {
    return true;
  }

  // Free+ has 1 per week
  if (user.subscriptionTier === "free+") {
    return (user.weeklyAssistantUsed || 0) < 1;
  }

  // Free has no assistant
  return false;
}

/**
 * Increment assistant usage counter
 */
export async function incrementAssistantUsage(userId: string): Promise<void> {
  const userRef = getDb().collection("users").doc(userId);

  await userRef.update({
    weeklyAssistantUsed: admin.firestore.FieldValue.increment(1),
  });
}

/**
 * Check if user can use analysis feature
 */
export async function checkAnalysisUsage(userId: string): Promise<boolean> {
  const userRef = getDb().collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new AppError("USER_NOT_FOUND", "User not found", 404);
  }

  const user = userDoc.data() as UserDocument;
  const now = Timestamp.now();

  // Free/Free+: 1회 평생
  if (user.subscriptionTier === "free" || user.subscriptionTier === "free+") {
    return !user.analysisUsedLifetime;
  }

  // Pro/Pro+: Reset daily
  const lastReset = user.lastAnalysisReset;

  // First-time Pro user: initialize analysis tracking
  if (!lastReset) {
    await userRef.update({
      dailyAnalysisUsed: 0,
      lastAnalysisReset: now,
    });
    return true;
  }

  const daysSinceReset = (now.toMillis() - lastReset.toMillis()) / (24 * 60 * 60 * 1000);

  if (daysSinceReset >= 1) {
    // Reset daily quota
    await userRef.update({
      dailyAnalysisUsed: 0,
      lastAnalysisReset: now,
    });
    return true;
  }

  const dailyLimit = user.subscriptionTier === "pro" ? 3 : 7; // Pro+: 7
  return (user.dailyAnalysisUsed || 0) < dailyLimit;
}

/**
 * Increment analysis usage
 */
export async function incrementAnalysisUsage(userId: string, tier: UserDocument["subscriptionTier"]): Promise<void> {
  const userRef = getDb().collection("users").doc(userId);

  if (tier === "free" || tier === "free+") {
    // Mark as used permanently
    await userRef.update({
      analysisUsedLifetime: true,
    });
  } else {
    // Increment daily counter
    await userRef.update({
      dailyAnalysisUsed: admin.firestore.FieldValue.increment(1),
    });
  }
}
