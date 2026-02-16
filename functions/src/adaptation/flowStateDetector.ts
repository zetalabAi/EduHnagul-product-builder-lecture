/**
 * Flow State Detector
 * 학습자의 몰입 상태(Flow State) 감지 시스템
 *
 * Flow State = 최적의 학습 상태
 * - 정확도 60-85% (너무 쉽지도, 어렵지도 않음)
 * - 적절한 응답 시간
 * - 높은 자신감
 * - 일관성 있는 성과
 */

import { PerformanceMetrics } from "./performanceMonitor";

export interface FlowStateResult {
  isFlowState: boolean;
  flowQuality: number; // 0-1
  reasons: string[];
}

export class FlowStateDetector {
  /**
   * Flow State 감지
   * 최근 N개 메트릭을 분석하여 현재 Flow State 여부 판단
   */
  static detectFlowState(metrics: PerformanceMetrics[]): boolean {
    if (metrics.length < 3) {
      return false; // 최소 3개 샘플 필요
    }

    // 최근 5개만 분석
    const recentMetrics = metrics.slice(-5);

    // 1. 정확도 체크: 60-85% (sweet spot)
    const avgAccuracy = this.average(recentMetrics.map((m) => m.accuracy));
    const accuracyInRange = avgAccuracy >= 0.6 && avgAccuracy <= 0.85;

    // 2. 응답 시간 적절성
    const avgResponseTime = this.average(
      recentMetrics.map((m) => m.responseTimeScore)
    );
    const timeAppropriate = avgResponseTime >= 0.7;

    // 3. 자신감 높음
    const avgConfidence = this.average(
      recentMetrics.map((m) => m.confidence)
    );
    const highConfidence = avgConfidence >= 0.6;

    // 4. 일관성 체크 (표준편차가 낮음)
    const accuracyConsistency =
      this.standardDeviation(recentMetrics.map((m) => m.accuracy)) < 0.2;

    // Flow State = 모든 조건 만족
    return (
      accuracyInRange &&
      timeAppropriate &&
      highConfidence &&
      accuracyConsistency
    );
  }

  /**
   * Flow State 품질 점수 계산
   * 0 = Flow State 아님
   * 1 = 완벽한 Flow State
   */
  static calculateFlowQuality(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;

    const recentMetrics = metrics.slice(-5);

    // 1. 정확도 점수 (60-85% 범위에서 75%가 최적)
    const avgAccuracy = this.average(recentMetrics.map((m) => m.accuracy));
    const accuracyScore = this.calculateAccuracyScore(avgAccuracy);

    // 2. 응답 시간 점수
    const avgResponseTime = this.average(
      recentMetrics.map((m) => m.responseTimeScore)
    );
    const timeScore = avgResponseTime;

    // 3. 자신감 점수
    const avgConfidence = this.average(
      recentMetrics.map((m) => m.confidence)
    );
    const confidenceScore = avgConfidence;

    // 4. 일관성 점수 (낮은 표준편차 = 높은 점수)
    const accuracyStdDev = this.standardDeviation(
      recentMetrics.map((m) => m.accuracy)
    );
    const consistencyScore = Math.max(0, 1 - accuracyStdDev / 0.3);

    // 가중 평균
    const flowQuality =
      accuracyScore * 0.4 +
      timeScore * 0.2 +
      confidenceScore * 0.2 +
      consistencyScore * 0.2;

    return Math.max(0, Math.min(1, flowQuality));
  }

  /**
   * 상세 Flow State 분석
   */
  static analyzeFlowState(metrics: PerformanceMetrics[]): FlowStateResult {
    if (metrics.length < 3) {
      return {
        isFlowState: false,
        flowQuality: 0,
        reasons: ["데이터 부족 (최소 3개 필요)"],
      };
    }

    const recentMetrics = metrics.slice(-5);
    const reasons: string[] = [];

    // 정확도 분석
    const avgAccuracy = this.average(recentMetrics.map((m) => m.accuracy));
    if (avgAccuracy < 0.6) {
      reasons.push(`정확도 낮음 (${Math.round(avgAccuracy * 100)}%)`);
    } else if (avgAccuracy > 0.85) {
      reasons.push(`너무 쉬움 (${Math.round(avgAccuracy * 100)}%)`);
    } else {
      reasons.push(`정확도 적절 (${Math.round(avgAccuracy * 100)}%)`);
    }

    // 응답 시간 분석
    const avgResponseTime = this.average(
      recentMetrics.map((m) => m.responseTimeScore)
    );
    if (avgResponseTime < 0.7) {
      reasons.push("응답 시간 부적절");
    } else {
      reasons.push("응답 시간 적절");
    }

    // 자신감 분석
    const avgConfidence = this.average(
      recentMetrics.map((m) => m.confidence)
    );
    if (avgConfidence < 0.6) {
      reasons.push(`자신감 낮음 (${Math.round(avgConfidence * 100)}%)`);
    } else {
      reasons.push(`자신감 높음 (${Math.round(avgConfidence * 100)}%)`);
    }

    // 일관성 분석
    const accuracyStdDev = this.standardDeviation(
      recentMetrics.map((m) => m.accuracy)
    );
    if (accuracyStdDev > 0.2) {
      reasons.push("성과 일관성 부족");
    } else {
      reasons.push("성과 일관적");
    }

    const isFlowState = this.detectFlowState(metrics);
    const flowQuality = this.calculateFlowQuality(metrics);

    return {
      isFlowState,
      flowQuality,
      reasons,
    };
  }

  /**
   * 정확도 점수 계산
   * 75%가 최적점 (1.0)
   * 60% 이하 또는 85% 이상은 감점
   */
  private static calculateAccuracyScore(accuracy: number): number {
    const optimal = 0.75;
    const lowerBound = 0.6;
    const upperBound = 0.85;

    if (accuracy < lowerBound) {
      // 60% 이하: 선형 감소
      return accuracy / lowerBound;
    } else if (accuracy > upperBound) {
      // 85% 이상: 선형 감소
      return Math.max(0, 1 - (accuracy - upperBound) / (1 - upperBound));
    } else {
      // 60-85% 범위: 75%에서 최대
      const distance = Math.abs(accuracy - optimal);
      return 1 - distance / (upperBound - lowerBound);
    }
  }

  /**
   * 평균 계산
   */
  private static average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * 표준편차 계산
   */
  private static standardDeviation(arr: number[]): number {
    if (arr.length === 0) return 0;

    const avg = this.average(arr);
    const squaredDiffs = arr.map((x) => Math.pow(x - avg, 2));
    const variance = this.average(squaredDiffs);

    return Math.sqrt(variance);
  }

  /**
   * Flow State 지속 시간 계산 (분)
   */
  static calculateFlowDuration(
    metrics: PerformanceMetrics[]
  ): number | null {
    if (metrics.length < 3) return null;

    let flowStart: Date | null = null;
    let flowEnd: Date | null = null;

    // 연속된 Flow State 구간 찾기
    for (let i = 0; i < metrics.length - 2; i++) {
      const window = metrics.slice(i, i + 3);
      const isFlow = this.detectFlowState(window);

      if (isFlow && !flowStart) {
        flowStart = window[0].timestamp;
      }

      if (isFlow) {
        flowEnd = window[window.length - 1].timestamp;
      }

      if (!isFlow && flowStart) {
        break; // Flow 종료
      }
    }

    if (!flowStart || !flowEnd) return null;

    // 시간 차이 계산 (분)
    const durationMs = flowEnd.getTime() - flowStart.getTime();
    return durationMs / (1000 * 60);
  }
}
