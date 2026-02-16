"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { MistakeGardenItem } from "@/types/gamification";

interface GardenPreviewProps {
  items: MistakeGardenItem[];
}

/**
 * GardenPreview Component
 * 실수 정원 미리보기
 */
const GardenPreview = memo(function GardenPreview({ items }: GardenPreviewProps) {
  const router = useRouter();

  const stageIcons = {
    seed: "🌱",
    sprout: "🌿",
    flower: "🌸",
  };

  const categoryColors = {
    grammar: "from-blue-500 to-cyan-600",
    vocabulary: "from-purple-500 to-pink-600",
    pronunciation: "from-orange-500 to-red-600",
    expression: "from-green-500 to-teal-600",
  };

  const categoryNames = {
    grammar: "문법",
    vocabulary: "어휘",
    pronunciation: "발음",
    expression: "표현",
  };

  // Show top 3 items
  const previewItems = items.slice(0, 3);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>🌸</span>
          <span>실수 정원</span>
        </h2>
        {items.length > 0 && (
          <button
            onClick={() => router.push("/garden")}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <span>전체 보기</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        // Empty State
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            아직 정원이 비어있어요
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            실수를 하면 여기에 식물이 자라나요!
            <br />
            실수는 성장의 씨앗입니다 🌱
          </p>
        </div>
      ) : (
        <>
          {/* Preview Items */}
          <div className="space-y-3 mb-4">
            {previewItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => router.push(`/garden/${item.id}`)}
              >
                {/* Stage Icon */}
                <div className="text-3xl flex-shrink-0">
                  {stageIcons[item.stage]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Category Badge */}
                  <div className="mb-2">
                    <span
                      className={`
                        inline-block px-2 py-1 rounded-full text-xs font-medium text-white
                        bg-gradient-to-r ${categoryColors[item.category]}
                      `}
                    >
                      {categoryNames[item.category]}
                    </span>
                  </div>

                  {/* Mistake & Correction */}
                  <div className="mb-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      {item.mistake}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      → {item.correction}
                    </div>
                  </div>

                  {/* Practice Count */}
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span>💪</span>
                    <span>{item.practiceCount}번 연습함</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Garden Stats */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl mb-1">
                {items.filter((i) => i.stage === "seed").length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                🌱 씨앗
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">
                {items.filter((i) => i.stage === "sprout").length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                🌿 새싹
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">
                {items.filter((i) => i.stage === "flower").length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                🌸 꽃
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default GardenPreview;
