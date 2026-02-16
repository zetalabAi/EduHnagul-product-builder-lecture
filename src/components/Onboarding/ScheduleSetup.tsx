"use client";

import { memo, useState } from "react";
import { DailyMinutes, PreferredTime, ScheduleOption, TimeOption } from "@/types/onboarding";

interface ScheduleSetupProps {
  onNext: (data: {
    dailyMinutes: DailyMinutes;
    preferredTime: PreferredTime;
  }) => void;
}

const scheduleOptions: ScheduleOption[] = [
  {
    minutes: 5,
    emoji: "🌱",
    title: "가볍게",
    desc: "5분/일",
  },
  {
    minutes: 15,
    emoji: "🌿",
    title: "적당히",
    desc: "15분/일",
  },
  {
    minutes: 30,
    emoji: "🌳",
    title: "열심히",
    desc: "30분+/일",
  },
];

const timeOptions: TimeOption[] = [
  {
    id: "morning",
    emoji: "🌅",
    title: "아침",
    time: "6-9시",
  },
  {
    id: "lunch",
    emoji: "🌞",
    title: "점심",
    time: "12-14시",
  },
  {
    id: "evening",
    emoji: "🌆",
    title: "저녁",
    time: "18-21시",
  },
  {
    id: "night",
    emoji: "🌙",
    title: "밤",
    time: "21시 이후",
  },
];

/**
 * ScheduleSetup Component - Step 5
 * Daily schedule and preferred time setup
 */
const ScheduleSetup = memo(function ScheduleSetup({
  onNext,
}: ScheduleSetupProps) {
  const [dailyMinutes, setDailyMinutes] = useState<DailyMinutes | null>(null);
  const [preferredTime, setPreferredTime] = useState<PreferredTime | null>(
    null
  );

  const handleNext = () => {
    if (!dailyMinutes || !preferredTime) {
      alert("모든 항목을 선택해주세요.");
      return;
    }

    onNext({ dailyMinutes, preferredTime });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          학습 스케줄 설정
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          매일 꾸준히 하는 것이 중요해요!
        </p>
      </div>

      {/* Daily Minutes */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          하루 얼마나 학습하고 싶나요?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scheduleOptions.map((option) => (
            <button
              key={option.minutes}
              onClick={() => setDailyMinutes(option.minutes)}
              className={`
                p-6 rounded-2xl border-2 transition-all duration-300
                ${
                  dailyMinutes === option.minutes
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-105"
                    : "border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md"
                }
              `}
            >
              <div className="text-5xl mb-3">{option.emoji}</div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {option.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Time */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          주로 언제 학습하나요?
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {timeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setPreferredTime(option.id)}
              className={`
                p-6 rounded-2xl border-2 transition-all duration-300
                ${
                  preferredTime === option.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-105"
                    : "border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md"
                }
              `}
            >
              <div className="text-4xl mb-2">{option.emoji}</div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                {option.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {option.time}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleNext}
          disabled={!dailyMinutes || !preferredTime}
          className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    </div>
  );
});

export default ScheduleSetup;
