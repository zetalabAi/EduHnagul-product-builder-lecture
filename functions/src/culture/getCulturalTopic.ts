/**
 * Get Cultural Topic Function
 */

import * as functions from "firebase-functions";
import culturalContentData from "./culturalContent.json";

export const getCulturalTopic = functions.https.onCall(
  async (data: { topicId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { topicId } = data;

    const topics: any = culturalContentData;
    const topic = topics[topicId];

    if (!topic) {
      throw new functions.https.HttpsError(
        "not-found",
        "주제를 찾을 수 없습니다."
      );
    }

    return {
      topic,
    };
  }
);

export const getAllCulturalTopics = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const topics: any = culturalContentData;

    // 주제 목록 반환 (간략 정보)
    const topicList = Object.values(topics).map((topic: any) => ({
      id: topic.id,
      category: topic.category,
      title: topic.title,
      difficulty: topic.difficulty,
      estimatedTime: topic.estimatedTime,
      introduction: topic.introduction,
    }));

    return {
      topics: topicList,
    };
  }
);
