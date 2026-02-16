/**
 * Get Shadow Content Function
 */

import * as functions from "firebase-functions";
import shadowContentData from "./shadowContent.json";

export const getShadowContent = functions.https.onCall(
  async (data: { contentId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "사용자 인증이 필요합니다."
      );
    }

    const { contentId } = data;

    const contents: any = shadowContentData;
    const content = contents[contentId];

    if (!content) {
      throw new functions.https.HttpsError(
        "not-found",
        "콘텐츠를 찾을 수 없습니다."
      );
    }

    return {
      content,
    };
  }
);
