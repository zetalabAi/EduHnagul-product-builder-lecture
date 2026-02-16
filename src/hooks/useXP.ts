import { useState, useEffect, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export interface XPStatus {
  totalXP: number;
  currentLevel: number;
  levelTitle: string;
  levelBadge: string;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progress: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalXP: number;
  level: number;
  levelTitle: string;
  levelBadge: string;
}

/**
 * useXP Hook
 * Manage user XP and level data
 */
export function useXP() {
  const [xpStatus, setXPStatus] = useState<XPStatus | null>(null);
  const [dailyXP, setDailyXP] = useState<number>(0);
  const [weeklyXP, setWeeklyXP] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch XP status
   */
  const fetchXPStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const getXPStatusFn = httpsCallable<{}, XPStatus>(
        functions,
        "getXPStatus"
      );

      const result = await getXPStatusFn({});
      setXPStatus(result.data);
    } catch (err: any) {
      console.error("Failed to fetch XP status:", err);
      setError(err.message || "Failed to load XP data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch daily XP
   */
  const fetchDailyXP = useCallback(async () => {
    try {
      const getDailyXPFn = httpsCallable<{}, { dailyXP: number }>(
        functions,
        "getDailyXP"
      );

      const result = await getDailyXPFn({});
      setDailyXP(result.data.dailyXP);
    } catch (err: any) {
      console.error("Failed to fetch daily XP:", err);
    }
  }, []);

  /**
   * Fetch weekly XP
   */
  const fetchWeeklyXP = useCallback(async () => {
    try {
      const getWeeklyXPFn = httpsCallable<{}, { weeklyXP: number }>(
        functions,
        "getWeeklyXP"
      );

      const result = await getWeeklyXPFn({});
      setWeeklyXP(result.data.weeklyXP);
    } catch (err: any) {
      console.error("Failed to fetch weekly XP:", err);
    }
  }, []);

  /**
   * Fetch leaderboard
   */
  const fetchLeaderboard = useCallback(async (limit: number = 10) => {
    try {
      const getXPLeaderboardFn = httpsCallable<
        { limit: number },
        { leaderboard: LeaderboardEntry[] }
      >(functions, "getXPLeaderboard");

      const result = await getXPLeaderboardFn({ limit });
      setLeaderboard(result.data.leaderboard);
    } catch (err: any) {
      console.error("Failed to fetch leaderboard:", err);
    }
  }, []);

  /**
   * Grant XP manually (for testing or special rewards)
   */
  const grantXP = useCallback(
    async (amount: number, reason: string) => {
      try {
        const grantXPFn = httpsCallable<
          { amount: number; reason: string },
          {
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
        >(functions, "grantXP");

        const result = await grantXPFn({ amount, reason });
        const update = result.data;

        // Update local state
        await fetchXPStatus();
        await fetchDailyXP();
        await fetchWeeklyXP();

        // Show level up notification
        if (update.leveledUp && update.levelUpReward) {
          alert(
            `🎊 레벨 업! ${update.previousLevel} → ${update.currentLevel}\n${update.levelUpReward.title} 달성!`
          );
        }

        return update;
      } catch (err: any) {
        console.error("Failed to grant XP:", err);
        throw err;
      }
    },
    [fetchXPStatus, fetchDailyXP, fetchWeeklyXP]
  );

  // Load XP data on mount
  useEffect(() => {
    fetchXPStatus();
    fetchDailyXP();
    fetchWeeklyXP();
  }, [fetchXPStatus, fetchDailyXP, fetchWeeklyXP]);

  return {
    xpStatus,
    dailyXP,
    weeklyXP,
    leaderboard,
    isLoading,
    error,
    grantXP,
    refreshXP: fetchXPStatus,
    refreshDailyXP: fetchDailyXP,
    refreshWeeklyXP: fetchWeeklyXP,
    fetchLeaderboard,
  };
}
