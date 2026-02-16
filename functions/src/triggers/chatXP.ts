import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { XPManager, XP_REWARDS } from "../gamification/xpManager";
import { StreakManager } from "../gamification/streakManager";

/**
 * Grant XP when user sends a text chat message
 */
export const onTextMessage = functions.firestore
  .document("users/{userId}/sessions/{sessionId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const messageData = snap.data();

    // Only grant XP for user messages
    if (messageData.role !== "user") {
      return;
    }

    try {
      // Grant text message XP
      await XPManager.grantXP(
        userId,
        XP_REWARDS.TEXT_MESSAGE,
        "텍스트 메시지 전송"
      );

      // Record activity for streak
      await StreakManager.recordActivity(userId);

      console.log(`Granted ${XP_REWARDS.TEXT_MESSAGE} XP to user ${userId} for text message`);
    } catch (error) {
      console.error("Error granting XP for text message:", error);
    }
  });

/**
 * Grant XP when user sends a voice chat message
 */
export const onVoiceMessage = functions.firestore
  .document("users/{userId}/voiceSessions/{sessionId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const messageData = snap.data();

    // Only grant XP for user messages
    if (messageData.role !== "user") {
      return;
    }

    try {
      // Grant voice message XP (worth more than text)
      await XPManager.grantXP(
        userId,
        XP_REWARDS.VOICE_MESSAGE,
        "음성 메시지 전송"
      );

      // Check pronunciation score for bonus XP
      if (messageData.pronunciationScore >= 90) {
        await XPManager.grantXP(
          userId,
          XP_REWARDS.PRONUNCIATION_BONUS,
          "발음 정확도 90% 이상"
        );
      }

      // Record activity for streak
      await StreakManager.recordActivity(userId);

      console.log(`Granted ${XP_REWARDS.VOICE_MESSAGE} XP to user ${userId} for voice message`);
    } catch (error) {
      console.error("Error granting XP for voice message:", error);
    }
  });

/**
 * Check and grant daily goal XP
 */
export const checkDailyGoal = functions.pubsub
  .schedule("0 23 * * *") // Daily at 11 PM UTC
  .timeZone("UTC")
  .onRun(async (context) => {
    const db = admin.firestore();

    console.log("Checking daily goals...");

    try {
      const usersSnapshot = await db.collection("users").get();
      let goalsAchieved = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          // Get today's XP
          const dailyXP = await XPManager.getDailyXP(userId);

          // Check if daily goal is met (100 XP without the daily goal bonus)
          if (dailyXP >= 100 && dailyXP < 100 + XP_REWARDS.DAILY_GOAL) {
            // Grant daily goal bonus
            await XPManager.grantXP(
              userId,
              XP_REWARDS.DAILY_GOAL,
              "일일 목표 달성"
            );

            goalsAchieved++;
            console.log(`User ${userId} achieved daily goal: ${dailyXP} XP earned`);
          }
        } catch (error) {
          console.error(`Error checking daily goal for user ${userId}:`, error);
        }
      }

      console.log(`Daily goal check complete: ${goalsAchieved} users achieved their goal`);

      return {
        success: true,
        goalsAchieved,
      };
    } catch (error) {
      console.error("Daily goal check error:", error);
      throw error;
    }
  });
