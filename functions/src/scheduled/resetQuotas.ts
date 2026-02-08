import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const resetDailyQuotas = functions.pubsub
  .schedule("0 0 * * *") // Every day at midnight UTC
  .timeZone("UTC")
  .onRun(async (context) => {
    const db = admin.firestore();

    try {
      // Get all free tier users
      const usersSnapshot = await db
        .collection("users")
        .where("subscriptionTier", "==", "free")
        .get();

      functions.logger.info(`Resetting quotas for ${usersSnapshot.size} free users`);

      // Batch update in chunks of 500 (Firestore limit)
      const batchSize = 500;
      let batch = db.batch();
      let operationCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        batch.update(userDoc.ref, {
          dailyMessagesUsed: 0,
          lastQuotaReset: admin.firestore.FieldValue.serverTimestamp(),
        });

        operationCount++;

        if (operationCount === batchSize) {
          await batch.commit();
          batch = db.batch();
          operationCount = 0;
        }
      }

      // Commit remaining operations
      if (operationCount > 0) {
        await batch.commit();
      }

      functions.logger.info(`Successfully reset quotas for ${usersSnapshot.size} users`);
    } catch (error) {
      functions.logger.error("Failed to reset quotas:", error);
      throw error;
    }
  });
