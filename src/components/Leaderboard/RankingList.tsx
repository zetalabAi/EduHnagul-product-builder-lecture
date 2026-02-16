/**
 * Ranking List Component
 * Display league rankings with promotion/relegation zones
 */

"use client";

import { WeeklyRank } from "@/types/league";

interface RankingListProps {
  rankings: WeeklyRank[];
  currentUserId: string | null;
  showPromotionZones?: boolean;
}

const MEDAL_EMOJIS = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function RankingList({
  rankings,
  currentUserId,
  showPromotionZones = true,
}: RankingListProps) {
  if (rankings.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">순위 정보가 없습니다.</p>
      </div>
    );
  }

  const totalUsers = rankings.length;
  const promotionCutoff = Math.ceil(totalUsers * 0.1); // Top 10%
  const relegationCutoff = totalUsers - Math.floor(totalUsers * 0.2); // Bottom 20%

  const getRowClass = (rank: number, userId: string) => {
    const isCurrentUser = userId === currentUserId;
    let bgClass = "bg-gray-800";

    if (showPromotionZones) {
      if (rank <= promotionCutoff) {
        bgClass = "bg-green-900/30"; // Promotion zone
      } else if (rank > relegationCutoff) {
        bgClass = "bg-red-900/30"; // Relegation zone
      }
    }

    if (isCurrentUser) {
      bgClass += " border-2 border-blue-500";
    }

    return bgClass;
  };

  return (
    <div className="space-y-2">
      {/* Promotion Zone Label */}
      {showPromotionZones && promotionCutoff > 0 && (
        <div className="bg-green-900/20 border border-green-600 rounded-lg px-3 py-1 text-green-400 text-sm font-medium">
          ⬆️ 승급 구역 (상위 10%)
        </div>
      )}

      {/* Rankings */}
      {rankings.map((ranking, index) => {
        const isCurrentUser = ranking.userId === currentUserId;
        const showZoneLabel = showPromotionZones && (
          (index === promotionCutoff && index > 0) ||
          (index === relegationCutoff && index < rankings.length - 1)
        );

        return (
          <div key={ranking.userId}>
            {/* Zone Label */}
            {showZoneLabel && index === relegationCutoff && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg px-3 py-1 text-red-400 text-sm font-medium mt-4 mb-2">
                ⬇️ 강등 구역 (하위 20%)
              </div>
            )}

            {/* Ranking Row */}
            <div
              className={`${getRowClass(ranking.rank, ranking.userId)} rounded-lg p-3 transition-all hover:bg-opacity-80`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {/* Rank */}
                  <div className="w-12 text-center">
                    {ranking.rank <= 3 ? (
                      <span className="text-2xl">
                        {MEDAL_EMOJIS[ranking.rank as keyof typeof MEDAL_EMOJIS]}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-bold">
                        #{ranking.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {ranking.photoURL ? (
                        <img
                          src={ranking.photoURL}
                          alt={ranking.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        ranking.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold ${isCurrentUser ? "text-blue-400" : "text-white"}`}>
                        {ranking.displayName}
                        {isCurrentUser && <span className="ml-2 text-xs">(나)</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ranking.tier ? `${ranking.tier} Div ${ranking.division}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* XP */}
                <div className="text-right">
                  <p className="text-white font-bold text-lg">
                    {ranking.weeklyXP.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>

                {/* Promotion/Relegation Indicator */}
                {showPromotionZones && (
                  <div className="ml-3 w-8 text-center">
                    {ranking.rank <= promotionCutoff && (
                      <span className="text-green-400 text-xl">⬆️</span>
                    )}
                    {ranking.rank > relegationCutoff && (
                      <span className="text-red-400 text-xl">⬇️</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
