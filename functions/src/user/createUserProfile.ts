import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Onboarding Data Interface
 */
interface OnboardingData {
  goal: string;
  customGoal?: string;
  level: string;
  learningStyle: "visual" | "auditory" | "reading" | "kinesthetic";
  dailyMinutes: number;
  preferredTime: string;
  notifications: boolean;
  notificationTime?: string;
}

/**
 * Create User Profile
 * Initialize user profile after onboarding completion
 */
export const createUserProfile = functions.https.onCall(
  async (data: OnboardingData, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();
    const userRef = db.collection("users").doc(userId);

    try {
      // 1. Create/Update user profile
      await userRef.set(
        {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          onboardingCompleted: true,

          // Learning information
          goal: data.goal,
          customGoal: data.customGoal || null,
          level: data.level,
          learningStyle: data.learningStyle,

          // Schedule
          dailyMinutes: data.dailyMinutes,
          dailyXpGoal: data.dailyMinutes === 5 ? 50 : data.dailyMinutes === 15 ? 150 : 300,
          preferredTime: data.preferredTime,

          // Notifications
          notifications: data.notifications,
          notificationTime: data.notificationTime || null,

          // Initial stats
          totalLessonsCompleted: 0,
          totalStudyMinutes: 0,
        },
        { merge: true }
      );

      // 2. Initialize gamification stats
      const gamificationRef = userRef.collection("gamification").doc("stats");
      await gamificationRef.set(
        {
          // Streak
          streak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          freezeCount: 1, // Starting bonus
          streakHistory: [],

          // XP & Level
          xp: 0,
          level: 1,
          levelTitle: "입문자",
          levelBadge: "🌱",
          xpHistory: [],

          // Badges
          badges: [
            {
              id: "welcome",
              name: "환영합니다!",
              earnedAt: admin.firestore.Timestamp.now(),
            },
          ],

          // Timestamps
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        },
        { merge: true }
      );

      // 3. Create first daily missions
      const today = new Date().toISOString().split("T")[0];
      const missionsRef = userRef.collection("dailyMissions").doc(today);

      await missionsRef.set({
        date: today,
        missions: [
          {
            id: "first_lesson",
            title: "첫 레슨 완료하기",
            description: "AI 튜터와 첫 대화 시작",
            xpReward: 50,
            completed: false,
            icon: "🎯",
            type: "tutor",
            progress: 0,
            target: 1,
          },
          {
            id: "profile_complete",
            title: "프로필 완성",
            description: "온보딩 완료",
            xpReward: 30,
            completed: true,
            icon: "✅",
            type: "profile",
            progress: 1,
            target: 1,
          },
          {
            id: "first_voice",
            title: "음성 대화 시도",
            description: "음성으로 한 번 대화하기",
            xpReward: 40,
            completed: false,
            icon: "🎙️",
            type: "voice",
            progress: 0,
            target: 1,
          },
        ],
        createdAt: admin.firestore.Timestamp.now(),
      });

      // 4. Grant profile completion XP
      await gamificationRef.update({
        xp: admin.firestore.FieldValue.increment(30),
        xpHistory: admin.firestore.FieldValue.arrayUnion({
          amount: 30,
          reason: "프로필 완성",
          timestamp: admin.firestore.Timestamp.now(),
          totalXP: 30,
        }),
      });

      // 5. Create initial user preferences based on learning style
      const preferencesRef = userRef.collection("preferences").doc("learning");

      const stylePreferences = {
        visual: {
          preferImages: true,
          preferVideos: true,
          preferText: false,
          preferAudio: false,
          colorCoding: true,
          visualAids: true,
        },
        auditory: {
          preferImages: false,
          preferVideos: false,
          preferText: false,
          preferAudio: true,
          readAloud: true,
          musicMnemonics: true,
        },
        reading: {
          preferImages: false,
          preferVideos: false,
          preferText: true,
          preferAudio: false,
          detailedExplanations: true,
          writtenExercises: true,
        },
        kinesthetic: {
          preferImages: false,
          preferVideos: true,
          preferText: false,
          preferAudio: false,
          interactiveGames: true,
          handsonActivities: true,
        },
      };

      await preferencesRef.set({
        ...stylePreferences[data.learningStyle],
        learningStyle: data.learningStyle,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      // 6. Log onboarding completion
      console.log(`User ${userId} completed onboarding:`, {
        goal: data.goal,
        level: data.level,
        learningStyle: data.learningStyle,
      });

      return {
        success: true,
        message: "Profile created successfully",
        userId,
      };
    } catch (error: any) {
      console.error("Error creating user profile:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to create profile: ${error.message}`
      );
    }
  }
);
