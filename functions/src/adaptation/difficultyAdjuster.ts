/**
 * Difficulty Adjuster
 * 실시간 적응형 난이도 조절 시스템
 *
 * 목표: 사용자를 Flow State로 유도
 * - 너무 쉬우면 난이도 증가
 * - 너무 어려우면 난이도 감소
 * - Flow State면 유지
 */

import { PerformanceMetrics } from "./performanceMonitor";
import { FlowStateDetector } from "./flowStateDetector";

export interface DifficultyAdjustment {
  newDifficulty: number; // 0-1
  previousDifficulty: number;
  change: number;
  reason: string;
  recommendation: string;
}

export class DifficultyAdjuster {
  // 조절 상수
  private static readonly INCREMENT = 0.1; // 증가폭
  private static readonly DECREMENT = 0.1; // 감소폭
  private static readonly MIN_DIFFICULTY = 0.2;
  private static readonly MAX_DIFFICULTY = 1.0;

  /**
   * 난이도 자동 조절
   * Flow State 분석 후 적절한 난이도 제안
   */
  static adjustDifficulty(
    currentDifficulty: number,
    metrics: PerformanceMetrics[]
  ): DifficultyAdjustment {
    if (metrics.length < 3) {
      return {
        newDifficulty: currentDifficulty,
        previousDifficulty: currentDifficulty,
        change: 0,
        reason: "데이터 부족 (최소 3개 필요)",
        recommendation: "계속 학습하세요",
      };
    }

    const recentMetrics = metrics.slice(-5);

    // 평균 성과 계산
    const avgAccuracy = this.average(recentMetrics.map((m) => m.accuracy));
    const avgResponseTime = this.average(
      recentMetrics.map((m) => m.responseTimeScore)
    );
    const avgConfidence = this.average(
      recentMetrics.map((m) => m.confidence)
    );

    // Flow State 감지
    const isFlowState = FlowStateDetector.detectFlowState(metrics);
    const flowQuality = FlowStateDetector.calculateFlowQuality(metrics);

    let newDifficulty = currentDifficulty;
    let reason = "";
    let recommendation = "";

    // Case 1: Flow State - 유지
    if (isFlowState && flowQuality >= 0.7) {
      newDifficulty = currentDifficulty;
      reason = `Flow State 유지 (품질: ${Math.round(flowQuality * 100)}%)`;
      recommendation = "현재 난이도가 최적입니다. 계속 진행하세요!";
    }
    // Case 2: 너무 쉬움 - 난이도 증가
    else if (avgAccuracy > 0.85 && avgResponseTime > 0.7) {
      newDifficulty = Math.min(
        this.MAX_DIFFICULTY,
        currentDifficulty + this.INCREMENT
      );
      reason = `너무 쉬움 (정확도 ${Math.round(avgAccuracy * 100)}%)`;
      recommendation =
        "더 도전적인 내용으로 실력을 향상시켜보세요!";
    }
    // Case 3: 너무 어려움 - 난이도 감소
    else if (avgAccuracy < 0.6 || avgConfidence < 0.5) {
      newDifficulty = Math.max(
        this.MIN_DIFFICULTY,
        currentDifficulty - this.DECREMENT
      );
      reason = avgAccuracy < 0.6
        ? `정확도 낮음 (${Math.round(avgAccuracy * 100)}%)`
        : `자신감 부족 (${Math.round(avgConfidence * 100)}%)`;
      recommendation =
        "조금 더 쉬운 내용부터 차근차근 익혀보세요.";
    }
    // Case 4: 적절하지만 Flow State 아님 - 미세 조정
    else if (avgAccuracy >= 0.6 && avgAccuracy <= 0.85) {
      // Flow State에 가까워지도록 미세 조정
      if (avgAccuracy < 0.7) {
        // 60-70%: 약간 감소
        newDifficulty = Math.max(
          this.MIN_DIFFICULTY,
          currentDifficulty - this.INCREMENT / 2
        );
        reason = "약간 어려움 (Flow State 유도)";
        recommendation = "난이도를 약간 낮춰 자신감을 높여보세요.";
      } else if (avgAccuracy > 0.8) {
        // 80-85%: 약간 증가
        newDifficulty = Math.min(
          this.MAX_DIFFICULTY,
          currentDifficulty + this.INCREMENT / 2
        );
        reason = "약간 쉬움 (Flow State 유도)";
        recommendation = "난이도를 약간 높여 도전해보세요.";
      } else {
        // 70-80%: 유지 (거의 Flow State)
        newDifficulty = currentDifficulty;
        reason = "적절한 난이도 (Flow State 근접)";
        recommendation = "현재 속도를 유지하세요!";
      }
    }
    // Case 5: 예외 상황
    else {
      newDifficulty = currentDifficulty;
      reason = "판단 보류";
      recommendation = "더 많은 데이터가 필요합니다.";
    }

    // 난이도 범위 보정
    newDifficulty = Math.max(
      this.MIN_DIFFICULTY,
      Math.min(this.MAX_DIFFICULTY, newDifficulty)
    );

    const change = newDifficulty - currentDifficulty;

    return {
      newDifficulty,
      previousDifficulty: currentDifficulty,
      change,
      reason,
      recommendation,
    };
  }

