/**
 * Performance Monitor
 * 사용자 학습 성과 모니터링 시스템
 */

export interface PerformanceMetrics {
  accuracy: number; // 0-1
  responseTimeScore: number; // 0-1
  confidence: number; // 0-1
  timestamp: Date;
  hintRequests?: number;
}

export interface AggregatedMetrics {
  avgAccuracy: number;
  avgResponseTime: number;
  avgConfidence: number;
  flowState: boolean;
}

export interface SessionContext {
  difficulty: number;
  hintRequests: number;
  messageCount: number;
}

export class PerformanceMonitor {
  /**
   * 사용자 응답 분석
   */
  static analyzeResponse(
    userInput: string,
    expectedOutput: string,
    responseTime: number,
    context: SessionContext
  ): PerformanceMetrics {
    // 1. 정확도 계산
    const accuracy = this.calculateAccuracy(userInput, expectedOutput);

    // 2. 응답 시간 평가
    const responseTimeScore = this.evaluateResponseTime(
      responseTime,
      context.difficulty
    );

    // 3. 자신감 추정
    const confidence = this.estimateConfidence(
      accuracy,
      responseTime,
      context.hintRequests
    );

    return {
      accuracy,
      responseTimeScore,
      confidence,
      timestamp: new Date(),
      hintRequests: context.hintRequests,
    };
  }

  /**
   * 정확도 계산 (Levenshtein Distance 기반)
   */
  static calculateAccuracy(userInput: string, expected: string): number {
    if (!userInput || !expected) return 0;

    const distance = this.levenshteinDistance(
      userInput.toLowerCase().trim(),
      expected.toLowerCase().trim()
    );

    const maxLength = Math.max(userInput.length, expected.length);
    if (maxLength === 0) return 1;

    return Math.max(0, 1 - distance / maxLength);
  }

  /**
   * 응답 시간 평가
   * 너무 빠름 = 너무 쉬움
   * 적절한 시간 = 좋은 난이도
   * 너무 느림 = 너무 어려움
   */
  private static evaluateResponseTime(
    responseTime: number,
    difficulty: number
  ): number {
    // 난이도별 기대 응답 시간 (초)
    const baseTime = 5; // 기본 5초
    const difficultyTime = difficulty * 25; // 난이도에 따라 0-25초 추가
    const targetTime = baseTime + difficultyTime;

    // 적절한 시간: 목표의 0.8-1.2배
    const lowerBound = targetTime * 0.8;
    const upperBound = targetTime * 1.2;

    if (responseTime >= lowerBound && responseTime <= upperBound) {
      return 1.0; // Perfect timing
    }

    // 너무 빠름: 너무 쉬움
    if (responseTime < targetTime * 0.5) {
      return 0.3;
    }

    // 너무 느림: 너무 어려움
    if (responseTime > targetTime * 2) {
      return 0.3;
    }

    // 약간 벗어남
    return 0.6;
  }

  /**
   * 자신감 추정
   */
  private static estimateConfidence(
    accuracy: number,
    responseTime: number,
    hintRequests: number
  ): number {
    let confidence = accuracy;

    // 빠른 응답 = 자신감 증가
    if (responseTime < 10) {
      confidence += 0.1;
    } else if (responseTime > 30) {
      // 느린 응답 = 자신감 감소
      confidence -= 0.1;
    }

    // 힌트 요청 = 자신감 하락
    confidence -= hintRequests * 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 최근 N개 메트릭 집계
   */
  static aggregateMetrics(metrics: PerformanceMetrics[]): AggregatedMetrics {
    if (metrics.length === 0) {
      return {
        avgAccuracy: 0.5,
        avgResponseTime: 0.5,
        avgConfidence: 0.5,
        flowState: false,
      };
    }

    const avgAccuracy = this.average(metrics.map((m) => m.accuracy));
    const avgResponseTime = this.average(
      metrics.map((m) => m.responseTimeScore)
    );
    const avgConfidence = this.average(metrics.map((m) => m.confidence));

    // Flow State 간단 체크 (상세한 것은 FlowStateDetector에서)
    const flowState =
      avgAccuracy >= 0.6 &&
      avgAccuracy <= 0.85 &&
      avgResponseTime >= 0.7 &&
      avgConfidence >= 0.6;

    return {
      avgAccuracy,
      avgResponseTime,
      avgConfidence,
      flowState,
    };
  }

  /**
   * Levenshtein Distance 계산
   */
  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    // 초기화
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // 동적 프로그래밍
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 교체
            matrix[i][j - 1] + 1, // 삽입
            matrix[i - 1][j] + 1 // 삭제
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * 평균 계산
   */
  private static average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * 유사도 비율 계산 (간단 버전)
   */
  static calculateSimilarity(str1: string, str2: string): number {
    return this.calculateAccuracy(str1, str2);
  }
}
