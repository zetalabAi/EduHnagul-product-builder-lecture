/**
 * Gamification Types for Edu_Hangul 2.0
 * Streak, XP, Missions, Mistake Garden
 */

import { Timestamp } from "firebase/firestore";

/**
 * User Progress Data
 */
export interface UserProgress {
  userId: string;
  displayName: string;
  streak: number;
  streakLastUpdate: Timestamp | null;
  xp: number;
  dailyXpGoal: number; // Daily XP target (default: 200)
  level: number;
  weeklyGoal: number; // Weekly XP goal
  weeklyXp: number; // XP earned this week
}

/**
 * Daily Mission
 */
export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  icon: string; // Emoji
  type: "chat" | "voice" | "practice" | "lesson";
  progress: number; // 0-100
  target: number; // Target count (e.g., 5 messages)
}

/**
 * Mistake Garden Item
 */
export interface MistakeGardenItem {
  id: string;
  category: "grammar" | "vocabulary" | "pronunciation" | "expression";
  mistake: string; // Original mistake
  correction: string; // Corrected version
  explanation: string; // Why it's wrong
  stage: "seed" | "sprout" | "flower"; // Growth stage
  practiceCount: number; // How many times practiced
  lastPracticed: Timestamp | null;
  createdAt: Timestamp;
}

/**
 * Streak Status
 */
export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastUpdateDate: string; // YYYY-MM-DD format
  isActiveToday: boolean;
}

/**
 * XP Progress
 */
export interface XPProgress {
  current: number;
  dailyGoal: number;
  percentage: number; // 0-100
  remaining: number;
}

/**
 * Weekly Progress
 */
export interface WeeklyProgress {
  weeklyXp: number;
  weeklyGoal: number;
  percentage: number;
  daysActive: number; // Days active this week
}

/**
 * Home Page Data
 * Aggregated data for home page
 */
export interface HomePageData {
  userProgress: UserProgress;
  streak: StreakStatus;
  xpProgress: XPProgress;
  weeklyProgress: WeeklyProgress;
  dailyMissions: DailyMission[];
  mistakeGarden: MistakeGardenItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Learning Mode
 */
export interface LearningMode {
  id: "conversation" | "tutor";
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  available: boolean;
  route: string;
}
