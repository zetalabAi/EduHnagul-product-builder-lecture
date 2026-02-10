"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface DetailedAnalysisProps {
  sessionId: string;
  onClose: () => void;
}

interface AnalysisData {
  pronunciation: { score: number; feedback: string[] };
  vocabulary: { score: number; feedback: string[] };
  grammar: { score: number; feedback: string[] };
  fluency: { score: number; feedback: string[] };
  suggestions: string[];
  canAnalyzeAgain: boolean;
  usageInfo: string;
}

export function DetailedAnalysis({ sessionId, onClose }: DetailedAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [sessionId]);

  const loadAnalysis = async () => {
    if (!functions) return;

    try {
      const analysisFn = httpsCallable<{ sessionId: string }, AnalysisData>(
        functions,
        "getDetailedAnalysis"
      );

      const result = await analysisFn({ sessionId });
      setAnalysis(result.data);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "분석에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-bold">AI가 대화를 분석 중...</p>
          <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4 text-red-400">분석 실패</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">📊 디테일 대화 분석</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
            ✕
          </button>
        </div>

        <p className="text-sm text-purple-300 mb-4">{analysis.usageInfo}</p>

        {/* Disclaimer */}
        <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-6">
          <p className="text-xs text-yellow-200">
            ℹ️ <strong>발음 피드백</strong>은 텍스트 기반 분석입니다. 정확한 오디오 기반 발음 분석은 준비 중입니다.
          </p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <ScoreCard
            title="🗣️ 발음 피드백 (베타)"
            score={analysis.pronunciation.score}
            feedback={analysis.pronunciation.feedback}
          />
          <ScoreCard
            title="📚 어휘력"
            score={analysis.vocabulary.score}
            feedback={analysis.vocabulary.feedback}
          />
          <ScoreCard
            title="🏗️ 문장 구성"
            score={analysis.grammar.score}
            feedback={analysis.grammar.feedback}
          />
          <ScoreCard
            title="💬 유창성"
            score={analysis.fluency.score}
            feedback={analysis.fluency.feedback}
          />
        </div>

        {/* Suggestions */}
        <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-3 flex items-center">
            💡 개선 제안
          </h3>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-sm text-gray-200 flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold"
          >
            확인
          </button>
          {analysis.canAnalyzeAgain && (
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                loadAnalysis();
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              🔄
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  feedback,
}: {
  title: string;
  score: number;
  feedback: string[];
}) {
  const color =
    score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-orange-400";

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-sm">{title}</h4>
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
      </div>
      <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all ${
            score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-orange-500"
          }`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      <ul className="space-y-1">
        {feedback.slice(0, 2).map((item, idx) => (
          <li key={idx} className="text-xs text-gray-300 flex items-start">
            <span className="mr-1">{idx === 0 ? "✅" : "⚠️"}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
