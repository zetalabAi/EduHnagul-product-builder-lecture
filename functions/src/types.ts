import { Timestamp } from "firebase-admin/firestore";

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  nativeLanguage: "en" | "es" | "ja" | "zh" | "fr";

  subscriptionTier: "free" | "pro";
  subscriptionStatus: "active" | "canceled" | "past_due" | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

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

  rollingSummary: string | null;
  lastSummaryAt: Timestamp | null;
  summaryVersion: number;

  messageCount: number;
  lastMessageAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageDocument {
  id: string;
  sessionId: string;
  userId: string;

  role: "user" | "assistant";
  content: string;

  modelUsed: "claude-3-haiku-20240307" | "claude-3-5-sonnet-20241022" | null;
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
