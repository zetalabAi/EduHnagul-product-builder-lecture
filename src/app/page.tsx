"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LearningMode, DailyMission } from "@/types/gamification";
import { useUserProgress } from "@/hooks/useUserProgress";

// Components
import WelcomeHeader from "@/components/HomePage/WelcomeHeader";
import ModeCards from "@/components/HomePage/ModeCards";
import QuickStart from "@/components/HomePage/QuickStart";
import ProgressWidget from "@/components/HomePage/ProgressWidget";
import DailyMissions from "@/components/HomePage/DailyMissions";
import GardenPreview from "@/components/HomePage/GardenPreview";

/**
 * Edu_Hangul 2.0 Home Page
 * 게임화 요소를 포함한 새로운 홈페이지
 */
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Fetch user progress data
  const progressData = useUserProgress(user?.uid || null);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/signin");
      } else {
        setUser(currentUser);
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Learning Modes
  const learningModes: LearningMode[] = [
    {
      id: "conversation",
      title: "실전 회화",
      subtitle: "친구처럼 자연스러운 한국어 대화",
      icon: "💬",
      color: "from-blue-500 to-purple-600",
      available: true,
      route: "/chat",
    },
    {
      id: "tutor",
      title: "AI 튜터",
      subtitle: "체계적인 문법과 어휘 학습",
      icon: "🎓",
      color: "from-green-500 to-teal-600",
      available: false, // 곧 추가 예정
      route: "/tutor",
    },
  ];

  // Mission click handler
  const handleMissionClick = (mission: DailyMission) => {
    if (mission.completed) return;

    // Navigate based on mission type
    switch (mission.type) {
      case "chat":
        router.push("/chat");
        break;
      case "voice":
        router.push("/voice");
        break;
      case "practice":
        router.push("/garden");
        break;
      default:
        break;
    }
  };

  // Loading state
  if (isAuthLoading || progressData.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (progressData.error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            데이터 로딩 실패
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {progressData.error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <WelcomeHeader
          userName={progressData.userProgress.displayName}
          streak={progressData.streak.currentStreak}
          profileImage={user?.photoURL}
        />

        {/* Main Layout: 2-column on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Mode Cards */}
            <ModeCards modes={learningModes} />

            {/* Quick Start */}
            <QuickStart />

            {/* Daily Missions */}
            <DailyMissions
              missions={progressData.dailyMissions}
              onMissionClick={handleMissionClick}
            />
          </div>

          {/* Right Column (1/3 width on desktop) */}
          <div className="space-y-6">
            {/* Progress Widget */}
            <ProgressWidget
              xpProgress={progressData.xpProgress}
              weeklyProgress={progressData.weeklyProgress}
              streak={progressData.streak}
            />

            {/* Mistake Garden Preview */}
            <GardenPreview items={progressData.mistakeGarden} />
          </div>
        </div>

        {/* Bottom Navigation (Mobile) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-around">
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center gap-1 text-primary-600 dark:text-primary-400"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs font-medium">홈</span>
          </button>

          <button
            onClick={() => router.push("/chat")}
            className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium">채팅</span>
          </button>

          <button
            onClick={() => router.push("/garden")}
            className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400"
          >
            <span className="text-2xl">🌸</span>
            <span className="text-xs font-medium">정원</span>
          </button>

          <button
            onClick={() => router.push("/settings")}
            className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium">설정</span>
          </button>
        </div>
      </div>
    </div>
  );
}
