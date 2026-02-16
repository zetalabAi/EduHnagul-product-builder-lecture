"use client";

import { memo } from "react";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalXP: number;
  level: number;
  levelTitle: string;
  levelBadge: string;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

/**
 * Leaderboard Component
 * Display XP leaderboard
 */
const Leaderboard = memo(function Leaderboard({
  entries,
  currentUserId,
}: LeaderboardProps) {
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4">
        <h3 className="text-xl font-bold text-white">🏆 리더보드</h3>
        <p className="text-sm text-white/80 mt-1">상위 학습자</p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isCurrentUser = entry.userId === currentUserId;
          const medal = getMedalIcon(rank);

          return (
            <div
              key={entry.userId}
              className={`
                flex items-center gap-4 p-4 transition-colors
                ${
                  isCurrentUser
                    ? "bg-primary-50 dark:bg-primary-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }
              `}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-10 text-center">
                {medal ? (
                  <span className="text-2xl">{medal}</span>
                ) : (
                  <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                    {rank}
                  </span>
                )}
              </div>

              {/* Badge */}
              <div className="text-3xl">{entry.levelBadge}</div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-gray-900 dark:text-white truncate">
                    {entry.displayName}
                  </div>
                  {isCurrentUser && (
                    <span className="text-xs px-2 py-0.5 bg-primary-500 text-white rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Level {entry.level} · {entry.levelTitle}
                </div>
              </div>

              {/* XP */}
              <div className="text-right">
                <div className="font-bold text-gray-900 dark:text-white">
                  {entry.totalXP.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  XP
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          아직 순위가 없습니다
        </div>
      )}
    </div>
  );
});

export default Leaderboard;
