import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { WeeklyStats } from "./types";

/**
 * Weekly Progress Analysis
 * Runs every Monday at 00:00 KST, analyzes each user's weekly data
 * and generates an AI comment comparing this week vs last week.
 */
export const analyzeWeeklyProgress = functions.pubsub
  .schedule("0 0 * * MON")
  .timeZone("Asia/Seoul")
  .onRun(async (_context) => {
    const db = admin.firestore();
    functions.logger.info("Starting weekly progress analysis...");

    const usersSnapshot = await db.collection("users").get();

    const tasks = usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      try {
        const thisWeek = await getWeeklyStats(db, userId, 0);
        const lastWeek = await getWeeklyStats(db, userId, -1);

        const analysis = {
          xpChange: calculateChange(thisWeek.xp, lastWeek.xp),
          lessonChange: calculateChange(thisWeek.lessonsCompleted, lastWeek.lessonsCompleted),
          mistakeChange: calculateChange(thisWeek.mistakeCount, lastWeek.mistakeCount),
          streakChange: calculateChange(thisWeek.streakDays, lastWeek.streakDays),
        };

        const comment = generateAIComment(analysis);
        const sentiment = determineSentiment(analysis);
        const weekId = getCurrentWeekId();

        // Save analysis
        await db
          .collection("users")
          .doc(userId)
          .collection("progressGarden")
          .doc("analysis")
          .collection("weekly")
          .add({
            weekId,
            thisWeekStats: thisWeek,
            lastWeekStats: lastWeek,
            analysis,
            aiComment: {
              comment,
              sentiment,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            },
          });

        // Send notification
        await sendNotification(db, userId, {
          title: "주간 리포트 도착! 📊",
          body: comment.split("\n")[0],
        });

        functions.logger.info(`Analysis done for user ${userId}`);
      } catch (error) {
        functions.logger.error(`Error analyzing user ${userId}:`, error);
      }
    });

    await Promise.allSettled(tasks);
    functions.logger.info("Weekly analysis complete.");
    return null;
  });

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function generateAIComment(analysis: {
  xpChange: number;
  lessonChange: number;
  mistakeChange: number;
  streakChange: number;
}): string {
  const { xpChange, mistakeChange, streakChange } = analysis;

  if (xpChange > 20 && mistakeChange < -10) {
    return `🎉 대단해요! 이번 주 정말 열심히 했어요!\nXP가 ${xpChange}% 늘었고, 실수는 ${Math.abs(mistakeChange)}% 줄었어요.\n완벽한 한 주였어요! 계속 이 페이스로 가요! 💪`;
  }

  if (xpChange > 0 && mistakeChange < 0) {
    return `👍 좋아요! 꾸준히 발전하고 있어요.\nXP가 ${xpChange}% 증가했고, 실수도 줄어들고 있어요.\n이런 식으로 꾸준히 하면 금방 목표에 도달할 거예요!`;
  }

  if (xpChange > 0 && mistakeChange > 0) {
    return `💪 열심히 하고 있네요!\n학습량은 늘었지만, 새로운 내용이라 실수가 좀 늘었어요.\n괜찮아요! 새로운 걸 배우는 과정이에요. 복습하면 금방 나아질 거예요!`;
  }

  if (xpChange < -10 || streakChange < 0) {
    return `🌱 요즘 좀 바쁘셨나요?\n학습량이 조금 줄었네요. 괜찮아요! 쉬어가는 것도 중요해요.\n오늘 10분만이라도 가볍게 시작해볼까요?\n작은 시작이 큰 변화를 만들어요! 😊`;
  }

  if (xpChange < -30) {
    return `💙 잠깐 쉬어가는 시간이었나요?\n돌아와줘서 정말 기뻐요!\n부담 갖지 마세요. 오늘부터 다시 시작하면 돼요.\n한 걸음씩 천천히 가요. 응원할게요! 🤗`;
  }

  return `😊 오늘도 화이팅!\n꾸준히 하는 게 가장 중요해요.`;
}

function determineSentiment(analysis: {
  xpChange: number;
  mistakeChange: number;
}): "praise" | "encourage" | "neutral" {
  if (analysis.xpChange > 20 && analysis.mistakeChange < -10) return "praise";
  if (analysis.xpChange < -20) return "encourage";
  return "neutral";
}

async function getWeeklyStats(
  db: admin.firestore.Firestore,
  userId: string,
  weeksAgo: number
): Promise<WeeklyStats> {
  const weekId = getWeekId(weeksAgo);

  const statsDoc = await db
    .collection("users")
    .doc(userId)
    .collection("progressGarden")
    .doc("weeklyStats")
    .get();

  const stats = statsDoc.data()?.[weekId] as Partial<WeeklyStats> | undefined;

  return {
    weekId,
    xp: stats?.xp ?? 0,
    lessonsCompleted: stats?.lessonsCompleted ?? 0,
    chatMessages: stats?.chatMessages ?? 0,
    voiceMinutes: stats?.voiceMinutes ?? 0,
    mistakeCount: stats?.mistakeCount ?? 0,
    streakDays: stats?.streakDays ?? 0,
    activeDays: stats?.activeDays ?? 0,
  };
}

async function sendNotification(
  db: admin.firestore.Firestore,
  userId: string,
  notification: { title: string; body: string }
): Promise<void> {
  await db
    .collection("users")
    .doc(userId)
    .collection("notifications")
    .add({
      ...notification,
      type: "weekly_report",
      timestamp: admin.firestore.Timestamp.now(),
      read: false,
    });
}

function getCurrentWeekId(): string {
  return getWeekId(0);
}

function getWeekId(weeksAgo: number): string {
  const now = new Date();
  now.setDate(now.getDate() + weeksAgo * 7);
  const year = now.getFullYear();
  const week = getWeekNumber(now);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
