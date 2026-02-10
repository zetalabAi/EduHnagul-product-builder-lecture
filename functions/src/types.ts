import { Timestamp } from "firebase-admin/firestore";

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  nativeLanguage: "en" | "es" | "ja" | "zh" | "fr";

  subscriptionTier: "free" | "free+" | "pro" | "pro+";
  subscriptionStatus: "active" | "canceled" | "past_due" | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  // Student discount (만 20세 이하)
  isStudent: boolean;
  birthDate: Timestamp | null;

  // Voice chat credits (weekly reset, 7-day cycle)
  weeklyMinutesUsed: number;
  weeklyResetAt: Timestamp;

  // Analysis quota (Free/Free+: 1회 평생, Pro: 3회/일, Pro+: 7회/일)
  analysisUsedLifetime: boolean; // Free/Free+ only
  dailyAnalysisUsed: number; // Pro/Pro+ only
  lastAnalysisReset: Timestamp;

  // Assistant usage (Free+: 주 1회, Pro/Pro+: 무제한)
  weeklyAssistantUsed: number;

  // Legacy fields (for text chat)
  trialUsed: boolean;
  trialStartedAt: Timestamp | null;
  trialEndedAt: Timestamp | null;
  trialMessagesUsed: number;
  dailyMessagesUsed: number;
  lastQuotaReset: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SessionDocument {
  id: string;
  userId: string;
  title: string;

  persona: "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
  responseStyle: "empathetic" | "balanced" | "blunt";
  correctionStrength: "minimal" | "strict";
  formalityLevel: "formal" | "polite" | "casual" | "intimate";

  // Voice session specific
  isVoiceSession: boolean;
  totalDurationSeconds: number; // Total conversation time
  userSpeakingSeconds: number; // User speaking time
  aiSpeakingSeconds: number; // AI speaking time
  isPaused: boolean; // Session paused (not ended)

  rollingSummary: string | null;
  lastSummaryAt: Timestamp | null;
  summaryVersion: number;

  messageCount: number;
  lastMessageAt: Timestamp;

  // Session management
  isPinned: boolean; // Pin to top of sidebar
  lastMessagePreview: string; // Preview text for sidebar
  isArchived: boolean; // For future soft-delete

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageDocument {
  id: string;
  sessionId: string;
  userId: string;

  role: "user" | "assistant";
  content: string;

  // Voice message specific
  audioUrl: string | null; // TTS audio URL (assistant only)
  durationSeconds: number | null; // Speaking duration

  modelUsed: "claude-3-haiku-20240307" | "claude-sonnet-4-20250514" | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;

  createdAt: Timestamp;
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}
