"use client";

import { memo, useState } from "react";

interface HintPanelProps {
  hint?: string;
  culturalNote?: string;
  grammarTip?: string;
  dramaReference?: string;
}

/**
 * HintPanel Component
 * 학습 힌트 표시 패널
 */
const HintPanel = memo(function HintPanel({
  hint,
  culturalNote,
  grammarTip,
  dramaReference,
}: HintPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "hint" | "culture" | "grammar" | "drama"
  >("hint");

  const tabs = [
    { id: "hint" as const, label: "💡 힌트", content: hint },
    { id: "culture" as const, label: "🌏 문화", content: culturalNote },
    { id: "grammar" as const, label: "📝 문법", content: grammarTip },
    { id: "drama" as const, label: "🎬 드라마", content: dramaReference },
  ];

  // Filter tabs with content
  const availableTabs = tabs.filter((tab) => tab.content);

  if (availableTabs.length === 0) {
    return null;
  }

  const currentTab = availableTabs.find((tab) => tab.id === activeTab) || availableTabs[0];

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl shadow-md overflow-hidden mb-4">
      {/* Tabs */}
      {availableTabs.length > 1 && (
        <div className="flex border-b border-yellow-200 dark:border-yellow-800">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-white text-primary-600 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {currentTab && (
          <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
            {currentTab.content}
          </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      {availableTabs.length === 1 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>학습 팁</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default HintPanel;
