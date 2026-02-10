import * as admin from "firebase-admin";
import { chatStream } from "./chat/chatStream";
import { textChat } from "./chat/textChat";
import { translateLast } from "./translation/translateLast";
import { createSession, updateSession, renameSession, togglePinSession, deleteSession } from "./sessions/sessionManagement";
import { resetDailyQuotas } from "./scheduled/resetQuotas";
import { onUserCreate } from "./auth/onUserCreate";
import { synthesizeSpeech } from "./speech/synthesizeSpeech";
import { voiceChat } from "./speech/voiceChat";
import { getAssistantSuggestion } from "./speech/assistantSuggestion";
import { getSessionSummary, endSession } from "./speech/sessionSummary";
import { getDetailedAnalysis } from "./speech/detailedAnalysis";
import { createCheckoutSession, createPortalSession } from "./stripe/checkout";
import { stripeWebhook } from "./stripe/webhooks";
import { updateProfile } from "./user/updateProfile";

// Initialize Firebase Admin
admin.initializeApp();

// Export all Cloud Functions
export {
  chatStream,
  textChat,
  translateLast,
  createSession,
  updateSession,
  renameSession,
  togglePinSession,
  deleteSession,
  resetDailyQuotas,
  onUserCreate,
  synthesizeSpeech,
  voiceChat,
  getAssistantSuggestion,
  getSessionSummary,
  endSession,
  getDetailedAnalysis,
  createCheckoutSession,
  createPortalSession,
  stripeWebhook,
  updateProfile,
};
