import * as admin from "firebase-admin";
import {
  calculateLevel,
  getXPForLevel,
  getLevelTitle,
  getLevelBadge,
} from "./levelCalculator";

// Lazy initialization
function getDb() {
  return admin.firestore();
}

/**
 * XP Update Result
 */
export interface XPUpdate {
  xpEarned: number;
  totalXP: number;
  currentLevel: number;
  leveledUp: boolean;
  previousLevel?: number;
  levelUpReward?: {
    badge: string;
    title: string;
    xpBonus: number;
  };
}

/**
 * XP Activity Types and Amounts
 */
export const XP_REWARDS = {
  TEXT_MESSAGE: 5,
  VOICE_MESSAGE: 10,
  TUTOR_LESSON: 50,
  PRONUNCIATION_BONUS: 5, // 90%+ accuracy
  DAILY_GOAL: 100,
  STREAK_7_DAY: 100,
  STREAK_30_DAY: 500,
  STREAK_100_DAY: 2000,
  STREAK_365_DAY: 10000,
} as const;

/**
 * XP Manager
 * XP 및 Level 시스템
 */
export class XPManager {
  /**
   * Grant XP to user
   */
  static async grantXP(
    userId: string,
    amount: number,
    reason: string
  ): Promise<XPUpdate> {
    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    return getDb().runTransaction(async (transaction) => {
      const doc = await transaction.get(gamificationRef);
      const data = doc.data() || {
        xp: 0,
        level: 0,
        xpHistory: [],
      };

      const previousXP = data.xp || 0;
      const newXP = previousXP + amount;
      const previousLevel = calculateLevel(previousXP);
      const newLevel = calculateLevel(newXP);
      const leveledUp = newLevel > previousLevel;

      // Update XP
      const updateData: any = {
        xp: newXP,
        level: newLevel,
        levelTitle: getLevelTitle(newLevel),
        levelBadge: getLevelBadge(newLevel),
        xpHistory: admin.firestore.FieldValue.arrayUnion({
          amount,
          reason,
          timestamp: admin.firestore.Timestamp.now(),
          totalXP: newXP,
        }),
      };

      transaction.set(gamificationRef, updateData, { merge: true });

      // Handle level up
      let levelUpReward;
      if (leveledUp) {
        levelUpReward = await this.grantLevelUpReward(
          userId,
          newLevel,
          transaction
        );
      }

      return {
        xpEarned: amount,
        totalXP: newXP,
        currentLevel: newLevel,
        leveledUp,
        previousLevel: leveledUp ? previousLevel : undefined,
        levelUpReward,
      };
    });
  }

  /**
   * Grant level up reward
   */
  private static async grantLevelUpReward(
    userId: string,
    level: number,
    transaction: admin.firestore.Transaction
  ): Promise<{ badge: string; title: string; xpBonus: number }> {
    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    const title = getLevelTitle(level);
    const badge = getLevelBadge(level);
    const xpBonus = level * 10; // Bonus XP for leveling up

    // Grant badge
    transaction.update(gamificationRef, {
      badges: admin.firestore.FieldValue.arrayUnion({
        id: `level_${level}`,
        name: `${title} 달성`,
        earnedAt: admin.firestore.Timestamp.now(),
        level,
      }),
    });

    return {
      badge,
      title,
      xpBonus,
    };
  }

  /**
   * Get user XP status
   */
  static async getXPStatus(userId: string): Promise<{
    totalXP: number;
    currentLevel: number;
    levelTitle: string;
    levelBadge: string;
    xpInCurrentLevel: number;
    xpRequiredForNextLevel: number;
    progress: number;
  }> {
    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    const doc = await gamificationRef.get();
    const data = doc.data() || {
      xp: 0,
      level: 0,
    };

    const totalXP = data.xp || 0;
    const currentLevel = calculateLevel(totalXP);
    const xpForCurrentLevel = getXPForLevel(currentLevel);
    const xpForNextLevel = getXPForLevel(currentLevel + 1);

    const xpInCurrentLevel = totalXP - xpForCurrentLevel;
    const xpRequiredForNextLevel = xpForNextLevel - xpForCurrentLevel;
    const progress = xpInCurrentLevel / xpRequiredForNextLevel;

    return {
      totalXP,
      currentLevel,
      levelTitle: getLevelTitle(currentLevel),
      levelBadge: getLevelBadge(currentLevel),
      xpInCurrentLevel,
      xpRequiredForNextLevel,
      progress,
    };
  }

  /**
   * Get daily XP earned
   */
  static async getDailyXP(userId: string): Promise<number> {
    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    const doc = await gamificationRef.get();
    const data = doc.data();
    const history = data?.xpHistory || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyXP = 0;
    history.forEach((entry: any) => {
      const entryDate = entry.timestamp.toDate();
      if (entryDate >= today) {
        dailyXP += entry.amount;
      }
    });

    return dailyXP;
  }

  /**
   * Get weekly XP earned
   */
  static async getWeeklyXP(userId: string): Promise<number> {
    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    const doc = await gamificationRef.get();
    const data = doc.data();
    const history = data?.xpHistory || [];

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let weeklyXP = 0;
    history.forEach((entry: any) => {
      const entryDate = entry.timestamp.toDate();
      if (entryDate >= oneWeekAgo) {
        weeklyXP += entry.amount;
      }
    });

    return weeklyXP;
  }

  /**
   * Get XP leaderboard (top 10)
   */
  static async getLeaderboard(limit: number = 10): Promise<
    Array<{
      userId: string;
      displayName: string;
      totalXP: number;
      level: number;
      levelTitle: string;
      levelBadge: string;
    }>
  > {
    const usersRef = getDb().collection("users");

    // Query top users by XP
    const snapshot = await usersRef
      .orderBy("gamification.stats.xp", "desc")
      .limit(limit)
      .get();

    const leaderboard: Array<{
      userId: string;
      displayName: string;
      totalXP: number;
      level: number;
      levelTitle: string;
      levelBadge: string;
    }> = [];

    for (const doc of snapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();

      // Get gamification stats
      const gamificationRef = doc.ref.collection("gamification").doc("stats");
      const gamificationDoc = await gamificationRef.get();
      const gamificationData = gamificationDoc.data() || { xp: 0, level: 0 };

      const totalXP = gamificationData.xp || 0;
      const level = calculateLevel(totalXP);

      leaderboard.push({
        userId,
        displayName: userData.displayName || "익명",
        totalXP,
        level,
        levelTitle: getLevelTitle(level),
        levelBadge: getLevelBadge(level),
      });
    }

    return leaderboard;
  }
}
