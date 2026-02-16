/**
 * AdaptiveLearningIndicator Component
 * 적응형 학습 상태 표시 컴포넌트
 *
 * Flow State, 난이도, 피드백을 시각적으로 표시
 */

"use client";

import { memo } from "react";

interface AdaptiveLearningIndicatorProps {
  currentDifficulty: number;
  difficultyLabel: string;
  isFlowState: boolean;
  flowQuality: number;
  feedback: string | null;
}

const AdaptiveLearningIndicator = memo(function AdaptiveLearningIndicator({
  currentDifficulty,
  difficultyLabel,
  isFlowState,
  flowQuality,
  feedback,
}: AdaptiveLearningIndicatorProps) {
  // 난이도 색상
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 0.3) return "bg-green-500";
    if (difficulty < 0.5) return "bg-blue-500";
    if (difficulty < 0.7) return "bg-yellow-500";
    if (difficulty < 0.9) return "bg-orange-500";
    return "bg-red-500";
  };

  // Flow State 품질에 따른 색상
  const getFlowColor = (quality: number) => {
    if (quality >= 0.8) return "text-green-500";
    if (quality >= 0.6) return "text-yellow-500";
    return "text-gray-400";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        {/* Flow State 인디케이터 */}
        <div className="flex items-center gap-2">
          {isFlowState ? (
            <>
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                Flow State 🌟
              </span>
            </>
          ) : (
            <>
              <div className={`w-3 h-3 rounded-full ${getFlowColor(flowQuality)}`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Flow 품질: {Math.round(flowQuality * 100)}%
              </span>
            </>
          )}
        </div>

        {/* 난이도 인디케이터 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            난이도:
          </span>
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getDifficultyColor(currentDifficulty)} transition-all duration-500`}
                style={{ width: `${currentDifficulty * 100}%` }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {difficultyLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 피드백 메시지 */}
      {feedback && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {feedback}
          </p>
        </div>
      )}
    </div>
  );
});

export default AdaptiveLearningIndicator;
