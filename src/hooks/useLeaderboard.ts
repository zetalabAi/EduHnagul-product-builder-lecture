/**
 * useLeaderboard Hook
 * Global Leaderboard
 */

import { useState, useEffect, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";
import type { GlobalLeaderboardEntry } from "../types/league";

export function useLeaderboard(userId: string | null) {
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<GlobalLeaderboardEntry | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load global leaderboard
  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      const getGlobalLeaderboardFn = httpsCallable(
        functions,
        "getGlobalLeaderboard"
      );
      const result = await getGlobalLeaderboardFn({});
      const data = result.data as any;

      setLeaderboard(data.rankings || []);

      // Find user's entry
      const myEntry = data.rankings?.find(
        (r: GlobalLeaderboardEntry) => r.userId === userId
      );
      setUserEntry(myEntry || null);

      setLoading(false);
    } catch (err: any) {
      console.error("Error loading leaderboard:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [userId]);

  // Auto-load on mount
  useEffect(() => {
    if (userId) {
      loadLeaderboard();
    } else {
      setLeaderboard([]);
      setUserEntry(null);
      setLoading(false);
    }
  }, [userId, loadLeaderboard]);

  // Get top N users
  const getTopUsers = useCallback(
    (n: number) => {
      return leaderboard.slice(0, n);
    },
    [leaderboard]
  );

  // Get users by tier
  const getUsersByTier = useCallback(
    (tier: string) => {
      return leaderboard.filter((entry) => entry.tier === tier);
    },
    [leaderboard]
  );

  return {
    leaderboard,
    userEntry,
    loading,
    error,
    loadLeaderboard,
    getTopUsers,
    getUsersByTier,
  };
}
