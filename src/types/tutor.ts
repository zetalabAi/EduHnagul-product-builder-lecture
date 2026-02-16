/**
 * AI Tutor Types
 * Socratic Method 기반 학습
 */

import { Timestamp } from "firebase/firestore";

/**
 * Tutor Persona
 */
export type TutorPersona = "suji" | "minjun" | "grandma" | "business";

export interface Tutor {
  id: TutorPersona;
  name: string;
  description: string;
  icon: string;
  personality: string;
  speciality: string;
}

/**
 * Lesson
 */
export interface Lesson {
  id: string;
  number: number; // 1-50
  title: string;
  topic: string;
  difficulty: number; // 0-1 (0: beginner, 1: advanced)
  objectives: string[]; // Learning objectives
  estimatedMinutes: number;
  xpReward: number;
}

/**
 * Socratic Message
 */
export interface SocraticMessage {
  id: string;
  role: "tutor" | "student";
  content: string;
  options?: string[]; // Multiple choice options
  hint?: string;
  culturalNote?: string;
  grammarTip?: string;
  dramaReference?: string; // Reference to K-drama/K-pop
  timestamp: Date;
}

/**
 * Tutor Chat Response
 */
export interface TutorChatResponse {
  message: string;
  options?: string[]; // 2-4 options
  hint?: string;
  culturalNote?: string;
  grammarTip?: string;
  dramaReference?: string;
  isCorrect?: boolean; // If answering a question
  encouragement?: string; // Positive feedback
  nextQuestion?: string; // Next topic question
}

/**
 * User Tutor Progress
 */
export interface TutorProgress {
  userId: string;
  currentLesson: number; // 1-50
  selectedTutor: TutorPersona;
  lessonsCompleted: number[];
  totalXP: number;
  streak: number;
  lastStudied: Timestamp | null;
  weakTopics: string[]; // Topics user struggles with
  strongTopics: string[]; // Topics user excels at
}

/**
 * Tutor Session
 */
export interface TutorSession {
  id: string;
  userId: string;
  lessonId: string;
  tutorPersona: TutorPersona;
  messages: SocraticMessage[];
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  xpEarned: number;
  correctAnswers: number;
  totalQuestions: number;
}

/**
 * Lesson Content
 */
export interface LessonContent {
  lessonId: string;
  introduction: string;
  mainConcept: string;
  examples: {
    korean: string;
    english: string;
    context: string;
  }[];
  practice: {
    question: string;
    correctAnswer: string;
    commonMistakes: string[];
  }[];
  culturalContext?: string;
  dramaExamples?: string[];
}

/**
 * Tutor Page State
 */
export interface TutorPageState {
  selectedTutor: TutorPersona | null;
  currentLesson: Lesson | null;
  messages: SocraticMessage[];
  isLoading: boolean;
  showHint: boolean;
  progress: TutorProgress | null;
}
