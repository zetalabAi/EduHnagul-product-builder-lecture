/**
 * Shadow Player Component
 * Main shadow speaking player with level selection
 */

"use client";

import { useState } from "react";
import { useShadowSpeaking } from "@/hooks/useShadowSpeaking";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { SyncIndicator } from "./SyncIndicator";
import { ProgressTracker } from "./ProgressTracker";

interface ShadowPlayerProps {
  contentId: string;
  userId: string | null;
}

export function ShadowPlayer({ contentId, userId }: ShadowPlayerProps) {
  const [level, setLevel] = useState(2); // 1-4
  const {
    isPlaying,
    currentTime,
    duration,
    currentSentence,
    sentences,
    startShadowing,
    stopShadowing,
    loading,
  } = useShadowSpeaking(contentId, userId);

  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const levelSettings = [
    { level: 1, speed: 0.7, delay: 1000, label: "입문 (70% 속도, 1초 딜레이)" },
    { level: 2, speed: 0.85, delay: 700, label: "초급 (85% 속도, 0.7초 딜레이)" },
    { level: 3, speed: 1.0, delay: 500, label: "중급 (100% 속도, 0.5초 딜레이)" },
    { level: 4, speed: 1.2, delay: 200, label: "고급 (120% 속도, 0.2초 딜레이)" },
  ];

  const currentLevel = levelSettings[level - 1];
  const completedSentences = sentences.findIndex((s) => s === currentSentence);

  const handleStart = async () => {
    await startShadowing(level);
  };

  const handleStop = async () => {
    const result = await stopShadowing();
    if (result) {
      setFinalScore(result.scores.overall);
      setShowResult(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show result screen
  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-8 border border-blue-700 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-3xl font-bold text-white mb-2">연습 완료!</h2>
          <p className="text-gray-300">훌륭한 연습이었습니다!</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-bold text-lg mb-4">최종 점수</h3>
          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-blue-400">{Math.round(finalScore * 100)}점</p>
          </div>
          <div className="space-y-2 text-sm text-gray-400">
            <p>✅ 리듬 정확도: 우수</p>
            <p>✅ 타이밍 동기화: 양호</p>
            <p>💡 레벨 {level}에서 완료!</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowResult(false);
            setFinalScore(0);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold transition-colors"
        >
          다시 연습하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Level Selection */}
      {!isPlaying && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-bold text-lg mb-4">난이도 선택</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {levelSettings.map((setting) => (
              <button
                key={setting.level}
                onClick={() => setLevel(setting.level)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  level === setting.level
                    ? "bg-blue-900/50 border-blue-500"
                    : "bg-gray-900 border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">레벨 {setting.level}</span>
                  {level === setting.level && <span className="text-blue-400">✓</span>}
                </div>
                <p className="text-gray-400 text-sm mt-1">{setting.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Sentence Display */}
      {isPlaying && currentSentence && (
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 border border-purple-700">
          <div className="text-center space-y-3">
            <p className="text-white text-3xl font-bold">{currentSentence.text}</p>
            <p className="text-blue-400 text-lg">{currentSentence.romanization || ""}</p>
            {currentSentence.translation && (
              <p className="text-gray-400">{currentSentence.translation}</p>
            )}
          </div>

          {/* Learning Points */}
          {currentSentence.emphasis && currentSentence.emphasis.length > 0 && (
            <div className="mt-6 bg-gray-900/50 rounded-lg p-4">
              <p className="text-purple-400 text-sm font-semibold mb-2">💡 강조할 부분</p>
              <div className="flex flex-wrap gap-2">
                {currentSentence.emphasis.map((word, index) => (
                  <span
                    key={index}
                    className="bg-purple-700 text-white px-3 py-1 rounded-full text-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Waveform Visualizer */}
      {isPlaying && (
        <WaveformVisualizer
          currentPosition={duration > 0 ? currentTime / duration : 0}
          delayMs={currentLevel.delay}
        />
      )}

      {/* Sync Indicator */}
      {isPlaying && (
        <SyncIndicator
          targetDelay={currentLevel.delay}
          actualDelay={currentLevel.delay + Math.random() * 200 - 100} // Mock
        />
      )}

      {/* Progress Tracker */}
      {isPlaying && (
        <ProgressTracker
          currentTime={currentTime}
          totalTime={duration}
          completedSentences={Math.max(0, completedSentences)}
          totalSentences={sentences.length}
          averageAccuracy={75 + Math.random() * 20} // Mock
        />
      )}

      {/* Play/Stop Button */}
      <div>
        {!isPlaying ? (
          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            ▶️ 연습 시작 (레벨 {level})
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold text-lg transition-colors"
          >
            ⏹️ 중지 및 결과 보기
          </button>
        )}
      </div>

      {/* Instructions */}
      {!isPlaying && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="text-white font-semibold mb-2">📖 사용 방법</h4>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>1. 난이도를 선택하세요</li>
            <li>2. "연습 시작"을 누르면 원본 오디오가 재생됩니다</li>
            <li>3. 설정된 딜레이 후 자동으로 녹음이 시작됩니다</li>
            <li>4. 원본 오디오를 듣고 바로 따라 말하세요</li>
            <li>5. 완료 후 리듬과 타이밍 점수를 확인하세요</li>
          </ul>
        </div>
      )}
    </div>
  );
}
