/**
 * Cultural Immersion Home Page
 * Browse cultural learning topics
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ScenarioCard } from "@/components/CultureImmersion/ScenarioCard";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

type CategoryType = "all" | "social_hierarchy" | "indirect_communication" | "food_culture" | "dating" | "work_culture";

const CATEGORIES = [
  { id: "all", label: "전체", icon: "📚" },
  { id: "social_hierarchy", label: "사회적 위계", icon: "👥" },
  { id: "indirect_communication", label: "간접 표현", icon: "💬" },
  { id: "food_culture", label: "음식 문화", icon: "🍚" },
  { id: "dating", label: "연애", icon: "💑" },
  { id: "work_culture", label: "직장 문화", icon: "💼" },
];

export default function CultureImmersionPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");

  useEffect(() => {
    loadTopics();
  }, [user]);

  const loadTopics = async () => {
    try {
      const getAllCulturalTopicsFn = httpsCallable(functions, "getAllCulturalTopics");
      const result = await getAllCulturalTopicsFn({});
      const data = result.data as any;
      setTopics(data.topics || []);
    } catch (error) {
      console.error("Failed to load topics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">로그인이 필요합니다.</p>
      </div>
    );
  }

  const filteredTopics = activeCategory === "all"
    ? topics
    : topics.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🌏</div>
            <h1 className="text-4xl font-bold mb-4">Cultural Immersion</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              한국 문화의 미묘한 차이를 배우고, 실수하지 않는 표현법을 익히세요.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as CategoryType)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <ScenarioCard
                key={topic.id}
                topicId={topic.id}
                title={topic.title}
                category={topic.category}
                difficulty={topic.difficulty}
                estimatedTime={topic.estimatedTime}
                introduction={topic.introduction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
