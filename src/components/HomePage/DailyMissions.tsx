"use client";

import { memo } from "react";
import { DailyMission } from "@/types/gamification";

interface DailyMissionsProps {
  missions: DailyMission[];
  onMissionClick?: (mission: DailyMission) => void;
}

/**
 * DailyMissions Component
 * 오늘의 미션 (3개)
 */
const DailyMissions = memo(function DailyMissions({
  missions,
  onMissionClick,
}: DailyMissionsProps) {
  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="bg-white dark:bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>🎯</span>
          <span>오늘의 미션</span>
        </h2>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {completedCount}/{missions.length} 완료
        </div>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <button
            key={mission.id}
            onClick={() => onMissionClick?.(mission)}
            disabled={mission.completed}
            className={`
              w-full text-left p-4 rounded-xl border-2 transition-all duration-300
              ${
                mission.completed
                  ? "bg-green-50 dark:bg-green-900/20 border-green-500"
                  : "bg-gray-50 dark:bg-gray-100/50 border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:shadow-md"
              }
            `}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="text-3xl flex-shrink-0">{mission.icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {mission.title}
                  </h3>
                  {mission.completed && (
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {mission.description}
                </p>

                {/* Progress Bar */}
                {!mission.completed && (
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${mission.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {mission.progress}% 완료 ({mission.target - Math.floor((mission.progress / 100) * mission.target)}{" "}
                      남음)
                    </div>
                  </div>
                )}

                {/* XP Reward */}
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 text-sm font-medium">
                  <span>⭐</span>
                  <span>+{mission.xpReward} XP</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* All Complete Message */}
      {completedCount === missions.length && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-center">
          <div className="text-2xl mb-2">🎉</div>
          <div className="font-bold">모든 미션 완료!</div>
          <div className="text-sm opacity-90">
            총 {missions.reduce((sum, m) => sum + m.xpReward, 0)} XP 획득
          </div>
        </div>
      )}
    </div>
  );
});

export default DailyMissions;
