/**
 * EmotionIndicator Component
 * 감정 상태 표시 컴포넌트
 *
 * 현재 감정, 제안 사항 표시
 */

"use client";

import { memo } from "react";

export type EmotionType =
  | "stressed"
  | "excited"
  | "tired"
  | "positive"
  | "negative"
  | "neutral";

interface EmotionIndicatorProps {
  currentEmotion: EmotionType;
  emotionConfidence: number;
  emotionIntensity: number;
  encouragement?: string;
  suggestions: string[];
  isVisible?: boolean;
}

const EmotionIndicator = memo(function EmotionIndicator({
  currentEmotion,
  emotionConfidence,
  emotionIntensity,
  encouragement,
  suggestions,
  isVisible = true,
}: EmotionIndicatorProps) {
  if (!isVisible) return null;

  // 감정별 라벨
  const emotionLabels: Record<EmotionType, string> = {
    stressed: "스트레스/불안",
    excited: "흥분/열정",
    tired: "피곤/지침",
    positive: "긍정/즐거움",
    negative: "부정/좌절",
    neutral: "중립/평온",
  };

  // 감정별 이모지
  const emotionEmojis: Record<EmotionType, string> = {
    stressed: "😰",
    excited: "🤩",
    tired: "😴",
    positive: "😊",
    negative: "😔",
    neutral: "😐",
  };

  // 감정별 색상
  const emotionColors: Record<EmotionType, string> = {
    stressed: "bg-red-100 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-300",
    excited: "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500 text-yellow-700 dark:text-yellow-300",
    tired: "bg-purple-100 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-300",
    positive: "bg-green-100 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300",
    negative: "bg-gray-100 dark:bg-white/20 border-gray-500 text-gray-700 dark:text-gray-300",
    neutral: "bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300",
  };

  return (
    <div className="bg-white dark:bg-white rounded-xl shadow-md p-4 mb-4">
      {/* 감정 상태 */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{emotionEmojis[currentEmotion]}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {emotionLabels[currentEmotion]}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              신뢰도 {Math.round(emotionConfidence * 100)}%
            </span>
          </div>
          {/* 강도 바 */}
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                currentEmotion === "stressed" || currentEmotion === "negative"
                  ? "bg-red-500"
                  : currentEmotion === "excited"
                  ? "bg-yellow-500"
                  : currentEmotion === "tired"
                  ? "bg-purple-500"
                  : "bg-green-500"
              } transition-all duration-500`}
              style={{ width: `${emotionIntensity * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 격려 메시지 */}
      {encouragement && (
        <div
          className={`border-l-4 p-3 rounded mb-3 ${emotionColors[currentEmotion]}`}
        >
          <p className="text-sm font-medium">{encouragement}</p>
        </div>
      )}

      {/* 제안 사항 */}
      {suggestions.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-100/50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            💡 제안:
          </p>
          <ul className="space-y-1">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <li
                key={index}
                className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2"
              >
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default EmotionIndicator;
