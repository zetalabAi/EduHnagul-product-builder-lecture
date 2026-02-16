"use client";

import { memo, useState } from "react";

interface NotificationSetupProps {
  onNext: (data: {
    notifications: boolean;
    notificationTime?: string;
  }) => void;
}

/**
 * NotificationSetup Component - Step 6
 * Notification preferences setup
 */
const NotificationSetup = memo(function NotificationSetup({
  onNext,
}: NotificationSetupProps) {
  const [notifications, setNotifications] = useState(true);
  const [notificationTime, setNotificationTime] = useState("20:00");

  const handleNext = () => {
    onNext({
      notifications,
      notificationTime: notifications ? notificationTime : undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          알림 설정
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          학습 리마인더로 꾸준한 학습을 도와드려요
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🔔</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                학습 리마인더
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                매일 설정한 시간에 알림을 보내드려요
              </p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`
              relative w-14 h-8 rounded-full transition-colors duration-300
              ${
                notifications
                  ? "bg-primary-500"
                  : "bg-gray-300 dark:bg-gray-600"
              }
            `}
          >
            <div
              className={`
                absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300
                ${notifications ? "translate-x-7" : "translate-x-1"}
              `}
            />
          </button>
        </div>

        {notifications && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              알림 시간
            </label>
            <input
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              매일 이 시간에 학습 리마인더를 받게 됩니다
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔥</span>
            <h4 className="font-bold text-gray-900 dark:text-white">
              Streak 알림
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            연속 학습 기록이 끊기기 전에 알려드려요
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <h4 className="font-bold text-gray-900 dark:text-white">
              목표 달성
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            일일 목표를 달성하면 축하 메시지를 보내드려요
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold rounded-full shadow-lg transition-all duration-300"
        >
          다음
        </button>
      </div>
    </div>
  );
});

export default NotificationSetup;
