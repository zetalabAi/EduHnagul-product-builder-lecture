"use client";

import { memo } from "react";
import { Plant, PlantCategory } from "@/types/garden";

interface PlantCardProps {
  plant: Plant;
  onClick: () => void;
}

const getCategoryLabel = (category: PlantCategory): string => {
  const labels: Record<PlantCategory, string> = {
    pronunciation: "발음",
    grammar: "문법",
    vocabulary: "어휘",
  };
  return labels[category];
};

const getCategoryColor = (category: PlantCategory): string => {
  const colors: Record<PlantCategory, string> = {
    pronunciation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    grammar: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    vocabulary: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return colors[category];
};

/**
 * PlantCard Component
 * Display individual plant in garden grid
 */
const PlantCard = memo(function PlantCard({ plant, onClick }: PlantCardProps) {
  const progressPercent = (plant.practiceCount / 10) * 100;
  const isMastered = plant.stage === "🌸";

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md
        transition-all duration-300 cursor-pointer
        hover:shadow-xl hover:scale-105
        ${isMastered ? "ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20" : ""}
      `}
    >
      {/* Mastery Badge */}
      {isMastered && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          ✨ 숙달!
        </div>
      )}

      {/* Plant Emoji */}
      <div className="text-7xl mb-4 text-center animate-pulse">
        {plant.stage}
      </div>

      {/* Plant Info */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center truncate">
        {plant.item}
      </h3>

      {/* Category Badge */}
      <div className="flex justify-center mb-4">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${getCategoryColor(
            plant.category
          )}`}
        >
          {getCategoryLabel(plant.category)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Progress Text */}
      <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
        {plant.practiceCount}/10 연습
      </p>

      {/* Mastery Level */}
      <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-1">
        숙달도: {Math.round(plant.masteryLevel * 100)}%
      </p>
    </div>
  );
});

export default PlantCard;
