import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Daily Streak Check (Runs at midnight UTC)
 * Checks all users' streaks and resets if needed
 */
export const checkStreaks = functions.pubsub
  .schedule("0 0 * * *") // Daily at midnight UTC
  .timeZone("UTC")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    console.log("Running daily streak check...");

    try {
      // Get all users
      const usersSnapshot = await db.collection("users").get();
      let checkedCount = 0;
      let resetCount = 0;
      let freezeUsedCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const gamificationRef = userDoc.ref
          .collection("gamification")
          .doc("stats");

        try {
          await db.runTransaction(async (transaction) => {
            const gamificationDoc = await transaction.get(gamificationRef);
            const data = gamificationDoc.data();

            if (!data || !data.lastActivityDate) {
              return; // No streak to check
            }

            const lastActivity = data.lastActivityDate.toDate();

            // Check if user was active yesterday
            if (isSameDay(lastActivity, yesterday)) {
              // User was active yesterday, streak is safe
              return;
            }

            // Check if user was active today
            if (isSameDay(lastActivity, now)) {
              // User already active today, streak is safe
              return;
            }

            // User missed yesterday
            // Check if they have freeze
            if (data.freezeCount > 0) {
              // Use freeze to protect streak
              transaction.update(gamificationRef, {
                freezeCount: data.freezeCount - 1,
                lastActivityDate: admin.firestore.Timestamp.fromDate(now),
                streakHistory: admin.firestore.FieldValue.arrayUnion({
                  date: admin.firestore.Timestamp.fromDate(yesterday),
                  active: false,
                  freezeUsed: true,
                }),
              });

              freezeUsedCount++;
              console.log(`User ${userId}: Freeze used to protect streak`);
            } else {
              // No freeze, reset streak
              transaction.update(gamificationRef, {
                streak: 0,
                streakHistory: admin.firestore.FieldValue.arrayUnion({
                  date: admin.firestore.Timestamp.fromDate(yesterday),
                  active: false,
                  streakReset: true,
                }),
              });

              resetCount++;
              console.log(`User ${userId}: Streak reset to 0`);
            }
          });

          checkedCount++;
        } catch (error) {
          console.error(`Error checking streak for user ${userId}:`, error);
        }
      }

      console.log(`Streak check complete: ${checkedCount} users checked, ${resetCount} streaks reset, ${freezeUsedCount} freezes used`);

      return {
        success: true,
        checkedCount,
        resetCount,
        freezeUsedCount,
      };
    } catch (error) {
      console.error("Streak check error:", error);
      throw error;
    }
  });

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
