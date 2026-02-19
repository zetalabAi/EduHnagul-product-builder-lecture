"use client";

import { memo, useState } from "react";
import { LearningGoal, GoalOption } from "@/types/onboarding";

interface GoalSelectionProps {
  onNext: (data: { goal: LearningGoal; customGoal?: string }) => void;
}

const goals: GoalOption[] = [
  {
    id: "travel",
    emoji: "✈️",
    title: "여행 회화",
    desc: "한국 여행 준비",
  },
  {
    id: "kpop",
    emoji: "🎵",
    title: "K-pop",
    desc: "가사 이해하기",
  },
  {
    id: "kdrama",
    emoji: "📺",
    title: "K-drama",
    desc: "자막 없이 보기",
  },
  {
    id: "business",
    emoji: "💼",
    title: "비즈니스",
    desc: "업무용 한국어",
  },
  {
    id: "other",
    emoji: "✏️",
    title: "기타",
    desc: "직접 입력",
  },
];

/**
 * GoalSelection Component - Step 2
 * Learning goal selection
 */
const GoalSelection = memo(function GoalSelection({
  onNext,
}: GoalSelectionProps) {
  const [selected, setSelected] = useState<LearningGoal | null>(null);
  const [customGoal, setCustomGoal] = useState("");

  const handleNext = () => {
    if (!selected) return;

    if (selected === "other" && !customGoal.trim()) {
      alert("학습 목표를 입력해주세요.");
      return;
    }

    onNext({
      goal: selected,
      customGoal: selected === "other" ? customGoal : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          학습 목표를 선택하세요
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          가장 관심 있는 학습 목표를 선택해주세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => setSelected(goal.id)}
            className={`
              p-6 rounded-2xl border-2 transition-all duration-300
              ${
                selected === goal.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-105"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md"
              }
            `}
          >
            <div className="text-5xl mb-3">{goal.emoji}</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {goal.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {goal.desc}
            </p>
          </button>
        ))}
      </div>

      {selected === "other" && (
        <div className="mb-8">
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="학습 목표를 입력하세요 (예: 한국 친구와 대화하기)"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-white text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
          />
        </div>
      )}

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

export default GoalSelection;
