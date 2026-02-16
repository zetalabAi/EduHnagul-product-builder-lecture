"use client";

import { memo } from "react";
import { GardenStats } from "@/types/garden";

interface GardenStatsPanelProps {
  stats: GardenStats;
}

/**
 * GardenStatsPanel Component
 * Display garden statistics
 */
const GardenStatsPanel = memo(function GardenStatsPanel({
  stats,
}: GardenStatsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Total Plants */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">🌳</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {stats.totalPlants}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          총 식물
        </div>
      </div>

      {/* Bloomed */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">🌸</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {stats.bloomed}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          만개
        </div>
      </div>

      {/* Growing */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">🌿</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {stats.sprouting + stats.budding}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          성장 중
        </div>
      </div>

      {/* Average Mastery */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">📊</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {Math.round(stats.avgMastery * 100)}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          평균 숙달도
        </div>
      </div>
    </div>
  );
});

export default GardenStatsPanel;
