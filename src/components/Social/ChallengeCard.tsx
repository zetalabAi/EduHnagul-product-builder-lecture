/**
 * Challenge Card Component
 * Display active challenge with progress comparison
 */

"use client";

import { Challenge } from "@/types/social";
import { useChallenges } from "@/hooks/useChallenges";
import { useEffect, useState } from "react";

interface ChallengeCardProps {
  challenge: Challenge;
  userId: string;
}

export function ChallengeCard({ challenge, userId }: ChallengeCardProps) {
  const { updateChallengeProgress } = useChallenges(userId);
  const [timeRemaining, setTimeRemaining] = useState("");

  const myIndex = challenge.participants.indexOf(userId);
  const opponentIndex = myIndex === 0 ? 1 : 0;

  const myName = challenge.participantNames[myIndex] || "나";
  const opponentName = challenge.participantNames[opponentIndex] || "상대";

  const myProgress = challenge.progress[userId] || 0;
  const opponentProgress = challenge.progress[challenge.participants[opponentIndex]] || 0;

  const myPercent = Math.min((myProgress / challenge.goal) * 100, 100);
  const opponentPercent = Math.min((opponentProgress / challenge.goal) * 100, 100);

  const isWinning = myProgress > opponentProgress;
  const isComplete = challenge.status === "completed";
  const isWinner = challenge.winner === userId;

  // Calculate time remaining
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const end = new Date(challenge.endDate);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("종료됨");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}일 ${hours}시간`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}시간 ${minutes}분`);
      } else {
        setTimeRemaining(`${minutes}분`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [challenge.endDate]);

  const getChallengeIcon = () => {
    switch (challenge.type) {
      case "streak":
        return "🔥";
      case "xp":
        return "⭐";
      case "lessons":
        return "📚";
      default:
        return "🎯";
    }
  };

  const getChallengeLabel = () => {
    switch (challenge.type) {
      case "streak":
        return "Streak 챌린지";
      case "xp":
        return "XP 챌린지";
      case "lessons":
        return "Lesson 챌린지";
      default:
        return "챌린지";
    }
  };

  const handleUpdate = async () => {
    try {
      await updateChallengeProgress(challenge.id);
    } catch (error) {
      console.error("Failed to update challenge:", error);
    }
  };

  return (
    <div className={`rounded-lg p-4 border ${
      isComplete
        ? isWinner
          ? "bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-600"
          : "bg-gray-800 border-gray-700"
        : "bg-gray-800 border-gray-700"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getChallengeIcon()}</span>
          <div>
            <h3 className="text-white font-semibold">{getChallengeLabel()}</h3>
            <p className="text-sm text-gray-400">
              목표: {challenge.goal} {challenge.type === "streak" ? "일" : challenge.type === "xp" ? "XP" : "레슨"}
            </p>
          </div>
        </div>

        {isComplete ? (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isWinner
              ? "bg-yellow-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}>
            {isWinner ? "🏆 승리!" : "패배"}
          </div>
        ) : (
          <div className="bg-blue-600 px-3 py-1 rounded-full text-white text-sm font-medium">
            ⏱️ {timeRemaining}
          </div>
        )}
      </div>

      {/* Progress Comparison */}
      <div className="space-y-3">
        {/* My Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-medium">{myName}</span>
            <span className={`font-bold ${isWinning && !isComplete ? "text-green-400" : "text-white"}`}>
              {myProgress} / {challenge.goal}
            </span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isWinning ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-blue-500 to-cyan-500"
              }`}
              style={{ width: `${myPercent}%` }}
            />
          </div>
        </div>

        {/* Opponent Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-medium">{opponentName}</span>
            <span className={`font-bold ${!isWinning && !isComplete ? "text-green-400" : "text-white"}`}>
              {opponentProgress} / {challenge.goal}
            </span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                !isWinning ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-orange-500 to-red-500"
              }`}
              style={{ width: `${opponentPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Difference */}
      {!isComplete && (
        <div className="mt-3 text-center">
          {myProgress === opponentProgress ? (
            <p className="text-yellow-400 text-sm font-medium">⚔️ 동점!</p>
          ) : isWinning ? (
            <p className="text-green-400 text-sm font-medium">
              ✨ {myProgress - opponentProgress} 앞서고 있어요!
            </p>
          ) : (
            <p className="text-orange-400 text-sm font-medium">
              🔥 {opponentProgress - myProgress} 뒤처져있어요!
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {!isComplete && (
        <div className="mt-4">
          <button
            onClick={handleUpdate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
          >
            🔄 진행 상황 업데이트
          </button>
        </div>
      )}

      {/* Winner Badge */}
      {isComplete && isWinner && (
        <div className="mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center py-2 rounded-lg font-bold">
          🎉 챌린지 우승! 축하합니다!
        </div>
      )}
    </div>
  );
}
