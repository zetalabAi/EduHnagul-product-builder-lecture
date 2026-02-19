import { Timestamp } from "firebase-admin/firestore";

export interface WeeklyStats {
  weekId: string;            // "2024-W07"
  xp: number;
  lessonsCompleted: number;
  chatMessages: number;
  voiceMinutes: number;
  mistakeCount: number;
  streakDays: number;
  activeDays: number;
  startDate?: Date;
  endDate?: Date;
  lastUpdated?: Timestamp;
}

export interface MonthlyStats {
  monthId: string;           // "2024-02"
  totalXP: number;
  totalLessons: number;
  averageStreak: number;
  mistakesFixed: number;
}

export interface LearningTree {
  level: number;
  totalXP: number;
  nextLevelXP: number;
  lastUpdated: Timestamp;
}

export interface GardenHealth {
  overallScore: number;      // 0-100
  learningScore: number;
  consistencyScore: number;
  accuracyScore: number;
}

export interface AIComment {
  weekId: string;
  comment: string;
  sentiment: "praise" | "encourage" | "neutral";
  timestamp: Timestamp;
  analysis: {
    xpChange: number;
    lessonChange: number;
    mistakeChange: number;
    streakChange: number;
  };
}

export interface WeeklyAnalysis {
  weekId: string;
  thisWeekStats: WeeklyStats;
  lastWeekStats: WeeklyStats;
  analysis: {
    xpChange: number;
    lessonChange: number;
    mistakeChange: number;
    streakChange: number;
  };
  aiComment: Omit<AIComment, "weekId">;
}
