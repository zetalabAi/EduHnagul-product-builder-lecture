"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { DetailedAnalysis } from "./DetailedAnalysis";
import { AdInterstitial } from "./AdInterstitial";

interface SessionSummaryProps {
  sessionId: string;
  onClose: () => void;
  onAnalyze?: () => void;
  isPro: boolean;
  subscriptionTier: "free" | "free+" | "pro" | "pro+";
}

interface SummaryData {
  totalDurationMinutes: number;
  userSpeakingPercentage: number;
  speakingLevel: string;
  messageCount: number;
  averageMessageLength: number;
  isComplete: boolean;
}

export function SessionSummary({
  sessionId,
  onClose,
  onAnalyze,
  isPro,
  subscriptionTier,
}: SessionSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [showEndAd, setShowEndAd] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [sessionId]);

  const loadSummary = async () => {
    if (!functions) return;

    try {
      const getSummaryFn = httpsCallable<{ sessionId: string }, SummaryData>(
        functions,
        "getSessionSummary"
      );

      const result = await getSummaryFn({ sessionId });
      setSummary(result.data);
    } catch (error) {
      console.error("Failed to load summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">분석 중...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">
          🎉 {summary.isComplete ? "대화 완료!" : "중간 보고서"}
        </h2>

        {/* Basic Stats */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">⏱️ 대화 시간</span>
              <span className="font-bold text-xl">{summary.totalDurationMinutes}분</span>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">💬 대화 점유율</span>
              <span className="font-bold text-xl text-blue-400">
                {summary.userSpeakingPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-3 mt-2">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${summary.userSpeakingPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              당신이 {summary.userSpeakingPercentage}% 말했어요!
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">📈 말하기 레벨</span>
              <span className="font-bold text-lg text-green-400">
                {summary.speakingLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Pro Features */}
        {isPro ? (
          <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-200 mb-3">
              💎 Pro 추가 정보
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">총 메시지</span>
                <span className="font-bold">{summary.messageCount}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">평균 문장 길이</span>
                <span className="font-bold">{summary.averageMessageLength}자</span>
              </div>
            </div>
            <button
              onClick={() => setShowDetailedAnalysis(true)}
              className="w-full mt-3 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold"
            >
              📊 디테일 분석 보기
            </button>
          </div>
        ) : (
          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-blue-200 mb-2">
              더 자세한 분석이 필요하신가요?
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Pro 플랜에서 발음, 어휘력, 문장구성력까지!
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold">
              Pro 알아보기
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {summary.isComplete ? (
            <>
              <button
                onClick={() => {
                  if (subscriptionTier === "free") {
                    setShowEndAd(true);
                  } else {
                    onClose();
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold"
              >
                ✅ 확인
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg"
              >
                🔄 새 대화 시작
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold"
              >
                ▶️ 대화 계속하기
              </button>
              <button
                onClick={async () => {
                  if (!functions) return;
                  const endFn = httpsCallable(functions, "endSession");
                  await endFn({ sessionId });
                  loadSummary();
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg"
              >
                ⏹️ 종료하기
              </button>
            </>
          )}
        </div>

        {/* Detailed Analysis Modal */}
        {showDetailedAnalysis && (
          <DetailedAnalysis
            sessionId={sessionId}
            onClose={() => setShowDetailedAnalysis(false)}
          />
        )}
      </div>

      {/* End Ad Interstitial (Free tier only, when session complete) */}
      {showEndAd && subscriptionTier === "free" && summary?.isComplete && (
        <AdInterstitial
          onClose={() => {
            setShowEndAd(false);
            onClose();
          }}
          countdown={5}
        />
      )}
    </div>
  );
}
