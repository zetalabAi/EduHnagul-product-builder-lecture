import { useState, useEffect, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export interface StreakStatus {
  streak: number;
  longestStreak: number;
  freezeCount: number;
  lastActivityDate: Date | null;
  isActiveToday: boolean;
}

export interface StreakCalendarDay {
  date: Date;
  active: boolean;
  freezeUsed?: boolean;
}

/**
 * useStreak Hook
 * Manage user streak data
 */
export function useStreak() {
  const [streakStatus, setStreakStatus] = useState<StreakStatus | null>(null);
  const [calendar, setCalendar] = useState<StreakCalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch streak status
   */
  const fetchStreakStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const getStreakStatusFn = httpsCallable<
        {},
        {
          streak: number;
          longestStreak: number;
          freezeCount: number;
          lastActivityDate: { _seconds: number; _nanoseconds: number } | null;
          isActiveToday: boolean;
        }
      >(functions, "getStreakStatus");

      const result = await getStreakStatusFn({});
      const data = result.data;

      setStreakStatus({
        ...data,
        lastActivityDate: data.lastActivityDate
          ? new Date(data.lastActivityDate._seconds * 1000)
          : null,
      });
    } catch (err: any) {
      console.error("Failed to fetch streak status:", err);
      setError(err.message || "Failed to load streak data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch streak calendar
   */
  const fetchCalendar = useCallback(async () => {
    try {
      const getStreakCalendarFn = httpsCallable<
        {},
        Array<{
          date: { _seconds: number; _nanoseconds: number };
          active: boolean;
          freezeUsed?: boolean;
        }>
      >(functions, "getStreakCalendar");

      const result = await getStreakCalendarFn({});
      const calendarData = result.data.map((day) => ({
        date: new Date(day.date._seconds * 1000),
        active: day.active,
        freezeUsed: day.freezeUsed,
      }));

      setCalendar(calendarData);
    } catch (err: any) {
      console.error("Failed to fetch streak calendar:", err);
    }
  }, []);

  /**
   * Record activity
   */
  const recordActivity = useCallback(async () => {
    try {
      const recordActivityFn = httpsCallable<
        {},
        {
          streak: number;
          longestStreak: number;
          increased: boolean;
          reset?: boolean;
          freezeUsed?: boolean;
          milestone?: {
            badge: string;
            xp: number;
          };
        }
      >(functions, "recordActivity");

      const result = await recordActivityFn({});
      const update = result.data;

      // Update local state
      setStreakStatus((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          streak: update.streak,
          longestStreak: update.longestStreak,
          isActiveToday: true,
        };
      });

      // Show milestone notification
      if (update.milestone) {
        alert(
          `🎉 ${update.streak}일 연속 달성! ${update.milestone.xp} XP 획득!`
        );
      }

      return update;
    } catch (err: any) {
      console.error("Failed to record activity:", err);
      throw err;
    }
  }, []);

  // Load streak status on mount
  useEffect(() => {
    fetchStreakStatus();
    fetchCalendar();
  }, [fetchStreakStatus, fetchCalendar]);

  return {
    streakStatus,
    calendar,
    isLoading,
    error,
    recordActivity,
    refreshStreak: fetchStreakStatus,
    refreshCalendar: fetchCalendar,
  };
}
