/**
 * League System Functions
 * Weekly Leagues & Global Leaderboard
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

function getDb() {
  return admin.firestore();
}

type LeagueTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

interface TierConfig {
  tier: LeagueTier;
  minXP: number;
  maxDivisionSize: number;
  promotionRate: number;
  relegationRate: number;
  rewards: {
    weeklyWinner: number;
    promotion: number;
  };
}

const TIER_CONFIGS: Record<LeagueTier, TierConfig> = {
  diamond: {
    tier: "diamond",
    minXP: 10000,
    maxDivisionSize: 50,
    promotionRate: 0,
    relegationRate: 0.15,
    rewards: { weeklyWinner: 500, promotion: 0 },
  },
  platinum: {
    tier: "platinum",
    minXP: 5000,
    maxDivisionSize: 50,
    promotionRate: 0.1,
    relegationRate: 0.2,
    rewards: { weeklyWinner: 300, promotion: 200 },
  },
  gold: {
    tier: "gold",
    minXP: 2000,
    maxDivisionSize: 100,
    promotionRate: 0.1,
    relegationRate: 0.2,
    rewards: { weeklyWinner: 200, promotion: 150 },
  },
  silver: {
    tier: "silver",
    minXP: 500,
    maxDivisionSize: 200,
    promotionRate: 0.1,
    relegationRate: 0.2,
    rewards: { weeklyWinner: 100, promotion: 100 },
  },
  bronze: {
    tier: "bronze",
    minXP: 0,
    maxDivisionSize: 500,
    promotionRate: 0.15,
    relegationRate: 0,
    rewards: { weeklyWinner: 50, promotion: 50 },
  },
};

const TIER_ORDER: LeagueTier[] = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
];

/**
 * Update Weekly XP
 * Called by XP grant triggers
 */
export const updateWeeklyXP = functions.https.onCall(
  async (data: { userId: string; xp: number }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { userId, xp } = data;
    const db = getDb();

    const weekNumber = getCurrentWeekNumber();
    const weeklyXPRef = db.collection("weeklyXP").doc(`${userId}_${weekNumber}`);

    await weeklyXPRef.set(
      {
        userId,
        week: weekNumber,
        xp: admin.firestore.FieldValue.increment(xp),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, weeklyXP: xp };
  }
);

/**
 * Process Week End
 * Scheduled function (runs every Monday 00:00)
 */
export const processWeekEnd = functions.pubsub
  .schedule("0 0 * * 1") // Every Monday at midnight
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    const db = getDb();
    const lastWeek = getCurrentWeekNumber() - 1;

    console.log(`Processing week ${lastWeek} end...`);

    // 1. Get all weekly XP for last week
    const weeklyXPSnapshot = await db
      .collection("weeklyXP")
      .where("week", "==", lastWeek)
      .get();

    if (weeklyXPSnapshot.empty) {
      console.log("No weekly XP data found");
      return null;
    }

    // 2. Group users by tier and division
    const leagueGroups: Record<string, any[]> = {};

    for (const doc of weeklyXPSnapshot.docs) {
      const data = doc.data();
      const userId = data.userId;

      // Get user's league info
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data()!;

      const tier = userData.league?.currentTier || "bronze";
      const division = userData.league?.currentDivision || 1;
      const key = `${tier}_${division}`;

      if (!leagueGroups[key]) {
        leagueGroups[key] = [];
      }

      leagueGroups[key].push({
        userId,
        weeklyXP: data.xp,
        tier,
        division,
        totalXP: userData.totalXP || 0,
      });
    }

    // 3. Process each league group
    for (const [key, users] of Object.entries(leagueGroups)) {
      const [tier, division] = key.split("_");
      await processLeagueGroup(
        tier as LeagueTier,
        parseInt(division),
        users,
        lastWeek
      );
    }

    console.log("Week end processing completed");
    return null;
  });

/**
 * Calculate Rankings for a league division
 */
export const calculateRankings = functions.https.onCall(
  async (data: { tier: LeagueTier; division: number }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { tier, division } = data;
    const db = getDb();
    const weekNumber = getCurrentWeekNumber();

    // Get all users in this league
    const usersSnapshot = await db
      .collection("users")
      .where("league.currentTier", "==", tier)
      .where("league.currentDivision", "==", division)
      .get();

    const rankings: any[] = [];

    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();

      // Get weekly XP
      const weeklyXPDoc = await db
        .collection("weeklyXP")
        .doc(`${userId}_${weekNumber}`)
        .get();

      const weeklyXP = weeklyXPDoc.exists ? weeklyXPDoc.data()!.xp || 0 : 0;

      rankings.push({
        userId,
        displayName: userData.displayName || "익명",
        photoURL: userData.photoURL || "",
        weeklyXP,
        totalXP: userData.totalXP || 0,
        rank: 0, // Will be set below
      });
    }

    // Sort by weekly XP
    rankings.sort((a, b) => b.weeklyXP - a.weeklyXP);

    // Add rank
    rankings.forEach((user, index) => {
      user.rank = index + 1;
    });

    return { rankings };
  }
);

