/**
 * Shadow Speaking Home Page
 * Browse and select shadow speaking content
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ShadowPlayer } from "@/components/Shadow/ShadowPlayer";

interface Content {
  id: string;
  title: string;
  category: "daily" | "business" | "casual" | "drama" | "advanced";
  difficulty: number; // 1-5
  duration: number; // seconds
  sentences: number;
  bestScore?: number;
}

const MOCK_CONTENTS: Content[] = [
  {
    id: "daily_greeting",
    title: "일상 인사",
    category: "daily",
    difficulty: 1,
    duration: 30,
    sentences: 5,
    bestScore: 85,
  },
  {
    id: "business_meeting",
    title: "비즈니스 회의",
    category: "business",
    difficulty: 3,
    duration: 60,
    sentences: 8,
  },
  {
    id: "casual_chat",
    title: "친구와 대화",
    category: "casual",
    difficulty: 2,
    duration: 45,
    sentences: 6,
    bestScore: 92,
  },
  {
    id: "drama_scene",
    title: "드라마 장면",
    category: "drama",
    difficulty: 4,
    duration: 90,
    sentences: 10,
  },
  {
    id: "kdrama_confession",
    title: "고백 장면",
    category: "drama",
    difficulty: 5,
    duration: 120,
    sentences: 12,
  },
];

const CATEGORY_LABELS = {
  daily: "일상",
  business: "비즈니스",
  casual: "캐주얼",
  drama: "드라마",
  advanced: "고급",
};

export default function ShadowSpeakingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">로그인이 필요합니다.</p>
      </div>
    );
  }

  const filteredContents = categoryFilter
    ? MOCK_CONTENTS.filter((c) => c.category === categoryFilter)
    : MOCK_CONTENTS;

  if (selectedContent) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedContent(null)}
            className="text-gray-400 hover:text-white mb-6 flex items-center space-x-2"
          >
            <span>⬅️</span>
            <span>목록으로 돌아가기</span>
          </button>

          <ShadowPlayer contentId={selectedContent} userId={user.uid} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-cyan-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🎙️</div>
            <h1 className="text-4xl font-bold mb-4">Shadow Speaking</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              원어민 음성을 듣고 바로 따라 말하며 발음과 리듬을 완벽하게 익히세요.
              동시통역사들이 사용하는 훈련 방법입니다.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-3">카테고리</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                categoryFilter === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              전체
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  categoryFilter === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((content) => (
            <div
              key={content.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">
                  {content.title}
                </h3>
                {content.bestScore && (
                  <div className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                    ⭐ {content.bestScore}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div className="flex items-center space-x-2">
                  <span>📂</span>
                  <span>{CATEGORY_LABELS[content.category]}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>난이도 {content.difficulty}/5</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⏱️</span>
                  <span>{content.duration}초</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>💬</span>
                  <span>{content.sentences}개 문장</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedContent(content.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all transform group-hover:scale-105"
              >
                {content.bestScore ? "🔄 다시 연습" : "▶️ 시작하기"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
