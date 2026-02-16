/**
 * Process Choice Function
 * 사용자 선택 처리 및 다음 씬 반환
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import episodesData from "./episodes.json";

function getDb() {
  return admin.firestore();
}

export const processChoice = functions.https.onCall(
  async (
    data: {
      episodeId: string;
      sceneId: string;
      choiceId: string;
    },
    context
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { episodeId, sceneId, choiceId } = data;
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

    // 현재 씬 찾기
    const currentScene = episode.scenes.find((s: any) => s.id === sceneId);

    if (!currentScene) {
      throw new functions.https.HttpsError(
        "not-found",
        "씬을 찾을 수 없습니다."
      );
    }

    // 선택지 찾기
    const choice = currentScene.choices?.find((c: any) => c.id === choiceId);

    if (!choice) {
      throw new functions.https.HttpsError(
        "not-found",
        "선택지를 찾을 수 없습니다."
      );
    }

    // 선택 기록 저장
    const db = getDb();
    const progressRef = db
      .collection("users")
      .doc(userId)
      .collection("dramaProgress")
      .doc(episodeId);

    await progressRef.set(
      {
        choices: admin.firestore.FieldValue.arrayUnion(choiceId),
        lastPlayedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 다음 씬 찾기
    const nextSceneId = choice.nextScene;
    const nextScene = episode.scenes.find((s: any) => s.id === nextSceneId);

    if (!nextScene) {
      // 다음 씬이 없으면 엔딩 처리
      return {
        ending: true,
        nextScene: null,
      };
    }

    // 엔딩 씬인지 확인
    if (nextSceneId === "ending" || nextScene.id === "ending") {
      return {
        ending: true,
        nextScene: null,
      };
    }

    return {
      ending: false,
      nextScene,
      points: choice.points,
    };
  }
);
