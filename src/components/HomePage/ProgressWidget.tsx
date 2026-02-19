"use client";

import { memo } from "react";
import { XPProgress, WeeklyProgress, StreakStatus } from "@/types/gamification";

interface ProgressWidgetProps {
  xpProgress: XPProgress;
  weeklyProgress: WeeklyProgress;
  streak: StreakStatus;
}

/**
 * ProgressWidget Component
 * 나의 학습 현황 (Streak, XP, Weekly Goal)
 */
const ProgressWidget = memo(function ProgressWidget({
  xpProgress,
  weeklyProgress,
  streak,
}: ProgressWidgetProps) {
  return (
    <div className="bg-white dark:bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>나의 학습 현황</span>
      </h2>

      <div className="space-y-4">
        {/* Streak Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                연속 학습
              </span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                {streak.currentStreak}일
              </div>
              <div className="text-xs text-gray-500">
                최고: {streak.longestStreak}일
              </div>
            </div>
          </div>
          {streak.isActiveToday && (
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>오늘 활동 완료!</span>
            </div>
          )}
        </div>

        {/* Daily XP */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                오늘 XP
              </span>
            </div>
            <div className="text-lg font-bold text-primary-600">
              {xpProgress.current} / {xpProgress.dailyGoal}
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(xpProgress.percentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {xpProgress.percentage >= 100
              ? "목표 달성! 🎉"
              : `${xpProgress.remaining} XP 남음`}
          </div>
        </div>

        {/* Weekly Goal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                이번 주 목표
              </span>
            </div>
            <div className="text-lg font-bold text-secondary-600">
              {weeklyProgress.weeklyXp} / {weeklyProgress.weeklyGoal}
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-secondary-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(weeklyProgress.percentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
            <span>이번 주 {weeklyProgress.daysActive}일 활동</span>
            <span>{Math.round(weeklyProgress.percentage)}% 달성</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProgressWidget;
