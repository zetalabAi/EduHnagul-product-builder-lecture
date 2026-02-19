"use client";

import { memo } from "react";

interface XPBarProps {
  currentLevel: number;
  levelTitle: string;
  levelBadge: string;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progress: number;
  compact?: boolean;
}

/**
 * XPBar Component
 * Display XP progress bar with level info
 */
const XPBar = memo(function XPBar({
  currentLevel,
  levelTitle,
  levelBadge,
  xpInCurrentLevel,
  xpRequiredForNextLevel,
  progress,
  compact = false,
}: XPBarProps) {
  const progressPercent = Math.round(progress * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xl">{levelBadge}</span>
        <div className="flex-1 max-w-[200px]">
          <div className="h-2 bg-gray-200 dark:bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Lv.{currentLevel}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelBadge}</span>
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              Level {currentLevel}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {levelTitle}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            다음 레벨까지
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {xpInCurrentLevel}/{xpRequiredForNextLevel} XP
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-md">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
});

export default XPBar;
