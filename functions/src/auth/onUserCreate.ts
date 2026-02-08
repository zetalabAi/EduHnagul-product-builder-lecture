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

  const now = admin.firestore.Timestamp.now();
  const weeklyResetAt = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + 7 * 24 * 60 * 60 * 1000 // +7 days
  );

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

    // Student discount (만 20세 이하)
    isStudent: false,
    birthDate: null,

    // Voice chat credits (weekly reset, 7-day cycle)
    weeklyMinutesUsed: 0,
    weeklyResetAt: weeklyResetAt,

    // Analysis quota
    analysisUsedLifetime: false, // Free/Free+: 1회 평생
    dailyAnalysisUsed: 0, // Pro/Pro+: daily
    lastAnalysisReset: now,

    // Assistant usage
    weeklyAssistantUsed: 0,

    // Legacy fields (text chat)
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
