"use client";

import { memo, useState } from "react";
import { Plant } from "@/types/garden";
import BloomCelebration from "./BloomCelebration";

interface PlantDetailModalProps {
  plant: Plant;
  onClose: () => void;
  onWater: (plantId: string, success: boolean) => Promise<any>;
}

/**
 * PlantDetailModal Component
 * Detailed view of a plant with practice option
 */
const PlantDetailModal = memo(function PlantDetailModal({
  plant,
  onClose,
  onWater,
}: PlantDetailModalProps) {
  const [practicing, setPracticing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handlePractice = async () => {
    setPracticing(true);

    try {
      // For now, simulate practice with 70% success rate
      // In a real implementation, this would be an interactive practice session
      const success = Math.random() > 0.3;

      const result = await onWater(plant.id, success);

      if (result.bloomed) {
        setShowCelebration(true);
      } else if (success) {
        alert(`좋아요! 🌱 → ${result.stage}`);
      } else {
        alert("다시 한번 시도해보세요! 💪");
      }
    } catch (error) {
      console.error("Practice error:", error);
      alert("연습 중 오류가 발생했습니다.");
    } finally {
      setPracticing(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "없음";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      "🌱": "씨앗",
      "🌿": "새싹",
      "🌺": "꽃봉오리",
      "🌸": "만개",
    };
    return labels[stage] || stage;
  };

  if (showCelebration) {
    return (
      <BloomCelebration
        plant={plant}
        onClose={() => {
          setShowCelebration(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            식물 상세
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plant Display */}
          <div className="text-center mb-8">
            <div className="text-9xl mb-4">{plant.stage}</div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {plant.item}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {getStageLabel(plant.stage)}
            </p>
          </div>

          {/* Growth Timeline */}
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              성장 단계
            </h4>
            <div className="flex items-center justify-between">
              {["🌱", "🌿", "🌺", "🌸"].map((stage, index) => (
                <div key={stage} className="flex flex-col items-center">
                  <div
                    className={`text-4xl ${
                      plant.stage === stage
                        ? "scale-125"
                        : plant.practiceCount > index * 3
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                  >
                    {stage}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {index === 0
                      ? "0-2"
                      : index === 1
                      ? "3-5"
                      : index === 2
                      ? "6-8"
                      : "9-10"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {plant.practiceCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                연습 횟수
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(plant.masteryLevel * 100)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                숙달도
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {plant.errorHistory.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                실수 기록
              </div>
            </div>
          </div>

          {/* Error History */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              실수 기록
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {plant.errorHistory.slice(0, 5).map((error, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatDate(error.timestamp)}
                    </span>
                    {error.corrected && (
                      <span className="text-green-500 text-xs">✓ 교정됨</span>
                    )}
                  </div>
                  <p className="text-gray-900 dark:text-white mt-1 truncate">
                    {error.context}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Button */}
          <button
            onClick={handlePractice}
            disabled={practicing || plant.stage === "🌸"}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
              ${
                plant.stage === "🌸"
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {practicing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                연습 중...
              </span>
            ) : plant.stage === "🌸" ? (
              "🎉 완벽하게 숙달했어요!"
            ) : (
              "🚿 물주기 (연습하기)"
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default PlantDetailModal;
