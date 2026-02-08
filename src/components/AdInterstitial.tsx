"use client";

import { useEffect, useState } from "react";

interface AdInterstitialProps {
  onClose: () => void;
  countdown?: number; // Seconds before user can close
}

/**
 * Full-screen Interstitial Ad
 * Shown at conversation start and end for Free users
 */
export function AdInterstitial({ onClose, countdown = 5 }: AdInterstitialProps) {
  const [secondsLeft, setSecondsLeft] = useState(countdown);

  useEffect(() => {
    if (secondsLeft > 0) {
      const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [secondsLeft]);

  const canClose = secondsLeft <= 0;

  // For development: Show placeholder
  if (process.env.NODE_ENV === "development") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <p className="text-yellow-400 text-2xl font-bold mb-2">📺 전면 광고</p>
            <p className="text-gray-400 text-sm">Google AdSense Interstitial</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-8 mb-6 text-center">
            <p className="text-6xl mb-4">🎬</p>
            <p className="text-gray-300">광고 영역</p>
            <p className="text-gray-500 text-sm mt-2">
              실제 배포 시 AdSense 광고 표시
            </p>
          </div>

          {canClose ? (
            <button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold"
            >
              ✓ 계속하기
            </button>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">광고를 보는 중...</p>
              <p className="text-white text-3xl font-bold">{secondsLeft}초</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-2">광고 없이 사용하고 싶으신가요?</p>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              Free+ 업그레이드 ($5.5/월)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Production: Real AdSense
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="ad-interstitial-container mb-4">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your AdSense ID
            data-ad-slot="YYYYYYYYYY"
            data-ad-format="interstitial"
            data-full-width-responsive="true"
          ></ins>
        </div>

        {canClose ? (
          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold"
          >
            계속하기
          </button>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 text-sm">{secondsLeft}초 후 건너뛸 수 있습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
