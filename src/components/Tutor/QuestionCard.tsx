"use client";

import { memo } from "react";

interface QuestionCardProps {
  question: string;
  options?: string[];
  onSelectOption?: (option: string) => void;
  selectedOption?: string | null;
}

/**
 * QuestionCard Component
 * Socratic Method 질문 카드
 */
const QuestionCard = memo(function QuestionCard({
  question,
  options,
  onSelectOption,
  selectedOption,
}: QuestionCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-4">
      {/* Question */}
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
              T
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                {question}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      {options && options.length > 0 && (
        <div className="space-y-2 ml-13">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onSelectOption?.(option)}
              className={`
                w-full text-left p-4 rounded-xl border-2 transition-all duration-300
                ${
                  selectedOption === option
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${
                    selectedOption === option
                      ? "border-primary-500 bg-primary-500"
                      : "border-gray-300 dark:border-gray-600"
                  }
                `}
                >
                  {selectedOption === option && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-gray-900 dark:text-gray-100">
                  {option}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default QuestionCard;
