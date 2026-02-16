"use client";

import { memo } from "react";

interface StreakWidgetProps {
  streak: number;
  freezeCount: number;
  isActiveToday: boolean;
  compact?: boolean;
}

/**
 * StreakWidget Component
 * Display current streak with freeze count
 */
const StreakWidget = memo(function StreakWidget({
  streak,
  freezeCount,
  isActiveToday,
  compact = false,
}: StreakWidgetProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
        <span className="text-lg">🔥</span>
        <span className="font-bold">{streak}</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          연속 학습
        </h3>
        {isActiveToday && (
          <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full">
            ✓ 오늘 완료
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="text-4xl">🔥</div>
        <div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {streak}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            일 연속
          </div>
        </div>
      </div>

      {freezeCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <span>❄️</span>
          <span>프리즈 {freezeCount}개 보유</span>
        </div>
      )}

      {!isActiveToday && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          오늘 학습하고 연속 기록을 이어가세요!
        </div>
      )}
    </div>
  );
});

export default StreakWidget;
