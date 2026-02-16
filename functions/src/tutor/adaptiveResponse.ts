/**
 * Adaptive Response Function
 * 적응형 학습 응답 시스템
 *
 * 사용자의 성과와 감정을 분석하여 맞춤형 응답 제공
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { PerformanceMonitor, SessionContext } from "../adaptation/performanceMonitor";
import { FlowStateDetector } from "../adaptation/flowStateDetector";
import { DifficultyAdjuster } from "../adaptation/difficultyAdjuster";

// Lazy initialization
function getDb() {
  return admin.firestore();
}

interface AdaptiveResponseRequest {
  userId: string;
  userInput: string;
  expectedOutput?: string;
  responseTime: number; // 초
  sessionId: string;
  currentDifficulty: number;
  hintRequests?: number;
}

interface AdaptiveResponseResult {
  performanceMetrics: any;
  flowState: {
    isFlowState: boolean;
    flowQuality: number;
    reasons: string[];
  };
  difficultyAdjustment: {
    newDifficulty: number;
    change: number;
    reason: string;
    recommendation: string;
  };
  emergencyAdjust?: any;
  feedback: string;
}

export const adaptiveResponse = functions.https.onCall(
  async (
    data: AdaptiveResponseRequest,
    context
  ): Promise<AdaptiveResponseResult> => {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { userInput, expectedOutput, responseTime, sessionId, currentDifficulty, hintRequests = 0 } = data;

    try {
      const db = getDb();

      // 1. 현재 세션 데이터 가져오기
      const sessionRef = db.collection("sessions").doc(sessionId);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "세션을 찾을 수 없습니다."
        );
      }

      const sessionData = sessionDoc.data()!;
      const messageCount = (sessionData.messageCount || 0) + 1;

      // 2. 성과 분석 (expectedOutput이 있을 때만)
      let performanceMetrics = null;
      if (expectedOutput) {
        const sessionContext: SessionContext = {
          difficulty: currentDifficulty,
          hintRequests,
          messageCount,
        };

        performanceMetrics = PerformanceMonitor.analyzeResponse(
          userInput,
          expectedOutput,
          responseTime,
          sessionContext
        );

        // Firestore에 메트릭 저장
        await sessionRef.collection("metrics").add({
          ...performanceMetrics,
          timestamp: new Date(),
        });
      }

      // 3. 세션의 모든 메트릭 가져오기
      const metricsSnapshot = await sessionRef
        .collection("metrics")
        .orderBy("timestamp", "desc")
        .limit(10)
        .get();

      const metrics = metricsSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
        const docData = doc.data();
        return {
          accuracy: docData.accuracy,
          responseTimeScore: docData.responseTimeScore,
          confidence: docData.confidence,
          timestamp: docData.timestamp.toDate(),
          hintRequests: docData.hintRequests,
        };
      }).reverse(); // 시간 순으로 정렬

      // 4. Flow State 분석
      const flowStateResult = FlowStateDetector.analyzeFlowState(metrics);

      // 5. 난이도 조절
      const difficultyAdjustment = DifficultyAdjuster.adjustDifficulty(
        currentDifficulty,
        metrics
      );

      // 6. 긴급 조절 확인
      const emergencyAdjust = DifficultyAdjuster.emergencyAdjust(
        currentDifficulty,
        metrics
      );

      // 7. 최종 난이도 결정 (긴급 조절 우선)
      const finalDifficultyAdjustment = emergencyAdjust || difficultyAdjustment;

      // 8. 세션 업데이트
      await sessionRef.update({
        messageCount,
        currentDifficulty: finalDifficultyAdjustment.newDifficulty,
        lastFlowState: flowStateResult.isFlowState,
        lastFlowQuality: flowStateResult.flowQuality,
        updatedAt: new Date(),
      });

      // 9. 사용자에게 피드백 생성
      const feedback = generateFeedback(
        flowStateResult,
        finalDifficultyAdjustment,
        performanceMetrics
      );

      // 10. Flow State 달성 시 보너스 XP (10분 이상 유지)
      if (metrics.length >= 5) {
        const flowDuration = FlowStateDetector.calculateFlowDuration(metrics);
        if (flowDuration && flowDuration >= 10) {
          // 보너스 XP 지급 (별도 Function 호출 가능)
          console.log("Flow State 10분 달성! 보너스 XP 지급");
        }
      }

      return {
        performanceMetrics,
        flowState: flowStateResult,
        difficultyAdjustment: finalDifficultyAdjustment,
        emergencyAdjust: emergencyAdjust || undefined,
        feedback,
      };
    } catch (error) {
      console.error("Adaptive response error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "적응형 응답 처리 중 오류가 발생했습니다."
      );
    }
  }
);

/**
 * 피드백 메시지 생성
 */
export function generateFeedback(
  flowState: any,
  difficultyAdjustment: any,
  performanceMetrics: any
): string {
  let feedback = "";

  // Flow State 피드백
  if (flowState.isFlowState) {
    feedback += `🌟 완벽한 집중 상태예요! 현재 Flow State를 유지하고 있습니다.\n`;
  } else if (flowState.flowQuality > 0.6) {
    feedback += `✨ 거의 Flow State에 근접했어요! 조금만 더 집중해봐요.\n`;
  }

  // 난이도 조절 피드백
  if (difficultyAdjustment.change !== 0) {
    feedback += `\n${difficultyAdjustment.recommendation}\n`;

    if (Math.abs(difficultyAdjustment.change) >= 0.15) {
      feedback += `(난이도를 ${difficultyAdjustment.change > 0 ? "크게 높였" : "크게 낮췄"}습니다)\n`;
    }
  }

  // 성과 피드백
  if (performanceMetrics) {
    if (performanceMetrics.accuracy >= 0.9) {
      feedback += `\n정확도 ${Math.round(performanceMetrics.accuracy * 100)}%! 완벽해요! 🎉`;
    } else if (performanceMetrics.accuracy >= 0.7) {
      feedback += `\n좋아요! 정확도 ${Math.round(performanceMetrics.accuracy * 100)}% 👍`;
    }
  }

  return feedback.trim() || "계속 잘하고 있어요! 화이팅! 💪";
}
