/**
 * Ending Screen Component
 * Display drama ending with scores and rewards
 */

"use client";

import { useRouter } from "next/navigation";

interface EndingScreenProps {
  endingId: string;
  endingTitle: string;
  endingDescription: string;
  scores: {
    pronunciation: number;
    grammar: number;
    overall: number;
  };
  rewards: {
    xp: number;
    badges?: string[];
  };
  episodeId: string;
  onReplay?: () => void;
}

export function EndingScreen({
  endingId,
  endingTitle,
  endingDescription,
  scores,
  rewards,
  episodeId,
  onReplay,
}: EndingScreenProps) {
  const router = useRouter();

  const handleNextEpisode = () => {
    router.push("/drama");
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: "S", color: "text-yellow-400" };
    if (score >= 80) return { grade: "A", color: "text-green-400" };
    if (score >= 70) return { grade: "B", color: "text-blue-400" };
    if (score >= 60) return { grade: "C", color: "text-purple-400" };
    return { grade: "D", color: "text-gray-400" };
  };

  const overallGrade = getScoreGrade(scores.overall);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6 animate-fadeIn">
        {/* Ending Banner */}
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎭</div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            {endingTitle}
          </h1>
          <p className="text-gray-400 text-lg">{endingDescription}</p>
        </div>

        {/* Overall Score */}
        <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-8 border border-purple-700">
          <div className="text-center">
            <p className="text-gray-300 mb-2">종합 점수</p>
            <div className={`text-8xl font-bold ${overallGrade.color} mb-2`}>
              {overallGrade.grade}
            </div>
            <p className="text-white text-3xl font-bold">{scores.overall}점</p>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">🗣️</span>
              <h3 className="text-white font-semibold">발음</h3>
            </div>
            <p className="text-blue-400 text-2xl font-bold">{scores.pronunciation}점</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">📝</span>
              <h3 className="text-white font-semibold">문법</h3>
            </div>
            <p className="text-green-400 text-2xl font-bold">{scores.grammar}점</p>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-6 border border-yellow-700">
          <h3 className="text-yellow-400 font-bold text-xl mb-4 flex items-center space-x-2">
            <span>🎁</span>
            <span>보상</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white">획득 XP</span>
              <span className="text-yellow-400 text-2xl font-bold">+{rewards.xp}</span>
            </div>
            {rewards.badges && rewards.badges.length > 0 && (
              <div>
                <p className="text-gray-300 text-sm mb-2">획득한 배지</p>
                <div className="flex flex-wrap gap-2">
                  {rewards.badges.map((badge, index) => (
                    <div
                      key={index}
                      className="bg-purple-700 text-white px-3 py-1 rounded-full text-sm"
                    >
                      🏅 {badge}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onReplay}
            className="bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg transition-colors"
          >
            🔄 다시하기
          </button>
          <button
            onClick={handleNextEpisode}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            ➡️ 다음 에피소드
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "EduHangul 드라마 모드",
                text: `"${endingTitle}" 엔딩을 달성했어요! (${scores.overall}점)`,
              });
            }
          }}
          className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg transition-colors"
        >
          📤 결과 공유하기
        </button>
      </div>
    </div>
  );
}
