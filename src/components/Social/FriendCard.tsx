/**
 * Friend Card Component
 * Display friend profile with streak comparison and actions
 */

"use client";

import { useState } from "react";
import { Friend } from "@/types/social";
import { useFriends } from "@/hooks/useFriends";
import { useChallenges } from "@/hooks/useChallenges";

interface FriendCardProps {
  friend: Friend;
  currentUserStreak?: number;
}

export function FriendCard({ friend, currentUserStreak = 0 }: FriendCardProps) {
  const { removeFriend } = useFriends(null);
  const { createChallenge } = useChallenges(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`${friend.displayName}님을 친구 목록에서 삭제하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await removeFriend(friend.id);
    } catch (error) {
      alert("친구 삭제에 실패했습니다.");
    } finally {
      setIsLoading(false);
      setIsMenuOpen(false);
    }
  };

  const handleCreateChallenge = async (type: "streak" | "xp" | "lessons") => {
    setIsLoading(true);
    try {
      const goal = type === "streak" ? 7 : type === "xp" ? 1000 : 10;
      await createChallenge({
        friendId: friend.id,
        type,
        goal,
        durationDays: 7,
      });
      alert("챌린지가 생성되었습니다! 🎯");
    } catch (error) {
      alert("챌린지 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
      setIsMenuOpen(false);
    }
  };

  const streakComparison = friend.currentStreak - currentUserStreak;
  const isAhead = streakComparison > 0;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between">
        {/* Profile Section */}
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {friend.photoURL ? (
              <img
                src={friend.photoURL}
                alt={friend.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              friend.displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-semibold">{friend.displayName}</h3>
            <p className="text-sm text-gray-400">레벨 {friend.level}</p>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-400 hover:text-white p-1"
            disabled={isLoading}
          >
            ⋯
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-700 rounded-lg shadow-xl z-10">
              <button
                onClick={() => handleCreateChallenge("streak")}
                className="w-full text-left px-4 py-2 hover:bg-white text-white rounded-t-lg"
              >
                🔥 Streak 챌린지
              </button>
              <button
                onClick={() => handleCreateChallenge("xp")}
                className="w-full text-left px-4 py-2 hover:bg-white text-white"
              >
                ⭐ XP 챌린지
              </button>
              <button
                onClick={() => handleCreateChallenge("lessons")}
                className="w-full text-left px-4 py-2 hover:bg-white text-white"
              >
                📚 Lesson 챌린지
              </button>
              <hr className="border-gray-700" />
              <button
                onClick={handleRemove}
                className="w-full text-left px-4 py-2 hover:bg-white text-red-400 rounded-b-lg"
              >
                🗑️ 친구 삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Streak Comparison */}
      <div className="mt-4 bg-white rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            스트릭: <span className="text-orange-500 font-bold">{friend.currentStreak}일</span>
          </div>
          <div className={isAhead ? "text-green-400" : "text-yellow-400"}>
            {isAhead ? `+${streakComparison}일 앞서감` : streakComparison === 0 ? "동점!" : `${Math.abs(streakComparison)}일 뒤쳐짐`}
          </div>
        </div>
        <div className="mt-2">
          <div className="text-gray-400 text-sm">
            Total XP: <span className="text-blue-400 font-bold">{friend.totalXP.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => handleCreateChallenge("streak")}
          disabled={isLoading}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
        >
          🎯 챌린지
        </button>
        <button
          className="bg-gray-100 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
        >
          💌 응원하기
        </button>
      </div>
    </div>
  );
}
