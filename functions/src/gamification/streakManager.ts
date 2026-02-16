import * as admin from "firebase-admin";

// Lazy initialization
function getDb() {
  return admin.firestore();
}

/**
 * Streak Update Result
 */
export interface StreakUpdate {
  streak: number;
  longestStreak: number;
  increased: boolean;
  reset?: boolean;
  freezeUsed?: boolean;
  milestone?: {
    badge: string;
    xp: number;
  };
}

/**
 * Streak Manager
 * Duolingo-style streak system
 */
export class StreakManager {
  /**
   * Record user activity and update streak
   */
  static async recordActivity(userId: string): Promise<StreakUpdate> {
    const userRef = getDb().collection("users").doc(userId);
    const gamificationRef = userRef.collection("gamification").doc("stats");

    return getDb().runTransaction(async (transaction) => {
      const doc = await transaction.get(gamificationRef);
      const data = doc.data() || {
        streak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        freezeCount: 0,
        badges: [],
        streakHistory: [],
      };

      const now = new Date();
      const lastActivity = data.lastActivityDate?.toDate();

      // 1. Already recorded today
      if (lastActivity && this.isSameDay(lastActivity, now)) {
        return {
          streak: data.streak,
          longestStreak: data.longestStreak || 0,
          increased: false,
        };
      }

      // 2. Recorded yesterday → Streak +1
      if (lastActivity && this.isYesterday(lastActivity, now)) {
        const newStreak = data.streak + 1;
        const newLongestStreak = Math.max(
          newStreak,
          data.longestStreak || 0
        );

        const updateData: any = {
          streak: newStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: admin.firestore.Timestamp.fromDate(now),
          streakHistory: admin.firestore.FieldValue.arrayUnion({
            date: admin.firestore.Timestamp.fromDate(now),
            active: true,
          }),
        };

        transaction.set(gamificationRef, updateData, { merge: true });

        // Check milestone
        const milestone = await this.checkMilestone(
          userId,
          newStreak,
          transaction
        );

        return {
          streak: newStreak,
          longestStreak: newLongestStreak,
          increased: true,
          milestone,
        };
      }

      // 3. Skipped day(s) but has freeze
      if (data.freezeCount > 0) {
        const updateData: any = {
          freezeCount: data.freezeCount - 1,
          lastActivityDate: admin.firestore.Timestamp.fromDate(now),
          streakHistory: admin.firestore.FieldValue.arrayUnion({
            date: admin.firestore.Timestamp.fromDate(now),
            active: true,
            freezeUsed: true,
          }),
        };

        transaction.set(gamificationRef, updateData, { merge: true });

        return {
          streak: data.streak,
          longestStreak: data.longestStreak || 0,
          increased: false,
          freezeUsed: true,
        };
      }

      // 4. No freeze → Reset streak
      const updateData: any = {
        streak: 1,
        lastActivityDate: admin.firestore.Timestamp.fromDate(now),
        streakHistory: admin.firestore.FieldValue.arrayUnion({
          date: admin.firestore.Timestamp.fromDate(now),
          active: true,
        }),
      };

      transaction.set(gamificationRef, updateData, { merge: true });

      return {
        streak: 1,
        longestStreak: data.longestStreak || 0,
        increased: false,
        reset: true,
      };
    });
  }

  /**
   * Check milestone and grant badge
   */
  private static async checkMilestone(
    userId: string,
    streak: number,
    transaction: admin.firestore.Transaction
  ): Promise<{ badge: string; xp: number } | undefined> {
    const milestones = [
      { days: 7, badge: "bronze_streak", xp: 100 },
      { days: 30, badge: "silver_streak", xp: 500 },
      { days: 100, badge: "gold_streak", xp: 2000 },
      { days: 365, badge: "diamond_streak", xp: 10000 },
    ];

    const milestone = milestones.find((m) => m.days === streak);
    if (!milestone) return undefined;

    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    // Grant badge
    transaction.update(gamificationRef, {
      badges: admin.firestore.FieldValue.arrayUnion({
        id: milestone.badge,
        earnedAt: admin.firestore.Timestamp.now(),
      }),
      xp: admin.firestore.FieldValue.increment(milestone.xp),
    });

    return milestone;
  }

  /**
   * Grant freeze (streak immunity)
   */
  static async grantFreeze(userId: string, count: number = 1): Promise<void> {
    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    await gamificationRef.set(
      {
        freezeCount: admin.firestore.FieldValue.increment(count),
      },
      { merge: true }
    );
  }

  /**
   * Get streak status
   */
  static async getStreakStatus(userId: string): Promise<{
    streak: number;
    longestStreak: number;
    freezeCount: number;
    lastActivityDate: Date | null;
    isActiveToday: boolean;
  }> {
    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    const doc = await gamificationRef.get();
    const data = doc.data() || {
      streak: 0,
      longestStreak: 0,
      freezeCount: 0,
      lastActivityDate: null,
    };

    const lastActivity = data.lastActivityDate?.toDate() || null;
    const isActiveToday = lastActivity
      ? this.isSameDay(lastActivity, new Date())
      : false;

    return {
      streak: data.streak,
      longestStreak: data.longestStreak || 0,
      freezeCount: data.freezeCount || 0,
      lastActivityDate: lastActivity,
      isActiveToday,
    };
  }

  /**
   * Check if two dates are the same day
   */
  private static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Check if date1 is yesterday compared to date2
   */
  private static isYesterday(date1: Date, date2: Date): boolean {
    const yesterday = new Date(date2);
    yesterday.setDate(yesterday.getDate() - 1);

    return this.isSameDay(date1, yesterday);
  }

  /**
   * Get streak calendar (last 30 days)
   */
  static async getStreakCalendar(
    userId: string
  ): Promise<Array<{ date: Date; active: boolean; freezeUsed?: boolean }>> {
    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    const doc = await gamificationRef.get();
    const data = doc.data();
    const history = data?.streakHistory || [];

    // Get last 30 days
    const calendar: Array<{
      date: Date;
      active: boolean;
      freezeUsed?: boolean;
    }> = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dayHistory = history.find((h: any) =>
        this.isSameDay(h.date.toDate(), date)
      );

      calendar.push({
        date,
        active: dayHistory?.active || false,
        freezeUsed: dayHistory?.freezeUsed || false,
      });
    }

    return calendar;
  }
}
