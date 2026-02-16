"use client";

import { memo } from "react";

interface WelcomeProps {
  onNext: () => void;
}

/**
 * Welcome Component - Step 1
 * Welcome screen with service introduction
 */
const Welcome = memo(function Welcome({ onNext }: WelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6 text-center">
      <div className="mb-8">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Edu_Hangul에
          <br />
          오신 걸 환영합니다!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          AI 기반 맞춤형 한국어 학습 플랫폼
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            AI 튜터
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            24/7 맞춤형 대화 학습
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl">
          <div className="text-4xl mb-3">🎮</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            게임화 학습
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            재미있는 미션과 보상
          </p>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            실시간 피드백
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            발음 분석 및 교정
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="px-12 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white text-lg font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
      >
        시작하기 🚀
      </button>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        약 3분 소요됩니다
      </p>
    </div>
  );
});

export default Welcome;
