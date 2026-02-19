"use client";

import { memo, useEffect } from "react";
import { Plant } from "@/types/garden";

interface BloomCelebrationProps {
  plant: Plant;
  onClose: () => void;
}

/**
 * BloomCelebration Component
 * Celebration animation when plant blooms (mastery achieved)
 */
const BloomCelebration = memo(function BloomCelebration({
  plant,
  onClose,
}: BloomCelebrationProps) {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 dark:from-yellow-900/40 dark:via-orange-900/40 dark:to-red-900/40 rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${-Math.random() * 50}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              {["🌸", "✨", "🎉", "💫", "🌟"][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Growth Animation */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <span className="text-5xl animate-grow">🌱</span>
            <span className="text-3xl">→</span>
            <span className="text-5xl animate-grow" style={{ animationDelay: "0.3s" }}>
              🌿
            </span>
            <span className="text-3xl">→</span>
            <span className="text-5xl animate-grow" style={{ animationDelay: "0.6s" }}>
              🌺
            </span>
            <span className="text-3xl">→</span>
            <span className="text-7xl animate-bloom" style={{ animationDelay: "0.9s" }}>
              🌸
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            축하합니다! 🎉
          </h1>

          <h2 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-8">
            {plant.item} 완벽 숙달!
          </h2>

          {/* Rewards */}
          <div className="bg-white/50 dark:bg-white/50 rounded-2xl p-6 mb-8">
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              보상:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center justify-center gap-3 text-lg">
                <span className="text-3xl">🏆</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {plant.item} 마스터 배지
                </span>
              </li>
              <li className="flex items-center justify-center gap-3 text-lg">
                <span className="text-3xl">⚡</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  +100 XP
                </span>
              </li>
            </ul>
          </div>

          {/* Motivational Message */}
          <p className="text-gray-700 dark:text-gray-300 mb-8 italic">
            "실수는 배움의 씨앗입니다. 당신은 그것을 아름다운 꽃으로 피웠습니다!"
          </p>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            계속하기
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes grow {
          0%, 50% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bloom {
          0%, 70% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          100% {
            transform: scale(1) rotate(360deg);
            opacity: 1;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-grow {
          animation: grow 1s ease-out forwards;
        }

        .animate-bloom {
          animation: bloom 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
});

export default BloomCelebration;
