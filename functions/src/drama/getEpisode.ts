/**
 * Get Episode Function
 * 에피소드 데이터 로드
 */

import * as functions from "firebase-functions";
import episodesData from "./episodes.json";

export const getEpisode = functions.https.onCall(
  async (data: { episodeId: string }, context) => {
    // 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { episodeId } = data;

    if (!episodeId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "episodeId가 필요합니다."
      );
    }

    // episodes.json에서 에피소드 찾기
    const episodes: any = episodesData;
    const episode = episodes[episodeId];

    if (!episode) {
      throw new functions.https.HttpsError(
        "not-found",
        `에피소드 ${episodeId}를 찾을 수 없습니다.`
      );
    }

    return {
      episode,
      firstScene: episode.scenes[0],
    };
  }
);

/**
 * Get All Episodes Function
 * 모든 에피소드 목록 조회
 */
export const getAllEpisodes = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const episodes: any = episodesData;

    // 에피소드 목록 반환 (상세 데이터 제외)
    const episodeList = Object.values(episodes).map((ep: any) => ({
      id: ep.id,
      season: ep.season,
      episode: ep.episode,
      title: ep.title,
      difficulty: ep.difficulty,
      description: ep.description,
      thumbnail: ep.thumbnail,
      learningGoals: ep.learningGoals,
    }));

    return {
      episodes: episodeList,
    };
  }
);
