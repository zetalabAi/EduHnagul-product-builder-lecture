// Backend API Contracts - TypeScript Interfaces

// ============================================================================
// Cloud Functions Request/Response Types
// ============================================================================

// ChatStream
export interface ChatStreamRequest {
  sessionId: string;
  message: string;
}

export interface ChatStreamTokenEvent {
  token: string;
}

export interface ChatStreamDoneEvent {
  messageId: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: "claude-3-haiku-20240307" | "claude-3-5-sonnet-20241022";
}

export interface ChatStreamErrorEvent {
  code: string;
  message: string;
}

// TranslateLast
export interface TranslateLastRequest {
  sessionId: string;
  role: "user" | "assistant";
}

export interface TranslateLastResponse {
  original: string;
  translated: string;
  targetLanguage: string;
}

// CreateStripeCheckout
export interface CreateStripeCheckoutRequest {
  successUrl: string;
  cancelUrl: string;
}

export interface CreateStripeCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

// CreateSession
export interface CreateSessionRequest {
  persona: "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
  responseStyle: "empathetic" | "balanced" | "blunt";
  correctionStrength: "minimal" | "strict";
  formalityLevel: "formal" | "polite" | "casual" | "intimate";
}

export interface CreateSessionResponse {
  sessionId: string;
  createdAt: string;
}

// UpdateSession
export interface UpdateSessionRequest {
  sessionId: string;
  persona?: "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
  responseStyle?: "empathetic" | "balanced" | "blunt";
  correctionStrength?: "minimal" | "strict";
  formalityLevel?: "formal" | "polite" | "casual" | "intimate";
}

export interface UpdateSessionResponse {
  success: boolean;
}

// ============================================================================
// Firestore Document Types
// ============================================================================

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  nativeLanguage: "en" | "es" | "ja" | "zh" | "fr";
  koreanLevel: "beginner" | "intermediate" | "advanced";

  // Subscription
  subscriptionTier: "free" | "pro";
  subscriptionStatus: "active" | "canceled" | "past_due" | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  // Trial
  trialUsed: boolean;
  trialStartedAt: Date | null;
  trialEndedAt: Date | null;
  trialMessagesUsed: number;

  // Quota
  dailyMessagesUsed: number;
  lastQuotaReset: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDocument {
  id: string;
  userId: string;
  title: string;

  // Settings
  persona: "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
  responseStyle: "empathetic" | "balanced" | "blunt";
  correctionStrength: "minimal" | "strict";
  formalityLevel: "formal" | "polite" | "casual" | "intimate";

  // Memory
  rollingSummary: string | null;
  lastSummaryAt: Date | null;
  summaryVersion: number;

  // Metadata
  messageCount: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDocument {
  id: string;
  sessionId: string;
  userId: string;

  role: "user" | "assistant";
  content: string;
  learningTip?: string | null; // Learning tip for assistant messages

  // Voice message specific
  audioUrl: string | null;
  durationSeconds: number | null;

  // AI metadata
  modelUsed: "claude-3-haiku-20240307" | "claude-3-5-sonnet-20241022" | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;

  createdAt: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export interface APIError {
  code: ErrorCode;
  message: string;
  details?: any;
}

export type ErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_SESSION"
  | "QUOTA_EXCEEDED"
  | "TRIAL_EXPIRED"
  | "MESSAGE_TOO_LONG"
  | "GEMINI_ERROR"
  | "RATE_LIMIT"
  | "MESSAGE_NOT_FOUND"
  | "ALREADY_SUBSCRIBED"
  | "STRIPE_ERROR"
  | "INVALID_SETTINGS";

// ============================================================================
// Utility Types
// ============================================================================

export type NativeLanguage = "en" | "es" | "ja" | "zh" | "fr";
export type SubscriptionTier = "free" | "pro";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | null;
export type ModelName = "claude-3-haiku-20240307" | "claude-3-5-sonnet-20241022";
export type FormalityLevel = "formal" | "polite" | "casual" | "intimate";
