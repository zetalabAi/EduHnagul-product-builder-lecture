"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";

/**
 * QuickStart Component
 * 빠른 시작 버튼들
 */
const QuickStart = memo(function QuickStart() {
  const router = useRouter();

  const quickActions = [
    {
      id: "chat",
      title: "실전 AI와 채팅",
      icon: "💬",
      route: "/chat",
      color: "from-blue-500 to-purple-600",
    },
    {
      id: "voice",
      title: "음성 대화",
      icon: "🎙️",
      route: "/voice",
      color: "from-green-500 to-teal-600",
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <span>⚡</span>
        <span>빠른 시작</span>
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => router.push(action.route)}
            className={`
              group relative overflow-hidden bg-gradient-to-br ${action.color}
              text-white p-4 rounded-xl shadow-lg
              hover:shadow-2xl hover:scale-105 transition-all duration-300
            `}
          >
            {/* Icon */}
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
              {action.icon}
            </div>

            {/* Title */}
            <div className="text-sm font-medium">{action.title}</div>

            {/* Arrow */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

export default QuickStart;
