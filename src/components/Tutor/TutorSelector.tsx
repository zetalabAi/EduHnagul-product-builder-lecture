"use client";

import { memo } from "react";
import { Tutor, TutorPersona } from "@/types/tutor";

interface TutorSelectorProps {
  onSelect: (tutorId: TutorPersona) => void;
  selectedTutor?: TutorPersona | null;
}

const TUTORS: Tutor[] = [
  {
    id: "suji",
    name: "수지쌤",
    description: "친절하고 인내심 많은 선생님",
    icon: "👩‍🏫",
    personality: "따뜻하고 격려하는 스타일",
    speciality: "초보자에게 완벽",
  },
  {
    id: "minjun",
    name: "민준쌤",
    description: "재미있고 에너지 넘치는 선생님",
    icon: "👨‍🏫",
    personality: "유머러스하고 친근한 스타일",
    speciality: "드라마/K-pop 예시",
  },
  {
    id: "grandma",
    name: "할머니",
    description: "따뜻하고 지혜로운 할머니",
    icon: "👵",
    personality: "다정하고 천천히 설명",
    speciality: "전통 문화와 속담",
  },
  {
    id: "business",
    name: "비즈니스 튜터",
    description: "전문적이고 효율적인 튜터",
    icon: "🧑‍💼",
    personality: "명확하고 실용적",
    speciality: "비즈니스 한국어",
  },
];

/**
 * TutorSelector Component
 * 튜터 페르소나 선택 UI
 */
const TutorSelector = memo(function TutorSelector({
  onSelect,
  selectedTutor,
}: TutorSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          나의 튜터 선택하기
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          학습 스타일에 맞는 튜터를 선택하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TUTORS.map((tutor) => (
          <button
            key={tutor.id}
            onClick={() => onSelect(tutor.id)}
            className={`
              relative p-6 rounded-2xl border-2 transition-all duration-300
              hover:shadow-xl hover:scale-105
              ${
                selectedTutor === tutor.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300"
              }
            `}
          >
            {/* Selected Indicator */}
            {selectedTutor === tutor.id && (
              <div className="absolute top-4 right-4">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            {/* Icon */}
            <div className="text-6xl mb-4 text-center">{tutor.icon}</div>

            {/* Name */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
              {tutor.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
              {tutor.description}
            </p>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <span className="text-primary-600 font-medium">성격:</span>
                <span className="text-gray-700 dark:text-gray-300 flex-1">
                  {tutor.personality}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span className="text-primary-600 font-medium">특기:</span>
                <span className="text-gray-700 dark:text-gray-300 flex-1">
                  {tutor.speciality}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

export default TutorSelector;
