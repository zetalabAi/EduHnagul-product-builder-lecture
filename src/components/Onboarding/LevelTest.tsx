"use client";

import { memo, useState } from "react";
import { UserLevel, LevelOption } from "@/types/onboarding";

interface LevelTestProps {
  onNext: (data: { level: UserLevel }) => void;
}

const levels: LevelOption[] = [
  {
    id: "beginner",
    emoji: "🌱",
    title: "완전 초보",
    desc: "한글도 처음이에요",
  },
  {
    id: "elementary",
    emoji: "🌿",
    title: "기초",
    desc: "간단한 인사 가능",
  },
  {
    id: "intermediate",
    emoji: "🌳",
    title: "중급",
    desc: "기본 회화 가능",
  },
  {
    id: "advanced",
    emoji: "🏆",
    title: "고급",
    desc: "유창하게 대화 가능",
  },
];

/**
 * LevelTest Component - Step 3
 * Current level assessment
 */
const LevelTest = memo(function LevelTest({ onNext }: LevelTestProps) {
  const [selected, setSelected] = useState<UserLevel | null>(null);

  const handleNext = () => {
    if (!selected) return;
    onNext({ level: selected });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          현재 수준을 선택하세요
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          솔직하게 선택해주세요. 맞춤 학습을 위해 중요합니다!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => setSelected(level.id)}
            className={`
              p-8 rounded-2xl border-2 transition-all duration-300
              ${
                selected === level.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-105"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md"
              }
            `}
          >
            <div className="text-6xl mb-4">{level.emoji}</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {level.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{level.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleNext}
          disabled={!selected}
          className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    </div>
  );
});

export default LevelTest;