  /**
   * 세션 기반 난이도 조절
   * 전체 세션 동안의 성과를 분석하여 다음 세션 난이도 제안
   */
  static adjustForNextSession(
    currentDifficulty: number,
    sessionMetrics: PerformanceMetrics[]
  ): DifficultyAdjustment {
    if (sessionMetrics.length < 5) {
      return {
        newDifficulty: currentDifficulty,
        previousDifficulty: currentDifficulty,
        change: 0,
        reason: "세션 데이터 부족",
        recommendation: "더 긴 학습 세션을 진행해주세요",
      };
    }

    // 전체 세션 평균
    const avgAccuracy = this.average(
      sessionMetrics.map((m) => m.accuracy)
    );
    const flowDuration = FlowStateDetector.calculateFlowDuration(
      sessionMetrics
    );

    let newDifficulty = currentDifficulty;
    let reason = "";
    let recommendation = "";

    // Flow State 지속 시간 기반 조절
    if (flowDuration && flowDuration > 10) {
      // 10분 이상 Flow State 유지
      newDifficulty = Math.min(
        this.MAX_DIFFICULTY,
        currentDifficulty + this.INCREMENT
      );
      reason = `우수한 성과 (Flow ${Math.round(flowDuration)}분)`;
      recommendation = "다음 세션에서 더 도전적인 내용을 시도하세요!";
    } else if (avgAccuracy < 0.5) {
      // 전반적으로 어려웠음
      newDifficulty = Math.max(
        this.MIN_DIFFICULTY,
        currentDifficulty - this.DECREMENT
      );
      reason = `전반적으로 어려움 (${Math.round(avgAccuracy * 100)}%)`;
      recommendation = "다음 세션은 기초를 복습하며 시작하세요.";
    } else {
      // 유지
      newDifficulty = currentDifficulty;
      reason = "적절한 진행";
      recommendation = "현재 속도로 계속 학습하세요.";
    }

    const change = newDifficulty - currentDifficulty;

    return {
      newDifficulty,
      previousDifficulty: currentDifficulty,
      change,
      reason,
      recommendation,
    };
  }

