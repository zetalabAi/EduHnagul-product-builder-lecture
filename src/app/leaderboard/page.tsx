/**
 * Leaderboard Page
 * Display league rankings and global top 100
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLeague } from "@/hooks/useLeague";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeagueCard } from "@/components/Leaderboard/LeagueCard";
import { RankingList } from "@/components/Leaderboard/RankingList";
import { WeeklyProgress } from "@/components/Leaderboard/WeeklyProgress";

type TabType = "league" | "global";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const {
    currentLeague,
    rankings,
    userRank,
    loading: leagueLoading,
    loadRankings,
    getTimeRemainingInWeek,
  } = useLeague(user?.uid || null);

  const {
    leaderboard,
    userEntry,
    loading: leaderboardLoading,
  } = useLeaderboard(user?.uid || null);

  const [activeTab, setActiveTab] = useState<TabType>("league");
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, total: 0 });

  // Load league rankings
  useEffect(() => {
    if (currentLeague && user) {
      loadRankings(currentLeague.tier, currentLeague.division);
    }
  }, [currentLeague, user, loadRankings]);

  // Update time remaining
  useEffect(() => {
    const updateTime = () => {
      const remaining = getTimeRemainingInWeek();
      setTimeRemaining(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [getTimeRemainingInWeek]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">로그인이 필요합니다.</p>
      </div>
    );
  }

  const isLoading = leagueLoading || leaderboardLoading;
  const weeklyXP = userRank?.weeklyXP || 0;
  const firstPlaceXP = rankings.length > 0 ? rankings[0].weeklyXP : weeklyXP;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">리더보드 🏆</h1>

          {/* Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("league")}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "league"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-400 hover:text-white"
              }`}
            >
              내 리그
            </button>
            <button
              onClick={() => setActiveTab("global")}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "global"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-400 hover:text-white"
              }`}
            >
              글로벌 Top 100
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
            {/* League Tab */}
            {activeTab === "league" && (
              <div className="space-y-6">
                {/* League Card */}
                <LeagueCard
                  league={currentLeague}
                  weeklyXP={weeklyXP}
                  rank={userRank?.rank || null}
                  timeRemaining={timeRemaining}
                />

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">⬆️</span>
                      <h3 className="text-green-400 font-semibold">승급 조건</h3>
                    </div>
                    <p className="text-gray-300 text-sm">
                      디비전 내 상위 10%에 진입하면 다음 주에 한 단계 위 티어로 승급합니다.
                    </p>
                  </div>
                  <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">⬇️</span>
                      <h3 className="text-red-400 font-semibold">강등 주의</h3>
                    </div>
                    <p className="text-gray-300 text-sm">
                      디비전 내 하위 20%에 속하면 다음 주에 한 단계 아래 티어로 강등됩니다.
                    </p>
                  </div>
                </div>

                {/* Weekly Progress */}
                <WeeklyProgress
                  weeklyXP={weeklyXP}
                  firstPlaceXP={firstPlaceXP}
                />

                {/* Rankings */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    리그 순위
                  </h2>
                  <RankingList
                    rankings={rankings}
                    currentUserId={user.uid}
                    showPromotionZones={true}
                  />
                </div>
              </div>
            )}

            {/* Global Tab */}
            {activeTab === "global" && (
              <div className="space-y-6">
                {/* User's Global Rank */}
                {userEntry && (
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-600 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-400 text-sm mb-1">내 글로벌 순위</p>
                        <p className="text-white text-3xl font-bold">
                          #{userEntry.rank}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-purple-400 text-sm mb-1">Total XP</p>
                        <p className="text-white text-2xl font-bold">
                          {userEntry.totalXP.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top 100 Info */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-gray-300 text-sm">
                    💡 글로벌 리더보드는 총 XP 기준 상위 100명을 실시간으로 표시합니다.
                  </p>
                </div>

                {/* Global Rankings */}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    글로벌 Top 100
                  </h2>
                  <RankingList
                    rankings={leaderboard.map((entry) => ({
                      userId: entry.userId,
                      displayName: entry.displayName,
                      photoURL: entry.photoURL,
                      weeklyXP: entry.totalXP, // Using totalXP for global
                      rank: entry.rank,
                      tier: entry.tier,
                      division: 0,
                    }))}
                    currentUserId={user.uid}
                    showPromotionZones={false}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
