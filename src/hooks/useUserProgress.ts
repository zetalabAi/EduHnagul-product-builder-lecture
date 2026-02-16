import { useState, useEffect } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import {
  HomePageData,
  UserProgress,
  StreakStatus,
  XPProgress,
  WeeklyProgress,
  DailyMission,
  MistakeGardenItem,
} from "@/types/gamification";

/**
 * useUserProgress Hook
 * Fetch user progress data from Firestore
 */
export function useUserProgress(userId: string | null) {
  const [data, setData] = useState<HomePageData>({
    userProgress: {
      userId: "",
      displayName: "사용자",
      streak: 0,
      streakLastUpdate: null,
      xp: 0,
      dailyXpGoal: 200,
      level: 1,
      weeklyGoal: 1000,
      weeklyXp: 0,
    },
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastUpdateDate: "",
      isActiveToday: false,
    },
    xpProgress: {
      current: 0,
      dailyGoal: 200,
      percentage: 0,
      remaining: 200,
    },
    weeklyProgress: {
      weeklyXp: 0,
      weeklyGoal: 1000,
      percentage: 0,
      daysActive: 0,
    },
    dailyMissions: [],
    mistakeGarden: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const fetchUserProgress = async () => {
      try {
        setData((prev) => ({ ...prev, isLoading: true, error: null }));

        // Fetch streak status from backend
        let streakData = null;
        try {
          const getStreakStatusFn = httpsCallable(functions, "getStreakStatus");
          const streakResult = await getStreakStatusFn({});
          streakData = streakResult.data as any;
        } catch (err) {
          console.error("Failed to fetch streak:", err);
        }

        // Fetch XP status from backend
        let xpData = null;
        let dailyXPData = 0;
        let weeklyXPData = 0;
        try {
          const getXPStatusFn = httpsCallable(functions, "getXPStatus");
          const getDailyXPFn = httpsCallable(functions, "getDailyXP");
          const getWeeklyXPFn = httpsCallable(functions, "getWeeklyXP");

          const [xpResult, dailyResult, weeklyResult] = await Promise.all([
            getXPStatusFn({}),
            getDailyXPFn({}),
            getWeeklyXPFn({}),
          ]);

          xpData = xpResult.data as any;
          dailyXPData = (dailyResult.data as any).dailyXP || 0;
          weeklyXPData = (weeklyResult.data as any).weeklyXP || 0;
        } catch (err) {
          console.error("Failed to fetch XP:", err);
        }

        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // User document doesn't exist - use defaults with backend data
          setData((prev) => ({
            ...prev,
            isLoading: false,
            dailyMissions: getDefaultMissions(),
            userProgress: {
              userId,
              displayName: "사용자",
              streak: streakData?.streak || 0,
              streakLastUpdate: null,
              xp: xpData?.totalXP || 0,
              dailyXpGoal: 200,
              level: xpData?.currentLevel || 1,
              weeklyGoal: 1000,
              weeklyXp: weeklyXPData,
            },
            streak: {
              currentStreak: streakData?.streak || 0,
              longestStreak: streakData?.longestStreak || 0,
              lastUpdateDate: streakData?.lastActivityDate ? new Date(streakData.lastActivityDate._seconds * 1000).toISOString().split("T")[0] : "",
              isActiveToday: streakData?.isActiveToday || false,
            },
            xpProgress: {
              current: dailyXPData,
              dailyGoal: 200,
              percentage: Math.min((dailyXPData / 200) * 100, 100),
              remaining: Math.max(200 - dailyXPData, 0),
            },
            weeklyProgress: {
              weeklyXp: weeklyXPData,
              weeklyGoal: 1000,
              percentage: Math.min((weeklyXPData / 1000) * 100, 100),
              daysActive: 0,
            },
          }));
          return;
        }

        const userData = userDoc.data();

        // User Progress (use backend data if available)
        const userProgress: UserProgress = {
          userId,
          displayName: userData.displayName || "사용자",
          streak: streakData?.streak || userData.streak || 0,
          streakLastUpdate: userData.streakLastUpdate || null,
          xp: xpData?.totalXP || userData.xp || 0,
          dailyXpGoal: userData.dailyXpGoal || 200,
          level: xpData?.currentLevel || userData.level || 1,
          weeklyGoal: userData.weeklyGoal || 1000,
          weeklyXp: weeklyXPData || userData.weeklyXp || 0,
        };

        // Streak Status (use backend data)
        const today = new Date().toISOString().split("T")[0];
        const lastUpdate = streakData?.lastActivityDate
          ? new Date(streakData.lastActivityDate._seconds * 1000).toISOString().split("T")[0]
          : userData.streakLastUpdate
          ? new Date(userData.streakLastUpdate.toDate()).toISOString().split("T")[0]
          : "";

        const streak: StreakStatus = {
          currentStreak: streakData?.streak || userData.streak || 0,
          longestStreak: streakData?.longestStreak || userData.longestStreak || 0,
          lastUpdateDate: lastUpdate,
          isActiveToday: streakData?.isActiveToday || lastUpdate === today,
        };

        // XP Progress (use backend data)
        const dailyGoal = userData.dailyXpGoal || 200;
        const xpProgress: XPProgress = {
          current: dailyXPData,
          dailyGoal,
          percentage: Math.min((dailyXPData / dailyGoal) * 100, 100),
          remaining: Math.max(dailyGoal - dailyXPData, 0),
        };

        // Weekly Progress (use backend data)
        const weeklyGoal = userData.weeklyGoal || 1000;
        const weeklyProgress: WeeklyProgress = {
          weeklyXp: weeklyXPData,
          weeklyGoal,
          percentage: Math.min((weeklyXPData / weeklyGoal) * 100, 100),
          daysActive: userData.daysActiveThisWeek || 0,
        };

        // Daily Missions
        const missions: DailyMission[] = userData.dailyMissions || getDefaultMissions();

        // Mistake Garden
        const garden: MistakeGardenItem[] = userData.mistakeGarden || [];

        setData({
          userProgress,
          streak,
          xpProgress,
          weeklyProgress,
          dailyMissions: missions,
          mistakeGarden: garden,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Failed to fetch user progress:", error);
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: "데이터를 불러오는데 실패했습니다.",
          dailyMissions: getDefaultMissions(),
        }));
      }
    };

    fetchUserProgress();
  }, [userId]);

  return data;
}

/**
 * Get default daily missions
 */
function getDefaultMissions(): DailyMission[] {
  return [
    {
      id: "daily-chat",
      title: "AI와 5번 대화하기",
      description: "텍스트 채팅으로 5개 메시지 보내기",
      xpReward: 50,
      completed: false,
      icon: "💬",
      type: "chat",
      progress: 0,
      target: 5,
    },
    {
      id: "daily-voice",
      title: "음성 대화 3분 하기",
      description: "AI와 음성으로 3분 이상 대화하기",
      xpReward: 75,
      completed: false,
      icon: "🎙️",
      type: "voice",
      progress: 0,
      target: 3,
    },
    {
      id: "daily-practice",
      title: "실수 정원 돌보기",
      description: "실수 정원에서 1개 항목 연습하기",
      xpReward: 30,
      completed: false,
      icon: "🌱",
      type: "practice",
      progress: 0,
      target: 1,
    },
  ];
}
