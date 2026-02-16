/**
 * Onboarding Types
 * User onboarding flow data structures
 */

export type LearningGoal =
  | "travel"
  | "kpop"
  | "kdrama"
  | "business"
  | "other";

export type UserLevel = "beginner" | "elementary" | "intermediate" | "advanced";

export type LearningStyle = "visual" | "auditory" | "reading" | "kinesthetic";

export type DailyMinutes = 5 | 15 | 30;

export type PreferredTime = "morning" | "lunch" | "evening" | "night";

export interface OnboardingData {
  goal: LearningGoal | null;
  customGoal?: string; // For "other" goal
  level: UserLevel | null;
  learningStyle: LearningStyle | null;
  dailyMinutes: DailyMinutes | null;
  preferredTime: PreferredTime | null;
  notifications: boolean;
  notificationTime?: string; // HH:MM format
}

export interface GoalOption {
  id: LearningGoal;
  emoji: string;
  title: string;
  desc: string;
}

export interface LevelOption {
  id: UserLevel;
  emoji: string;
  title: string;
  desc: string;
}

export interface StyleQuestion {
  id: number;
  question: string;
  options: StyleOption[];
}

export interface StyleOption {
  style: LearningStyle;
  text: string;
  icon: string;
}

export interface ScheduleOption {
  minutes: DailyMinutes;
  emoji: string;
  title: string;
  desc: string;
}

export interface TimeOption {
  id: PreferredTime;
  emoji: string;
  title: string;
  time: string;
}
