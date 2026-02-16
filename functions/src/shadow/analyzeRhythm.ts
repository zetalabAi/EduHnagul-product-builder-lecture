/**
 * Analyze Rhythm Function
 * Shadow Speaking 리듬 및 타이밍 분석
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import shadowContentData from "./shadowContent.json";
import { XPManager } from "../gamification/xpManager";

function getDb() {
  return admin.firestore();
}

interface AnalyzeRhythmRequest {
  contentId: string;
  userAudioData: string; // base64
  level: number;
}

export const analyzeRhythm = functions.https.onCall(
  async (data: AnalyzeRhythmRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { contentId, userAudioData, level } = data;
    const userId = context.auth.uid;

    // 1. 콘텐츠 로드
    const contents: any = shadowContentData;
    const content = contents[contentId];

    if (!content) {
      throw new functions.https.HttpsError(
        "not-found",
        "콘텐츠를 찾을 수 없습니다."
      );
    }

    // 2. 오디오 분석 (간단한 버전 - 실제로는 더 복잡한 분석 필요)
    const analysis = analyzeAudioRhythm(userAudioData, content);

    // 3. 점수 계산
    const rhythmScore = calculateRhythmScore(analysis);
    const timingScore = calculateTimingScore(
      analysis,
      content.settings[`level${level}`].delay
    );
    const overallScore = (rhythmScore + timingScore) / 2;

    // 4. 피드백 생성
    const feedback = generateFeedback(rhythmScore, timingScore, level);

    // 5. 진도 저장
    const db = getDb();
    const progressRef = db
      .collection("users")
      .doc(userId)
      .collection("shadowProgress")
      .doc(contentId);

    const progressDoc = await progressRef.get();
    const currentBest = progressDoc.exists
      ? progressDoc.data()?.bestScore || 0
      : 0;

    await progressRef.set(
      {
        attempts: admin.firestore.FieldValue.increment(1),
        bestScore: Math.max(currentBest, overallScore),
        rhythmAccuracy: rhythmScore,
        timingAccuracy: timingScore,
        level,
        lastPracticed: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 6. XP 지급
    const xp = Math.round(overallScore * 100 * level); // 레벨 곱하기
    await XPManager.grantXP(userId, xp, `shadow_${contentId}`);

    return {
      scores: {
        rhythm: rhythmScore,
        timing: timingScore,
        overall: overallScore,
      },
      feedback,
      xp,
    };
  }
);

/**
 * 오디오 리듬 분석 (간단 버전)
 */
function analyzeAudioRhythm(userAudioData: string, content: any): any {
  // 실제로는 Web Audio API 또는 외부 API로 분석
  // 여기서는 랜덤 시뮬레이션

  const emphasisMatches = Math.floor(
    Math.random() * content.sentences.length
  );
  const totalEmphasis = content.sentences.reduce(
    (acc: number, s: any) => acc + s.emphasis.length,
    0
  );

  return {
    emphasisMatches,
    totalEmphasis,
    syllableLengthAccuracy: 0.7 + Math.random() * 0.3,
    tempoAccuracy: 0.7 + Math.random() * 0.3,
    averageDelay: 400 + Math.random() * 200, // 400-600ms
  };
}

/**
 * 리듬 점수 계산
 */
function calculateRhythmScore(analysis: any): number {
  const emphasisMatch = analysis.emphasisMatches / analysis.totalEmphasis;
  const syllableLengthMatch = analysis.syllableLengthAccuracy;
  const tempoMatch = analysis.tempoAccuracy;

  return (emphasisMatch + syllableLengthMatch + tempoMatch) / 3;
}

/**
 * 타이밍 점수 계산
 */
function calculateTimingScore(analysis: any, targetDelay: number): number {
  const actualDelay = analysis.averageDelay;
  const delayDiff = Math.abs(actualDelay - targetDelay);

  // 허용 오차: ±200ms
  if (delayDiff <= 200) {
    return 1.0;
  } else if (delayDiff <= 500) {
    return 0.7;
  } else {
    return 0.4;
  }
}

/**
 * 피드백 생성
 */
function generateFeedback(
  rhythmScore: number,
  timingScore: number,
  level: number
): string {
  let feedback = "";

  // 리듬 피드백
  if (rhythmScore > 0.9) {
    feedback += "리듬이 완벽해요! 🎵 원어민처럼 자연스럽네요!\n";
  } else if (rhythmScore > 0.7) {
    feedback += "리듬이 좋아요! 조금만 더 연습하면 완벽할 거예요.\n";
  } else {
    feedback += "리듬 연습이 더 필요해요. 강세와 억양에 집중해보세요.\n";
  }

  // 타이밍 피드백
  if (timingScore > 0.9) {
    feedback += "타이밍이 완벽해요! ⏱️ 딜레이가 정확해요!\n";
  } else if (timingScore > 0.7) {
    feedback +=
      "타이밍이 좋아요! 조금만 더 빠르게/느리게 따라해보세요.\n";
  } else {
    feedback +=
      "타이밍 연습이 필요해요. 원본 소리를 듣고 바로 따라해보세요.\n";
  }

  // 레벨별 조언
  if (level === 1) {
    feedback += "\n💡 팁: 천천히 정확하게 따라하는 게 중요해요.";
  } else if (level === 4) {
    feedback +=
      "\n💡 팁: 원어민 속도예요! 완벽하게 동기화되면 최고 점수!";
  }

  return feedback;
}