/**
 * Get Global Leaderboard (Top 100)
 */
export const getGlobalLeaderboard = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const db = getDb();

    // Get top 100 users by total XP
    const usersSnapshot = await db
      .collection("users")
      .orderBy("totalXP", "desc")
      .limit(100)
      .get();

    const rankings = usersSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: doc.id,
        displayName: data.displayName || "익명",
        photoURL: data.photoURL || "",
        totalXP: data.totalXP || 0,
        rank: index + 1,
        level: data.level || 1,
        currentStreak: data.currentStreak || 0,
        tier: data.league?.currentTier || "bronze",
      };
    });

    return { rankings };
  }
);

/**
 * Initialize User League
 */
export const initializeUserLeague = functions.https.onCall(
  async (data: { userId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { userId } = data;
    const db = getDb();

    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data()!;

    // Determine tier based on total XP
    const totalXP = userData.totalXP || 0;
    const tier = getTierByXP(totalXP);

    // Assign to division 1 by default (can be refined later)
    await userDoc.ref.update({
      "league.currentTier": tier,
      "league.currentDivision": 1,
      "league.weeklyXP": 0,
      "league.weekStartDate": admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      tier,
      division: 1,
    };
  }
);

/**
 * Helper: Process a single league group
 */
async function processLeagueGroup(
  tier: LeagueTier,
  division: number,
  users: any[],
  weekNumber: number
) {
  const db = getDb();
  const config = TIER_CONFIGS[tier];

  // Sort by weekly XP
  users.sort((a, b) => b.weeklyXP - a.weeklyXP);

  const totalUsers = users.length;
  const promotionCount = Math.floor(totalUsers * config.promotionRate);
  const relegationCount = Math.floor(totalUsers * config.relegationRate);

  const batch = db.batch();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const rank = i + 1;

    let promotion = false;
    let relegation = false;
    let xpReward = 0;

    // Winner reward
    if (rank === 1) {
      xpReward += config.rewards.weeklyWinner;
    }

    // Promotion
    if (rank <= promotionCount && config.promotionRate > 0) {
      promotion = true;
      xpReward += config.rewards.promotion;

      // Move to next tier
      const nextTier = getNextTier(tier);
      if (nextTier) {
        batch.update(db.collection("users").doc(user.userId), {
          "league.currentTier": nextTier,
          "league.currentDivision": 1,
          "league.weeklyXP": 0,
        });
      }
    }
    // Relegation
    else if (
      rank > totalUsers - relegationCount &&
      config.relegationRate > 0
    ) {
      relegation = true;

      // Move to previous tier
      const prevTier = getPreviousTier(tier);
      if (prevTier) {
        batch.update(db.collection("users").doc(user.userId), {
          "league.currentTier": prevTier,
          "league.currentDivision": 1,
          "league.weeklyXP": 0,
        });
      }
    } else {
      // Stay in same tier, reset weekly XP
      batch.update(db.collection("users").doc(user.userId), {
        "league.weeklyXP": 0,
      });
    }

    // Grant XP reward
    if (xpReward > 0) {
      batch.update(db.collection("users").doc(user.userId), {
        totalXP: admin.firestore.FieldValue.increment(xpReward),
      });
    }

    // Save history
    const historyRef = db
      .collection("users")
      .doc(user.userId)
      .collection("leagueHistory")
      .doc();

    batch.set(historyRef, {
      week: weekNumber,
      tier,
      division,
      weeklyXP: user.weeklyXP,
      rank,
      promoted: promotion,
      relegated: relegation,
      xpReward,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(
    `Processed ${tier} division ${division}: ${users.length} users`
  );
}

/**
 * Helper: Get tier by total XP
 */
function getTierByXP(totalXP: number): LeagueTier {
  if (totalXP >= 10000) return "diamond";
  if (totalXP >= 5000) return "platinum";
  if (totalXP >= 2000) return "gold";
  if (totalXP >= 500) return "silver";
  return "bronze";
}

/**
 * Helper: Get next tier
 */
function getNextTier(tier: LeagueTier): LeagueTier | null {
  const index = TIER_ORDER.indexOf(tier);
  if (index === TIER_ORDER.length - 1) return null;
  return TIER_ORDER[index + 1];
}

/**
 * Helper: Get previous tier
 */
function getPreviousTier(tier: LeagueTier): LeagueTier | null {
  const index = TIER_ORDER.indexOf(tier);
  if (index === 0) return null;
  return TIER_ORDER[index - 1];
}

/**
 * Helper: Get current week number
 */
function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}
