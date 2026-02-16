import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ContentSelector } from "./contentSelector";
import { DifficultyAdapter } from "./difficultyAdapter";

/**
 * Recommend Lessons
 * Provide personalized lesson recommendations based on user profile
 */
export const recommendLessons = functions.https.onCall(
  async (data, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    try {
      // 1. Get user profile
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User profile not found"
        );
      }

      const profile = userDoc.data();

      if (!profile || !profile.onboardingCompleted) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Please complete onboarding first"
        );
      }

      // 2. Extract user preferences
      const {
        goal,
        level,
        learningStyle,
        dailyMinutes,
        preferredTime,
      } = profile;

      // 3. Get content strategy based on learning style
      const contentStrategy = ContentSelector.getContentForStyle(
        learningStyle,
        goal
      );

      // 4. Get vocabulary for goal
      const vocab = ContentSelector.getVocabForGoal(goal);

      // 5. Get grammar points for level
      const grammar = ContentSelector.getGrammarForLevel(level);

      // 6. Calculate difficulty
      const difficulty = DifficultyAdapter.calculateDifficulty(level);

      // 7. Get cultural content
      const culturalContent = ContentSelector.getCulturalContent(goal);

      // 8. Get recommended topics
      const recommendedTopics = ContentSelector.getRecommendedTopics(
        goal,
        level
      );

      // 9. Get example sentences
      const exampleSentences = ContentSelector.getExampleSentences(
        goal,
        level
      );

      // 10. Get feedback style
      const feedbackStyle = DifficultyAdapter.getFeedbackStyle(level);

      // 11. Get sentence complexity
      const sentenceComplexity = DifficultyAdapter.getSentenceComplexity(level);

      // 12. Build lesson recommendations
      const recommendations = recommendedTopics.map((topic, index) => ({
        id: `lesson-${goal}-${level}-${index + 1}`,
        title: topic,
        topic,
        difficulty,
        level,
        goal,
        estimatedMinutes: dailyMinutes || 15,
        vocabulary: vocab.slice(index * 5, (index + 1) * 5), // 5 words per lesson
        grammar: grammar.slice(0, 2), // 2 grammar points
        exampleSentences: exampleSentences.slice(0, 3),
        culturalContent: culturalContent?.suggestions[0] || null,
        contentStrategy,
        priority: index === 0 ? "high" : "normal", // First lesson is high priority
      }));

      // 13. Get user's learning history to filter completed lessons
      const gamificationDoc = await db
        .collection("users")
        .doc(userId)
        .collection("gamification")
        .doc("stats")
        .get();

      const stats = gamificationDoc.data();
      const completedLessons = stats?.completedLessons || [];

      // Filter out completed lessons
      const filteredRecommendations = recommendations.filter(
        (lesson) => !completedLessons.includes(lesson.id)
      );

      // 14. Get time-based recommendations
      const currentHour = new Date().getHours();
      const isPreferredTime = (() => {
        switch (preferredTime) {
          case "morning":
            return currentHour >= 6 && currentHour < 12;
          case "lunch":
            return currentHour >= 12 && currentHour < 14;
          case "evening":
            return currentHour >= 18 && currentHour < 21;
          case "night":
            return currentHour >= 21 || currentHour < 6;
          default:
            return false;
        }
      })();

      // 15. Build personalization metadata
      const personalization = {
        learningStyle,
        difficulty,
        level,
        goal,
        vocab: vocab.slice(0, 10), // Top 10 words to focus on
        grammar,
        contentStrategy,
        culturalContent,
        feedbackStyle,
        sentenceComplexity,
        dailyMinutes,
        preferredTime,
        isPreferredTime,
        totalRecommendations: filteredRecommendations.length,
      };

      return {
        success: true,
        recommendations: filteredRecommendations.slice(0, 5), // Return top 5
        personalization,
        message: isPreferredTime
          ? "지금이 학습하기 좋은 시간이에요! 🌟"
          : "추천 레슨을 확인해보세요!",
      };
    } catch (error: any) {
      console.error("Error recommending lessons:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        `Failed to recommend lessons: ${error.message}`
      );
    }
  }
);

/**
 * Get User Profile for Personalization
 * Helper function to get user profile data
 */
export const getUserPersonalization = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;
    const db = admin.firestore();

    try {
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "User profile not found"
        );
      }

      const profile = userDoc.data();

      if (!profile || !profile.onboardingCompleted) {
        return {
          onboardingCompleted: false,
          shouldRedirect: true,
          redirectTo: "/onboarding",
        };
      }

      const difficulty = DifficultyAdapter.calculateDifficulty(profile.level);

      return {
        onboardingCompleted: true,
        profile: {
          goal: profile.goal,
          customGoal: profile.customGoal,
          level: profile.level,
          learningStyle: profile.learningStyle,
          dailyMinutes: profile.dailyMinutes,
          preferredTime: profile.preferredTime,
          difficulty,
        },
      };
    } catch (error: any) {
      console.error("Error getting user personalization:", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to get personalization: ${error.message}`
      );
    }
  }
);
