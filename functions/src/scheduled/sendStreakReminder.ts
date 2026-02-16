import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Send Streak Reminder (Runs at 8 PM local time)
 * Reminds users to maintain their streak if they haven't been active today
 */
export const sendStreakReminder = functions.pubsub
  .schedule("0 20 * * *") // Daily at 8 PM UTC (adjust for local time)
  .timeZone("UTC")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();

    console.log("Running streak reminder...");

    try {
      // Get all users with active streaks
      const usersSnapshot = await db.collection("users").get();
      let remindersSent = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const gamificationRef = userDoc.ref
          .collection("gamification")
          .doc("stats");

        try {
          const gamificationDoc = await gamificationRef.get();
          const data = gamificationDoc.data();

          if (!data || !data.streak || data.streak === 0) {
            continue; // No active streak
          }

          const lastActivity = data.lastActivityDate?.toDate();

          // Check if user was active today
          if (lastActivity && isSameDay(lastActivity, now)) {
            continue; // Already active today
          }

          // User has active streak but hasn't been active today
          // Send reminder notification
          await sendNotification(userId, {
            title: "🔥 연속 학습 유지하기!",
            body: `${data.streak}일 연속 학습 중입니다. 오늘 학습하고 연속 기록을 이어가세요!`,
            data: {
              type: "streak_reminder",
              streak: data.streak.toString(),
              freezeCount: (data.freezeCount || 0).toString(),
            },
          });

          remindersSent++;
          console.log(`Reminder sent to user ${userId} (${data.streak} day streak)`);
        } catch (error) {
          console.error(`Error sending reminder to user ${userId}:`, error);
        }
      }

      console.log(`Streak reminders complete: ${remindersSent} reminders sent`);

      return {
        success: true,
        remindersSent,
      };
    } catch (error) {
      console.error("Streak reminder error:", error);
      throw error;
    }
  });

/**
 * Helper: Send notification to user
 * (In a real implementation, this would use FCM or another notification service)
 */
async function sendNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: { [key: string]: string };
  }
): Promise<void> {
  const db = admin.firestore();

  // Store notification in Firestore
  await db
    .collection("users")
    .doc(userId)
    .collection("notifications")
    .add({
      ...notification,
      timestamp: admin.firestore.Timestamp.now(),
      read: false,
    });

  // TODO: Send FCM push notification if user has token
  // const messaging = admin.messaging();
  // await messaging.send({ token: userToken, notification });
}

/**
 * Helper: Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
