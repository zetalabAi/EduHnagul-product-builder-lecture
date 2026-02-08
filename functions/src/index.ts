import * as admin from "firebase-admin";
import { chatStream } from "./chat/chatStream";
import { translateLast } from "./translation/translateLast";
import { createSession, updateSession } from "./sessions/sessionManagement";
import { createStripeCheckout } from "./payments/createCheckout";
import { stripeWebhook } from "./payments/webhook";
import { resetDailyQuotas } from "./scheduled/resetQuotas";
import { onUserCreate } from "./auth/onUserCreate";

// Initialize Firebase Admin
admin.initializeApp();

// Export all Cloud Functions
export {
  chatStream,
  translateLast,
  createSession,
  updateSession,
  createStripeCheckout,
  stripeWebhook,
  resetDailyQuotas,
  onUserCreate,
};
