/**
 * Weekly Progress Component
 * Display user's weekly XP progress and daily breakdown
 */

"use client";

import { useMemo } from "react";

interface DailyXPData {
  day: string;
  xp: number;
}

interface WeeklyProgressProps {
  weeklyXP: number;
  firstPlaceXP: number;
  dailyData?: DailyXPData[];
}

export function WeeklyProgress({
  weeklyXP,
  firstPlaceXP,
  dailyData = [],
}: WeeklyProgressProps) {
  const gap = firstPlaceXP - weeklyXP;
  const progressPercent = firstPlaceXP > 0 ? (weeklyXP / firstPlaceXP) * 100 : 0;

  // Generate mock daily data if not provided
  const mockDailyData = useMemo(() => {
    if (dailyData.length > 0) return dailyData;

    const days = ["월", "화", "수", "목", "금", "토", "일"];
    return days.map((day) => ({
      day,
      xp: Math.floor(Math.random() * 300),
    }));
  }, [dailyData]);

  const maxDailyXP = Math.max(...mockDailyData.map((d) => d.xp), 1);

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-700">
      <h3 className="text-white font-semibold text-lg mb-4">주간 진행 상황</h3>

      {/* XP Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">내 주간 XP</span>
          <span className="text-white font-bold">{weeklyXP.toLocaleString()}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Gap to First Place */}
      {gap > 0 && (
        <div className="bg-white rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">1등과의 차이</span>
            <span className="text-orange-400 font-bold">
              -{gap.toLocaleString()} XP
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            조금만 더 노력하면 1등에 도달할 수 있어요! 🔥
          </p>
        </div>
      )}

      {gap === 0 && weeklyXP > 0 && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">🏆</span>
            <span className="text-yellow-400 font-bold">현재 1등입니다!</span>
          </div>
        </div>
      )}

      {/* Daily XP Graph */}
      <div>
        <h4 className="text-gray-400 text-sm mb-3">일일 XP</h4>
        <div className="flex items-end justify-between space-x-1 h-32">
          {mockDailyData.map((data, index) => {
            const heightPercent = (data.xp / maxDailyXP) * 100;
            const isToday = index === new Date().getDay() - 1; // Adjust for Monday start

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                {/* Bar */}
                <div className="w-full flex items-end justify-center mb-1" style={{ height: "100px" }}>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isToday
                        ? "bg-gradient-to-t from-blue-500 to-cyan-400"
                        : data.xp > 0
                        ? "bg-gradient-to-t from-gray-600 to-gray-500"
                        : "bg-white"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    {data.xp > 0 && (
                      <div className="text-white text-xs text-center pt-1">
                        {data.xp}
                      </div>
                    )}
                  </div>
                </div>

                {/* Day Label */}
                <span
                  className={`text-xs ${
                    isToday ? "text-blue-400 font-bold" : "text-gray-500"
                  }`}
                >
                  {data.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Total */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">이번 주 총 XP</span>
          <span className="text-white font-bold text-lg">
            {weeklyXP.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
