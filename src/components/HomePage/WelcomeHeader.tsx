"use client";

import { memo } from "react";
import Image from "next/image";

interface WelcomeHeaderProps {
  userName: string;
  streak: number;
  profileImage?: string;
}

/**
 * WelcomeHeader Component
 * 상단 환영 메시지 + Streak + 프로필 아이콘
 */
const WelcomeHeader = memo(function WelcomeHeader({
  userName,
  streak,
  profileImage,
}: WelcomeHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* 환영 메시지 */}
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          안녕하세요, {userName}님! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
          오늘도 한국어 정복해볼까요?
        </p>
      </div>

      {/* Streak + 프로필 */}
      <div className="flex items-center gap-3">
        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-lg">
          <span className="text-xl">🔥</span>
          <span className="font-bold text-lg">{streak}</span>
        </div>

        {/* Profile Icon */}
        <div className="relative">
          {profileImage ? (
            <Image
              src={profileImage}
              alt={userName}
              width={48}
              height={48}
              className="rounded-full border-2 border-primary-500 shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white dark:border-gray-800">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Active indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
        </div>
      </div>
    </div>
  );
});

export default WelcomeHeader;
