/**
 * Analyze Emotion Function
 * 음성 톤 기반 감정 분석 Function
 *
 * 클라이언트에서 음성 특징을 추출하여 전달하면
 * 감정을 분석하고 맞춤형 응답 스타일을 반환
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  EmotionAnalyzer,
  VoiceFeatures,
  EmotionResult,
  EmotionType,
} from "../emotion/emotionAnalyzer";
import { ResponseStyler, StyledResponse } from "../emotion/responseStyler";

// Lazy initialization
function getDb() {
  return admin.firestore();
}

interface AnalyzeEmotionRequest {
  userId: string;
  sessionId: string;
  voiceFeatures?: VoiceFeatures; // 음성 특징 (있을 경우)
  text?: string; // 텍스트 (음성 없을 경우 폴백)
}

interface AnalyzeEmotionResponse {
  emotion: EmotionResult;
  style: StyledResponse;
  emotionAwarePrompt: string;
  suggestions: string[];
}

export const analyzeEmotion = functions.https.onCall(
  async (
    data: AnalyzeEmotionRequest,
    context
  ): Promise<AnalyzeEmotionResponse> => {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { userId, sessionId, voiceFeatures, text } = data;

    try {
      // 1. 감정 분석
      let emotion: EmotionResult;

      if (voiceFeatures) {
        // 음성 특징이 있으면 음성 기반 분석
        emotion = EmotionAnalyzer.analyzeVoiceTone(voiceFeatures);
      } else if (text) {
        // 텍스트만 있으면 텍스트 기반 분석
        emotion = EmotionAnalyzer.analyzeText(text);
      } else {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "음성 특징 또는 텍스트가 필요합니다."
        );
      }

      // 2. 응답 스타일 생성
      const style = ResponseStyler.styleResponse(emotion);

      // 3. 감정 인식 프롬프트 생성
      const emotionAwarePrompt =
        ResponseStyler.generateEmotionAwarePrompt(emotion);

      // 4. 제안 사항 생성
      const suggestions = generateSuggestions(emotion, style);

      // 5. Firestore에 감정 기록 저장
      const db = getDb();
      await db
        .collection("sessions")
        .doc(sessionId)
        .collection("emotions")
        .add({
          userId,
          emotion: emotion.primary,
          confidence: emotion.confidence,
          intensity: emotion.intensity,
          features: voiceFeatures || null,
          timestamp: new Date(),
        });

      // 6. 사용자 프로파일에 감정 히스토리 업데이트
      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        lastEmotion: emotion.primary,
        lastEmotionTimestamp: new Date(),
      });

      // 7. 특정 감정이 연속으로 나타날 경우 알림
      await checkEmotionPattern(userId, sessionId, emotion.primary);

      return {
        emotion,
        style,
        emotionAwarePrompt,
        suggestions,
      };
    } catch (error) {
      console.error("Emotion analysis error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "감정 분석 중 오류가 발생했습니다."
      );
    }
  }
);

/**
 * 제안 사항 생성
 */
export function generateSuggestions(
  emotion: EmotionResult,
  style: StyledResponse
): string[] {
  const suggestions: string[] = [];

  switch (emotion.primary) {
    case "stressed":
      suggestions.push("깊게 숨을 쉬고 긴장을 풀어보세요.");
      suggestions.push("힌트를 적극 활용해도 괜찮아요.");
      if (emotion.intensity > 0.7) {
        suggestions.push("잠시 휴식을 취하는 것도 좋은 방법이에요.");
      }
      break;

    case "excited":
      suggestions.push("이 에너지를 활용해 도전적인 문제를 풀어보세요!");
      suggestions.push("새로운 주제를 시작하기 좋은 타이밍이에요.");
      break;

    case "tired":
      suggestions.push("짧은 복습 세션으로 전환하는 게 어떨까요?");
      suggestions.push("무리하지 말고 내일 다시 시도해보세요.");
      if (emotion.intensity > 0.7) {
        suggestions.push("지금은 휴식이 필요한 시간입니다.");
      }
      break;

    case "positive":
      suggestions.push("좋은 컨디션이에요! 계속 진행하세요.");
      suggestions.push("새로운 내용을 배우기 좋은 상태입니다.");
      break;

    case "negative":
      suggestions.push("괜찮아요. 실수는 배움의 과정입니다.");
      suggestions.push("더 쉬운 단계부터 다시 시작해볼까요?");
      if (emotion.intensity > 0.7) {
        suggestions.push("잠시 쉬고 마음을 정리하는 것도 좋아요.");
      }
      break;

    case "neutral":
      suggestions.push("안정적인 상태예요. 계속 진행하세요.");
      break;
  }

  // 난이도 조절 제안
  if (style.difficultyAdjustment > 0.1) {
    suggestions.push("난이도를 높여 더 도전해보세요.");
  } else if (style.difficultyAdjustment < -0.1) {
    suggestions.push("난이도를 낮춰 자신감을 회복하세요.");
  }

  return suggestions;
}

/**
 * 감정 패턴 체크
 * 특정 감정이 연속으로 나타날 경우 알림
 */
export async function checkEmotionPattern(
  userId: string,
  sessionId: string,
  currentEmotion: string
): Promise<void> {
  const db = getDb();

  // 최근 5개 감정 기록 가져오기
  const emotionsSnapshot = await db
    .collection("sessions")
    .doc(sessionId)
    .collection("emotions")
    .orderBy("timestamp", "desc")
    .limit(5)
    .get();

  const recentEmotions = emotionsSnapshot.docs.map(
    (doc: admin.firestore.QueryDocumentSnapshot) => doc.data().emotion as EmotionType
  );

  // 패턴 체크
  // 1. 5회 연속 stressed → 휴식 권장 알림
  if (
    recentEmotions.length >= 5 &&
    recentEmotions.every((e: EmotionType) => e === "stressed")
  ) {
    console.log(`[알림] ${userId}: 5회 연속 stressed 감지. 휴식 권장.`);
    // TODO: 푸시 알림 전송
  }

  // 2. 5회 연속 tired → 세션 종료 제안
  if (
    recentEmotions.length >= 5 &&
    recentEmotions.every((e: EmotionType) => e === "tired")
  ) {
    console.log(`[알림] ${userId}: 5회 연속 tired 감지. 세션 종료 제안.`);
    // TODO: 푸시 알림 전송
  }

  // 3. 5회 연속 negative → 격려 메시지
  if (
    recentEmotions.length >= 5 &&
    recentEmotions.every((e: EmotionType) => e === "negative")
  ) {
    console.log(
      `[알림] ${userId}: 5회 연속 negative 감지. 격려 메시지 전송.`
    );
    // TODO: 푸시 알림 전송
  }

  // 4. stressed → excited 전환 → 칭찬
  if (
    recentEmotions.length >= 2 &&
    recentEmotions[1] === "stressed" &&
    recentEmotions[0] === "excited"
  ) {
    console.log(
      `[칭찬] ${userId}: stressed에서 excited로 전환! 잘 극복했어요!`
    );
  }
}
