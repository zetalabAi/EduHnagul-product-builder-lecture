/**
 * Cultural Topic Learning Page
 * Learn specific cultural topic with scenarios
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ContextComparison } from "@/components/CultureImmersion/ContextComparison";
import { CulturalQuiz } from "@/components/CultureImmersion/CulturalQuiz";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export default function CulturalTopicPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const topicId = params.topicId as string;

  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

  useEffect(() => {
    loadTopic();
  }, [topicId, user]);

  const loadTopic = async () => {
    try {
      const getCulturalTopicFn = httpsCallable(functions, "getCulturalTopic");
      const result = await getCulturalTopicFn({ topicId });
      const data = result.data as any;
      setTopic(data.topic);
    } catch (error) {
      console.error("Failed to load topic:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">주제를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const currentScenario = topic.scenarios[currentScenarioIndex];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-6 flex items-center space-x-2"
        >
          <span>⬅️</span>
          <span>목록으로 돌아가기</span>
        </button>

        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-8 border border-purple-700 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{topic.title}</h1>
          <p className="text-gray-300 leading-relaxed">{topic.introduction}</p>
        </div>

        <div className="space-y-8">
          {topic.scenarios.map((scenario: any, index: number) => (
            <div key={scenario.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-purple-400">
                  시나리오 {index + 1}
                </h2>
                <span className="text-gray-400 text-sm">
                  {index + 1} / {topic.scenarios.length}
                </span>
              </div>

              <ContextComparison
                situation={scenario.situation}
                characters={scenario.characters}
                wrongWay={scenario.wrongWay}
                rightWay={scenario.rightWay}
                culturalNote={scenario.culturalNote}
                alternatives={scenario.alternatives}
              />

              {scenario.practiceExercise && (
                <CulturalQuiz
                  quizzes={[
                    {
                      question: scenario.practiceExercise.question,
                      options: scenario.practiceExercise.options,
                    },
                  ]}
                />
              )}

              {index < topic.scenarios.length - 1 && (
                <hr className="border-gray-700 my-8" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-bold text-xl mb-4">핵심 정리</h3>
          <ul className="space-y-2">
            {topic.keyTakeaways.map((takeaway: string, index: number) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="text-purple-400 flex-shrink-0">✓</span>
                <span className="text-gray-300">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {topic.commonMistakes && topic.commonMistakes.length > 0 && (
          <div className="mt-6 bg-red-900/20 border border-red-700 rounded-xl p-6">
            <h3 className="text-red-400 font-bold text-xl mb-4">흔한 실수</h3>
            <div className="space-y-4">
              {topic.commonMistakes.map((mistake: any, index: number) => (
                <div key={index} className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-white font-medium mb-2">❌ {mistake.mistake}</p>
                  <p className="text-gray-400 text-sm mb-2">{mistake.why}</p>
                  <p className="text-green-400 text-sm">✅ {mistake.fix}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
