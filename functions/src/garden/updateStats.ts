import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function getCurrentWeekId(): string {
  const now = new Date();
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

function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / 1000) + 1;
}

function getNextLevelXP(level: number): number {
  return level * 1000;
}

async function updateLearningTree(
  db: admin.firestore.Firestore,
  userId: string,
  xpGained: number
): Promise<void> {
  const treeRef = db
    .collection("users")
    .doc(userId)
    .collection("progressGarden")
    .doc("learningTree");

  await db.runTransaction(async (tx) => {
    const treeDoc = await tx.get(treeRef);
    const tree = treeDoc.data() ?? { level: 1, totalXP: 0 };

    const newTotalXP = (tree.totalXP ?? 0) + xpGained;
    const prevLevel = tree.level ?? 1;
    const newLevel = calculateLevel(newTotalXP);

    tx.set(treeRef, {
      level: newLevel,
      totalXP: newTotalXP,
      nextLevelXP: getNextLevelXP(newLevel),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Level-up notification
    if (newLevel > prevLevel) {
      const notifRef = db
        .collection("users")
        .doc(userId)
        .collection("notifications")
        .doc();

      tx.set(notifRef, {
        title: "🌳 나무가 성장했어요!",
        body: `레벨 ${newLevel} 달성! 계속 배워가요!`,
        type: "level_up",
        timestamp: admin.firestore.Timestamp.now(),
        read: false,
      });
    }
  });
}

function weeklyStatsRef(
  db: admin.firestore.Firestore,
  userId: string
): admin.firestore.DocumentReference {
  return db
    .collection("users")
    .doc(userId)
    .collection("progressGarden")
    .doc("weeklyStats");
}

/* ------------------------------------------------------------------ */
/* Triggers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Trigger: XP 획득 시 → 주간 XP 통계 + Learning Tree 업데이트
 */
export const onXPGained = functions.firestore
  .document("users/{userId}/gamification/stats")
  .onUpdate(async (change, context) => {
    const db = admin.firestore();
    const userId = context.params.userId;

    const before = change.before.data();
    const after = change.after.data();
    const xpGained = (after.xp ?? 0) - (before.xp ?? 0);
    if (xpGained <= 0) return;

    const weekId = getCurrentWeekId();

    await weeklyStatsRef(db, userId).set(
      {
        [weekId]: {
          xp: admin.firestore.FieldValue.increment(xpGained),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    await updateLearningTree(db, userId, xpGained);
  });

/**
 * Trigger: 레슨 완료 시 → 주간 레슨 수 증가
 */
export const onLessonCompleted = functions.firestore
  .document("users/{userId}/tutorProgress/{lessonId}")
  .onCreate(async (_snapshot, context) => {
    const db = admin.firestore();
    const userId = context.params.userId;
    const weekId = getCurrentWeekId();

    await weeklyStatsRef(db, userId).set(
      {
        [weekId]: {
          lessonsCompleted: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );
  });

/**
 * Trigger: 채팅 메시지 → 주간 메시지 수 증가
 */
export const onChatMessage = functions.firestore
  .document("users/{userId}/sessions/{sessionId}/messages/{messageId}")
  .onCreate(async (_snapshot, context) => {
    const db = admin.firestore();
    const userId = context.params.userId;
    const weekId = getCurrentWeekId();

    await weeklyStatsRef(db, userId).set(
      {
        [weekId]: {
          chatMessages: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );
  });

/**
 * Trigger: 실수 정원에 새 식물 심기 → 주간 실수 수 증가
 */
export const onMistakeDetected = functions.firestore
  .document("users/{userId}/mistakeGarden/{plantId}")
  .onCreate(async (_snapshot, context) => {
    const db = admin.firestore();
    const userId = context.params.userId;
    const weekId = getCurrentWeekId();

    await weeklyStatsRef(db, userId).set(
      {
        [weekId]: {
          mistakeCount: admin.firestore.FieldValue.increment(1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );
  });
