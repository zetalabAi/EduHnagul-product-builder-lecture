"use client";

import { memo } from "react";
import { Lesson } from "@/types/tutor";

interface LessonProgressProps {
  lesson: Lesson;
  progress: number; // 0-100
  onBack?: () => void;
}

/**
 * LessonProgress Component
 * 레슨 진도 표시바
 */
const LessonProgress = memo(function LessonProgress({
  lesson,
  progress,
  onBack,
}: LessonProgressProps) {
  return (
    <div className="bg-white dark:bg-white border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm font-medium">뒤로</span>
            </button>
          )}

          {/* Lesson Info */}
          <div className="flex-1 text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Lesson {lesson.number}/50
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {lesson.title}
            </h2>
          </div>

          {/* XP Reward */}
          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-bold">+{lesson.xpReward}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 dark:bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="absolute -top-1 right-0 text-xs font-medium text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Objectives */}
        <div className="mt-3 flex flex-wrap gap-2">
          {lesson.objectives.map((objective, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
            >
              <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{objective}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export default LessonProgress;
