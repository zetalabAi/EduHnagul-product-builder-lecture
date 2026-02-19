"use client";

import { memo } from "react";

interface CalendarDay {
  date: Date;
  active: boolean;
  freezeUsed?: boolean;
}

interface StreakCalendarProps {
  calendar: CalendarDay[];
}

/**
 * StreakCalendar Component
 * Display 30-day streak calendar
 */
const StreakCalendar = memo(function StreakCalendar({
  calendar,
}: StreakCalendarProps) {
  const getDayOfWeek = (date: Date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[date.getDay()];
  };

  const getDateLabel = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="bg-white dark:bg-white rounded-2xl p-4 shadow-md">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        📅 학습 달력 (최근 30일)
      </h3>

      <div className="grid grid-cols-7 gap-2">
        {calendar.map((day, index) => {
          const isToday =
            day.date.toDateString() === new Date().toDateString();

          return (
            <div key={index} className="text-center">
              {/* Day of week (show only for first 7 days) */}
              {index < 7 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {getDayOfWeek(day.date)}
                </div>
              )}

              {/* Day indicator */}
              <div
                className={`
                  relative w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all
                  ${
                    day.active
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md"
                      : day.freezeUsed
                      ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-100 text-gray-400 dark:text-gray-500"
                  }
                  ${isToday ? "ring-2 ring-primary-500 ring-offset-2" : ""}
                `}
                title={`${getDateLabel(day.date)} - ${
                  day.active
                    ? "활동"
                    : day.freezeUsed
                    ? "프리즈 사용"
                    : "비활성"
                }`}
              >
                {day.active && "✓"}
                {day.freezeUsed && "❄️"}
                {!day.active && !day.freezeUsed && day.date.getDate()}

                {/* Today indicator */}
                {isToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full" />
                )}
              </div>

              {/* Date label (show for every 7th day) */}
              {index % 7 === 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getDateLabel(day.date)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded" />
          <span className="text-gray-600 dark:text-gray-400">활동</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded" />
          <span className="text-gray-600 dark:text-gray-400">프리즈</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-100 rounded" />
          <span className="text-gray-600 dark:text-gray-400">비활성</span>
        </div>
      </div>
    </div>
  );
});

export default StreakCalendar;
