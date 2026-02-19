/**
 * League Card Component
 * Display current league tier and weekly progress
 */

"use client";

import { League, LeagueTier } from "@/types/league";

interface LeagueCardProps {
  league: League | null;
  weeklyXP: number;
  rank: number | null;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
  };
}

const TIER_COLORS: Record<LeagueTier, string> = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-400 to-gray-600",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-cyan-400 to-blue-600",
  diamond: "from-purple-500 to-pink-600",
};

const TIER_ICONS: Record<LeagueTier, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  diamond: "👑",
};

const TIER_NAMES: Record<LeagueTier, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  platinum: "플래티넘",
  diamond: "다이아몬드",
};

export function LeagueCard({ league, weeklyXP, rank, timeRemaining }: LeagueCardProps) {
  if (!league) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400 text-center">리그 정보를 불러오는 중...</p>
      </div>
    );
  }

  const tierColor = TIER_COLORS[league.tier];
  const tierIcon = TIER_ICONS[league.tier];
  const tierName = TIER_NAMES[league.tier];

  return (
    <div className={`bg-gradient-to-br ${tierColor} rounded-xl p-6 shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-5xl">{tierIcon}</div>
          <div>
            <h2 className="text-2xl font-bold text-white">{tierName} 리그</h2>
            <p className="text-white/80 text-sm">디비전 {league.division}</p>
          </div>
        </div>

        {rank && (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-white/80 text-xs">내 순위</p>
            <p className="text-white text-2xl font-bold">#{rank}</p>
          </div>
        )}
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white/80">주간 XP</span>
          <span className="text-white text-xl font-bold">{weeklyXP.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/80">주말까지 남은 시간</span>
          <span className="text-white font-bold">
            {timeRemaining.days > 0 && `${timeRemaining.days}일 `}
            {timeRemaining.hours}시간 {timeRemaining.minutes}분
          </span>
        </div>
      </div>

      {/* Promotion/Relegation Info */}
      <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
        <p className="text-white/90 text-sm text-center">
          💡 상위 10% 승급 · 하위 20% 강등
        </p>
      </div>
    </div>
  );
}
