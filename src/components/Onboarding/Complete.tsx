"use client";

import { memo } from "react";

interface CompleteProps {
  onComplete: () => void;
  isLoading?: boolean;
}

/**
 * Complete Component - Step 7
 * Onboarding completion screen
 */
const Complete = memo(function Complete({
  onComplete,
  isLoading = false,
}: CompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6 text-center">
      <div className="mb-8">
        <div className="text-8xl mb-6 animate-bounce">🎉</div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          준비 완료!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          이제 맞춤형 한국어 학습을 시작할 수 있어요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-3xl">
        <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl text-left">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            개인 맞춤 레슨
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            당신의 목표와 수준에 맞는 레슨을 준비했어요
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 rounded-2xl text-left">
          <div className="text-3xl mb-3">🎁</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            시작 보너스
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Streak Freeze 1개와 첫 미션을 받았어요!
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl text-left">
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            AI 튜터 대기 중
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            당신의 학습 스타일에 맞는 튜터를 만나보세요
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-2xl text-left">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            실시간 피드백
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            발음 분석과 즉각적인 교정을 받으세요
          </p>
        </div>
      </div>

      <button
        onClick={onComplete}
        disabled={isLoading}
        className="px-12 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white text-lg font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span>설정 중...</span>
          </>
        ) : (
          <>
            <span>첫 레슨 시작하기</span>
            <span>🚀</span>
          </>
        )}
      </button>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        언제든지 설정에서 변경할 수 있어요
      </p>
    </div>
  );
});

export default Complete;
