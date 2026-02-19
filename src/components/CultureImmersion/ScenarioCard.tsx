/**
 * Scenario Card Component
 * Display cultural learning scenario
 */

"use client";

import { useRouter } from "next/navigation";

interface ScenarioCardProps {
  topicId: string;
  title: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number;
  introduction: string;
  completed?: boolean;
}

const DIFFICULTY_COLORS = {
  beginner: "bg-green-600",
  intermediate: "bg-yellow-600",
  advanced: "bg-red-600",
};

const DIFFICULTY_LABELS = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const CATEGORY_ICONS: Record<string, string> = {
  social_hierarchy: "👥",
  indirect_communication: "💬",
  food_culture: "🍚",
  dating: "💑",
  work_culture: "💼",
};

export function ScenarioCard({
  topicId,
  title,
  category,
  difficulty,
  estimatedTime,
  introduction,
  completed = false,
}: ScenarioCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-4xl">{CATEGORY_ICONS[category] || "📚"}</span>
          <div>
            <h3 className="text-white font-bold text-lg group-hover:text-purple-400 transition-colors">
              {title}
            </h3>
            <p className="text-gray-400 text-sm">{category}</p>
          </div>
        </div>

        {completed && (
          <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">
            ✓ 완료
          </span>
        )}
      </div>

      {/* Introduction */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{introduction}</p>

      {/* Metadata */}
      <div className="flex items-center space-x-4 mb-4 text-sm">
        <span
          className={`${DIFFICULTY_COLORS[difficulty]} text-white px-3 py-1 rounded-full`}
        >
          {DIFFICULTY_LABELS[difficulty]}
        </span>
        <span className="text-gray-400">⏱️ {estimatedTime}분</span>
      </div>

      {/* Action Button */}
      <button
        onClick={() => router.push(`/culture-immersion/${topicId}`)}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-medium transition-all transform group-hover:scale-105"
      >
        {completed ? "🔄 다시 배우기" : "📖 학습하기"}
      </button>
    </div>
  );
}
