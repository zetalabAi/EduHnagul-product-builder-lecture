/**
 * League System Types
 * Weekly Leagues & Global Leaderboard
 */

export type LeagueTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface League {
  tier: LeagueTier;
  division: number; // 1, 2, 3... (multiple divisions per tier)
  currentWeek: number;
  weekStartDate: Date;
  weekEndDate: Date;
}

export interface WeeklyRank {
  userId: string;
  displayName: string;
  photoURL?: string;
  weeklyXP: number;
  rank: number;
  tier: LeagueTier;
  division: number;
  promotion?: boolean; // Top 10%
  relegation?: boolean; // Bottom 20%
}

export interface GlobalLeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalXP: number;
  rank: number;
  level: number;
  currentStreak: number;
  tier: LeagueTier;
}

export interface LeagueHistory {
  week: number;
  weekStartDate: Date;
  weekEndDate: Date;
  tier: LeagueTier;
  division: number;
  weeklyXP: number;
  rank: number;
  promoted: boolean;
  relegated: boolean;
}

export interface TierConfig {
  tier: LeagueTier;
  minXP: number; // Minimum total XP to qualify
  maxDivisionSize: number; // Max users per division
  promotionRate: number; // 0.1 = top 10%
  relegationRate: number; // 0.2 = bottom 20%
  rewards: {
    weeklyWinner: number; // XP bonus
    promotion: number; // XP bonus for promotion
  };
}

/**
 * League Tier Configuration:
 *
 * Diamond: 10,000+ XP, max 50 per division, top 5% promote (none above), bottom 15% relegate
 * Platinum: 5,000-9,999 XP, max 50 per division, top 10% promote, bottom 20% relegate
 * Gold: 2,000-4,999 XP, max 100 per division, top 10% promote, bottom 20% relegate
 * Silver: 500-1,999 XP, max 200 per division, top 10% promote, bottom 20% relegate
 * Bronze: 0-499 XP, max 500 per division, top 15% promote, bottom 0% relegate (none below)
 */

export const TIER_CONFIGS: Record<LeagueTier, TierConfig> = {
  diamond: {
    tier: "diamond",
    minXP: 10000,
    maxDivisionSize: 50,
    promotionRate: 0, // No tier above
    relegationRate: 0.15,
    rewards: {
      weeklyWinner: 500,
      promotion: 0,
    },
  },
  platinum: {
    tier: "platinum",
    minXP: 5000,
    maxDivisionSize: 50,
    promotionRate: 0.1,
    relegationRate: 0.2,
    rewards: {
      weeklyWinner: 300,
      promotion: 200,
    },
  },
  gold: {
    tier: "gold",
    minXP: 2000,
    maxDivisionSize: 100,
    promotionRate: 0.1,
    relegationRate: 0.2,
    rewards: {
      weeklyWinner: 200,
      promotion: 150,
    },
  },
  silver: {
    tier: "silver",
    minXP: 500,
    maxDivisionSize: 200,
    promotionRate: 0.1,
    relegationRate: 0.2,
    rewards: {
      weeklyWinner: 100,
      promotion: 100,
    },
  },
  bronze: {
    tier: "bronze",
    minXP: 0,
    maxDivisionSize: 500,
    promotionRate: 0.15,
    relegationRate: 0, // No tier below
    rewards: {
      weeklyWinner: 50,
      promotion: 50,
    },
  },
};

/**
 * Firestore Structure:
 *
 * leagues/{tier}_{division}_{weekNumber}
 * {
 *   tier: "gold",
 *   division: 1,
 *   week: 123,
 *   weekStartDate: Timestamp,
 *   weekEndDate: Timestamp,
 *   participants: [userId1, userId2, ...],
 *   rankings: [
 *     { userId: "...", weeklyXP: 850, rank: 1, promotion: true },
 *     { userId: "...", weeklyXP: 720, rank: 2 },
 *     ...
 *   ]
 * }
 *
 * users/{userId}/league
 * {
 *   currentTier: "gold",
 *   currentDivision: 1,
 *   weeklyXP: 500,
 *   totalXP: 2500,
 *   weekStartDate: Timestamp,
 *   history: [
 *     { week: 122, tier: "silver", division: 3, rank: 5, promoted: true },
 *     ...
 *   ]
 * }
 *
 * weeklyXP/{userId}_{weekNumber}
 * {
 *   userId: string,
 *   week: number,
 *   xp: number,
 *   activities: [
 *     { date: Timestamp, xp: 50, source: "lesson_complete" },
 *     ...
 *   ],
 *   lastUpdated: Timestamp
 * }
 *
 * globalLeaderboard (top 100)
 * {
 *   rankings: [
 *     {
 *       userId: "...",
 *       displayName: "...",
 *       totalXP: 15000,
 *       rank: 1,
 *       level: 25,
 *       tier: "diamond"
 *     },
 *     ...
 *   ],
 *   lastUpdated: Timestamp
 * }
 */