  /**
   * 긴급 난이도 조절
   * 사용자가 심하게 어려워하거나 지루해할 때 즉시 개입
   */
  static emergencyAdjust(
    currentDifficulty: number,
    metrics: PerformanceMetrics[]
  ): DifficultyAdjustment | null {
    if (metrics.length < 3) return null;

    const recentMetrics = metrics.slice(-3);
    const recentAccuracy = this.average(
      recentMetrics.map((m) => m.accuracy)
    );
    const recentConfidence = this.average(
      recentMetrics.map((m) => m.confidence)
    );

    // 긴급 상황 1: 연속 3회 정확도 < 40% (너무 어려움)
    if (recentAccuracy < 0.4) {
      const newDifficulty = Math.max(
        this.MIN_DIFFICULTY,
        currentDifficulty - this.DECREMENT * 2 // 2배 감소
      );

      return {
        newDifficulty,
        previousDifficulty: currentDifficulty,
        change: newDifficulty - currentDifficulty,
        reason: "⚠️ 긴급: 너무 어려움",
        recommendation:
          "난이도를 크게 낮췄습니다. 기초부터 다시 시작해보세요.",
      };
    }

    // 긴급 상황 2: 연속 3회 정확도 > 95% (너무 쉬움)
    if (recentAccuracy > 0.95) {
      const newDifficulty = Math.min(
        this.MAX_DIFFICULTY,
        currentDifficulty + this.DECREMENT * 2 // 2배 증가
      );

      return {
        newDifficulty,
        previousDifficulty: currentDifficulty,
        change: newDifficulty - currentDifficulty,
        reason: "⚠️ 긴급: 너무 쉬움",
        recommendation:
          "난이도를 크게 높였습니다. 더 도전적인 내용을 시도하세요!",
      };
    }

    // 긴급 상황 3: 자신감 급락 (< 30%)
    if (recentConfidence < 0.3) {
      const newDifficulty = Math.max(
        this.MIN_DIFFICULTY,
        currentDifficulty - this.DECREMENT * 1.5
      );

      return {
        newDifficulty,
        previousDifficulty: currentDifficulty,
        change: newDifficulty - currentDifficulty,
        reason: "⚠️ 긴급: 자신감 부족",
        recommendation:
          "자신감을 회복할 수 있도록 난이도를 낮췄습니다.",
      };
    }

    return null; // 긴급 상황 아님
  }

  /**
   * 난이도 레벨 라벨 반환
   */
  static getDifficultyLabel(difficulty: number): string {
    if (difficulty < 0.3) return "입문 (Beginner)";
    if (difficulty < 0.5) return "초급 (Elementary)";
    if (difficulty < 0.7) return "중급 (Intermediate)";
    if (difficulty < 0.9) return "고급 (Advanced)";
    return "최고급 (Expert)";
  }

  /**
   * 난이도 조절 히스토리 분석
   * 난이도 변화 추세를 분석하여 학습 진척도 평가
   */
  static analyzeDifficultyTrend(
    difficultyHistory: Array<{ difficulty: number; timestamp: Date }>
  ): {
    trend: "improving" | "stable" | "declining";
    avgDifficulty: number;
    message: string;
  } {
    if (difficultyHistory.length < 5) {
      return {
        trend: "stable",
        avgDifficulty: difficultyHistory[0]?.difficulty || 0.5,
        message: "데이터 부족",
      };
    }

    const recentHistory = difficultyHistory.slice(-10);
    const avgDifficulty = this.average(
      recentHistory.map((h) => h.difficulty)
    );

    // 선형 회귀로 추세 분석
    const firstHalf = recentHistory.slice(0, Math.floor(recentHistory.length / 2));
    const secondHalf = recentHistory.slice(Math.floor(recentHistory.length / 2));

    const firstAvg = this.average(firstHalf.map((h) => h.difficulty));
    const secondAvg = this.average(secondHalf.map((h) => h.difficulty));

    const difference = secondAvg - firstAvg;

    let trend: "improving" | "stable" | "declining";
    let message: string;

    if (difference > 0.1) {
      trend = "improving";
      message = "실력이 꾸준히 향상되고 있습니다! 🎉";
    } else if (difference < -0.1) {
      trend = "declining";
      message = "최근 어려움을 겪고 있습니다. 복습이 필요합니다.";
    } else {
      trend = "stable";
      message = "현재 레벨을 안정적으로 유지하고 있습니다.";
    }

    return {
      trend,
      avgDifficulty,
      message,
    };
  }

  /**
   * 평균 계산
   */
  private static average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}
