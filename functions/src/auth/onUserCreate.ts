import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();

  // Determine native language from locale (fallback to English)
  let nativeLanguage: "en" | "es" | "ja" | "zh" | "fr" = "en";
  if (user.customClaims?.locale) {
    const locale = user.customClaims.locale as string;
    if (locale.startsWith("es")) nativeLanguage = "es";
    else if (locale.startsWith("ja")) nativeLanguage = "ja";
    else if (locale.startsWith("zh")) nativeLanguage = "zh";
    else if (locale.startsWith("fr")) nativeLanguage = "fr";
  }

  // Create user document
  await db.collection("users").doc(user.uid).set({
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    nativeLanguage,

    subscriptionTier: "free",
    subscriptionStatus: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,

    trialUsed: false,
    trialStartedAt: null,
    trialEndedAt: null,
    trialMessagesUsed: 0,

    dailyMessagesUsed: 0,
    lastQuotaReset: admin.firestore.FieldValue.serverTimestamp(),

    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info(`Created user document for ${user.uid}`);
});
