"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { LearningMode } from "@/types/gamification";

interface ModeCardsProps {
  modes: LearningMode[];
}

/**
 * ModeCards Component
 * 실전 회화 & AI 튜터 메인 카드
 */
const ModeCards = memo(function ModeCards({ modes }: ModeCardsProps) {
  const router = useRouter();

  const handleModeClick = (mode: LearningMode) => {
    if (!mode.available) {
      return; // 곧 추가 예정 모드는 클릭 불가
    }
    router.push(mode.route);
  };

  return (
    <div className="flex justify-center mb-6">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => handleModeClick(mode)}
          disabled={!mode.available}
          className={`
            relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 w-full max-w-sm
            ${
              mode.available
                ? "bg-gradient-to-br hover:shadow-2xl hover:scale-105 cursor-pointer"
                : "bg-gray-100 dark:bg-white cursor-not-allowed opacity-75"
            }
            ${mode.color}
          `}
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 opacity-10 text-8xl">
            {mode.icon}
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{mode.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {mode.title}
                </h3>
                {!mode.available && (
                  <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full font-medium">
                    곧 추가 예정
                  </span>
                )}
              </div>
            </div>
            <p className="text-white/90 text-sm">{mode.subtitle}</p>

            {mode.available && (
              <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
                <span>시작하기</span>
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
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

export default ModeCards;
