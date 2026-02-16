/**
 * Calculate Ending Function
 * 에피소드 종료 시 엔딩 계산 및 보상 지급
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import episodesData from "./episodes.json";
import { XPManager } from "../gamification/xpManager";

function getDb() {
  return admin.firestore();
}

interface CalculateEndingRequest {
  episodeId: string;
  totalScore: number;
  pronunciationScore: number;
  grammarScore: number;
  choices: string[];
}

export const calculateEnding = functions.https.onCall(
  async (data: CalculateEndingRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const {
      episodeId,
      totalScore,
      pronunciationScore,
      grammarScore,
      choices,
    } = data;
    const userId = context.auth.uid;

    // 에피소드 데이터 로드
    const episodes: any = episodesData;
    const episode = episodes[episodeId];

    if (!episode) {
      throw new functions.https.HttpsError(
        "not-found",
        "에피소드를 찾을 수 없습니다."
      );
    }

    // 엔딩 조건 체크 (높은 점수 조건부터)
    const endings = episode.endings.sort(
      (a: any, b: any) =>
        (b.condition.minScore || 0) - (a.condition.minScore || 0)
    );

    let selectedEnding = endings[endings.length - 1]; // 기본 엔딩

    for (const ending of endings) {
      const meetsScoreCondition =
        totalScore >= (ending.condition.minScore || 0);
      const meetsPronunciationCondition =
        pronunciationScore >= (ending.condition.minPronunciation || 0);
      const meetsGrammarCondition =
        grammarScore >= (ending.condition.minGrammar || 0);

      // 특정 선택지 필요한지 확인
      let meetsChoiceCondition = true;
      if (ending.condition.requiredChoices) {
        meetsChoiceCondition = ending.condition.requiredChoices.every(
          (requiredChoice: string) => choices.includes(requiredChoice)
        );
      }

      if (
        meetsScoreCondition &&
        meetsPronunciationCondition &&
        meetsGrammarCondition &&
        meetsChoiceCondition
      ) {
        selectedEnding = ending;
        break;
      }
    }

    // 진도 저장
    const db = getDb();
    const progressRef = db
      .collection("users")
      .doc(userId)
      .collection("dramaProgress")
      .doc(episodeId);

    // 기존 진도 확인
    const progressDoc = await progressRef.get();
    const existingProgress = progressDoc.data();

    // 더 높은 엔딩이면 업데이트
    const shouldUpdate =
      !existingProgress ||
      !existingProgress.completed ||
      totalScore > (existingProgress.totalScore || 0);

    if (shouldUpdate) {
      await progressRef.set(
        {
          completed: true,
          endingAchieved: selectedEnding.id,
          totalScore,
          pronunciationScore,
          grammarScore,
          choices,
          playCount: admin.firestore.FieldValue.increment(1),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // XP 지급
      await XPManager.grantXP(
        userId,
        selectedEnding.rewards.xp,
        `drama_${episodeId}_${selectedEnding.id}`
      );

      // 배지 지급 (있을 경우)
      if (selectedEnding.rewards.badge) {
        await db
          .collection("users")
          .doc(userId)
          .collection("badges")
          .doc(selectedEnding.rewards.badge)
          .set({
            badgeId: selectedEnding.rewards.badge,
            earnedAt: admin.firestore.FieldValue.serverTimestamp(),
            source: `drama_${episodeId}`,
          });
      }
    } else {
      // 플레이 카운트만 증가
      await progressRef.update({
        playCount: admin.firestore.FieldValue.increment(1),
      });
    }

    return {
      ending: selectedEnding,
      stats: {
        totalScore,
        pronunciationScore,
        grammarScore,
      },
      isNewRecord: shouldUpdate,
      unlocked: selectedEnding.rewards.unlocks || [],
    };
  }
);
