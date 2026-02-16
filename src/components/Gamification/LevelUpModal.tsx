"use client";

import { memo, useEffect, useState } from "react";

interface LevelUpModalProps {
  show: boolean;
  newLevel: number;
  levelTitle: string;
  levelBadge: string;
  xpBonus: number;
  onClose: () => void;
}

/**
 * LevelUpModal Component
 * Celebration modal when user levels up
 */
const LevelUpModal = memo(function LevelUpModal({
  show,
  newLevel,
  levelTitle,
  levelBadge,
  xpBonus,
  onClose,
}: LevelUpModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`
          relative bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20
          rounded-3xl shadow-2xl p-8 max-w-md w-full
          transform transition-all duration-500
          ${isAnimating ? "scale-100 opacity-100" : "scale-90 opacity-0"}
        `}
      >
        {/* Confetti effect */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎊 레벨 업! 🎊
          </h2>

          <div className="my-6">
            <div className="text-8xl mb-4 animate-bounce">
              {levelBadge}
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Level {newLevel}
            </div>
            <div className="text-xl text-gray-700 dark:text-gray-300">
              {levelTitle}
            </div>
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              보너스 획득
            </div>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              +{xpBonus} XP
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            계속하기
          </button>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            축하합니다! 계속해서 학습을 이어가세요!
          </div>
        </div>
      </div>
    </div>
  );
});

export default LevelUpModal;
