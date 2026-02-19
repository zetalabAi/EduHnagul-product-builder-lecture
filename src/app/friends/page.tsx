/**
 * Friends Page
 * Display friend list and active challenges
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { useChallenges } from "@/hooks/useChallenges";
import { FriendCard } from "@/components/Social/FriendCard";
import { ChallengeCard } from "@/components/Social/ChallengeCard";
import { AddFriendModal } from "@/components/Social/AddFriendModal";

export default function FriendsPage() {
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends(user?.uid || null);
  const { activeChallenges, completedChallenges, loading: challengesLoading } = useChallenges(user?.uid || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "challenges">("friends");

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">로그인이 필요합니다.</p>
      </div>
    );
  }

  const isLoading = friendsLoading || challengesLoading;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">친구 👥</h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <span>➕</span>
              <span>친구 추가</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "friends"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-400 hover:text-white"
              }`}
            >
              친구 목록 ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab("challenges")}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "challenges"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-400 hover:text-white"
              }`}
            >
              챌린지 ({activeChallenges.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Friends Tab */}
            {activeTab === "friends" && (
              <div>
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      아직 친구가 없어요
                    </h3>
                    <p className="text-gray-400 mb-6">
                      친구를 추가하고 함께 한국어를 배워보세요!
                    </p>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      ➕ 친구 추가하기
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend) => (
                      <FriendCard
                        key={friend.id}
                        friend={friend}
                        currentUserStreak={0} // TODO: Get from user profile
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Challenges Tab */}
            {activeTab === "challenges" && (
              <div>
                {/* Active Challenges */}
                {activeChallenges.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">
                      진행 중인 챌린지
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeChallenges.map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          userId={user.uid}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Challenges */}
                {completedChallenges.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">
                      완료된 챌린지
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completedChallenges.map((challenge) => (
                        <ChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          userId={user.uid}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {activeChallenges.length === 0 && completedChallenges.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      챌린지가 없어요
                    </h3>
                    <p className="text-gray-400 mb-6">
                      친구와 챌린지를 시작하고 함께 성장하세요!
                    </p>
                    <button
                      onClick={() => setActiveTab("friends")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      친구 목록 보기
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        userId={user.uid}
      />
    </div>
  );
}
