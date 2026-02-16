/**
 * useAdaptiveLearning Hook
 * 적응형 학습 시스템 클라이언트 훅
 *
 * 사용자 성과를 모니터링하고 실시간 난이도 조절
 */

import { useState, useCallback, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

export interface PerformanceData {
  userInput: string;
  expectedOutput?: string;
  responseTime: number;
  hintRequests?: number;
}

export interface AdaptiveLearningState {
  currentDifficulty: number;
  isFlowState: boolean;
  flowQuality: number;
  feedback: string | null;
  isAnalyzing: boolean;
  error: string | null;
  difficultyLabel: string;
  difficultyHistory: Array<{ difficulty: number; timestamp: Date }>;
}

export interface UseAdaptiveLearningReturn {
  state: AdaptiveLearningState;
  analyzePerformance: (data: PerformanceData) => Promise<void>;
  resetState: () => void;
  getDifficultyLabel: (difficulty: number) => string;
}

/**
 * 적응형 학습 Hook
 */
export function useAdaptiveLearning(
  userId: string | null,
  sessionId: string | null,
  initialDifficulty: number = 0.5
): UseAdaptiveLearningReturn {
  const [state, setState] = useState<AdaptiveLearningState>({
    currentDifficulty: initialDifficulty,
    isFlowState: false,
    flowQuality: 0,
    feedback: null,
    isAnalyzing: false,
    error: null,
    difficultyLabel: getDifficultyLabel(initialDifficulty),
    difficultyHistory: [],
  });

  const [startTime, setStartTime] = useState<number | null>(null);

  // 응답 시간 측정 시작
  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  /**
   * 성과 분석 실행
   */
  const analyzePerformance = useCallback(
    async (data: PerformanceData) => {
      if (!userId || !sessionId) {
        console.warn("User ID or Session ID is missing");
        return;
      }

      setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

      try {
        const functions = getFunctions();
        const adaptiveResponseFn = httpsCallable(functions, "adaptiveResponse");

        const result = await adaptiveResponseFn({
          userId,
          sessionId,
          userInput: data.userInput,
          expectedOutput: data.expectedOutput,
          responseTime: data.responseTime,
          currentDifficulty: state.currentDifficulty,
          hintRequests: data.hintRequests || 0,
        });

        const response = result.data as any;

        // 상태 업데이트
        setState((prev) => ({
          ...prev,
          currentDifficulty: response.difficultyAdjustment.newDifficulty,
          isFlowState: response.flowState.isFlowState,
          flowQuality: response.flowState.flowQuality,
          feedback: response.feedback,
          difficultyLabel: getDifficultyLabel(
            response.difficultyAdjustment.newDifficulty
          ),
          difficultyHistory: [
            ...prev.difficultyHistory,
            {
              difficulty: response.difficultyAdjustment.newDifficulty,
              timestamp: new Date(),
            },
          ],
          isAnalyzing: false,
        }));

        // 긴급 조절이 있었다면 알림
        if (response.emergencyAdjust) {
          console.log("🚨 긴급 난이도 조절:", response.emergencyAdjust.reason);
        }

        // Flow State 달성 시 축하
        if (response.flowState.isFlowState && !state.isFlowState) {
          console.log("🌟 Flow State 달성!");
        }
      } catch (error: any) {
        console.error("Adaptive learning error:", error);
        setState((prev) => ({
          ...prev,
          error: error.message || "성과 분석 중 오류가 발생했습니다.",
          isAnalyzing: false,
        }));
      }
    },
    [userId, sessionId, state.currentDifficulty, state.isFlowState]
  );

  /**
   * 상태 초기화
   */
  const resetState = useCallback(() => {
    setState({
      currentDifficulty: initialDifficulty,
      isFlowState: false,
      flowQuality: 0,
      feedback: null,
      isAnalyzing: false,
      error: null,
      difficultyLabel: getDifficultyLabel(initialDifficulty),
      difficultyHistory: [],
    });
    setStartTime(Date.now());
  }, [initialDifficulty]);

  return {
    state,
    analyzePerformance,
    resetState,
    getDifficultyLabel,
  };
}

/**
 * 난이도 레벨 라벨 반환
 */
function getDifficultyLabel(difficulty: number): string {
  if (difficulty < 0.3) return "입문";
  if (difficulty < 0.5) return "초급";
  if (difficulty < 0.7) return "중급";
  if (difficulty < 0.9) return "고급";
  return "최고급";
}

/**
 * 응답 시간 측정 Hook
 */
export function useResponseTimer() {
  const [startTime, setStartTime] = useState<number>(Date.now());

  const resetTimer = useCallback(() => {
    setStartTime(Date.now());
  }, []);

  const getElapsedTime = useCallback(() => {
    return (Date.now() - startTime) / 1000; // 초 단위
  }, [startTime]);

  return {
    resetTimer,
    getElapsedTime,
  };
}
