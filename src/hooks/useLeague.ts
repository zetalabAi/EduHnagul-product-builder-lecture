/**
 * useLeague Hook
 * Weekly League System
 */

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import type { League, WeeklyRank, LeagueHistory } from "../types/league";

export function useLeague(userId: string | null) {
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [rankings, setRankings] = useState<WeeklyRank[]>([]);
  const [userRank, setUserRank] = useState<WeeklyRank | null>(null);
  const [history, setHistory] = useState<LeagueHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time league data
  useEffect(() => {
    if (!userId) {
      setCurrentLeague(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const leagueData = data.league;

          if (leagueData) {
            setCurrentLeague({
              tier: leagueData.currentTier || "bronze",
              division: leagueData.currentDivision || 1,
              currentWeek: getCurrentWeekNumber(),
              weekStartDate: getWeekStartDate(),
              weekEndDate: getWeekEndDate(),
            });
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error loading league data:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Load rankings
  const loadRankings = useCallback(
    async (tier: string, division: number) => {
      try {
        const calculateRankingsFn = httpsCallable(
          functions,
          "calculateRankings"
        );
        const result = await calculateRankingsFn({ tier, division });
        const data = result.data as any;

        setRankings(data.rankings || []);

        // Find user's rank
        const myRank = data.rankings?.find(
          (r: WeeklyRank) => r.userId === userId
        );
        setUserRank(myRank || null);

        return data.rankings;
      } catch (err: any) {
        console.error("Error loading rankings:", err);
        throw new Error(err.message || "순위 조회에 실패했습니다.");
      }
    },
    [userId]
  );

  // Initialize user league (for new users)
  const initializeLeague = useCallback(async () => {
    if (!userId) return;

    try {
      const initializeUserLeagueFn = httpsCallable(
        functions,
        "initializeUserLeague"
      );
      const result = await initializeUserLeagueFn({ userId });
      return result.data;
    } catch (err: any) {
      console.error("Error initializing league:", err);
      throw new Error(err.message || "리그 초기화에 실패했습니다.");
    }
  }, [userId]);

  // Update weekly XP
  const updateWeeklyXP = useCallback(
    async (xp: number) => {
      if (!userId) return;

      try {
        const updateWeeklyXPFn = httpsCallable(functions, "updateWeeklyXP");
        const result = await updateWeeklyXPFn({ userId, xp });
        return result.data;
      } catch (err: any) {
        console.error("Error updating weekly XP:", err);
        throw new Error(err.message || "주간 XP 업데이트에 실패했습니다.");
      }
    },
    [userId]
  );

  // Get time remaining in week
  const getTimeRemainingInWeek = useCallback(() => {
    const now = new Date();
    const endOfWeek = getWeekEndDate();
    const diff = endOfWeek.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, total: diff };
  }, []);

  return {
    currentLeague,
    rankings,
    userRank,
    history,
    loading,
    error,
    loadRankings,
    initializeLeague,
    updateWeeklyXP,
    getTimeRemainingInWeek,
  };
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

/**
 * Helper: Get week start date (Monday)
 */
function getWeekStartDate(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Helper: Get week end date (Sunday 23:59:59)
 */
function getWeekEndDate(): Date {
  const monday = getWeekStartDate();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}
