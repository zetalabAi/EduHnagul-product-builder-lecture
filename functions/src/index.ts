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
import { createUserProfile } from "./user/createUserProfile";
import { tutorChat } from "./tutor/tutorChat";
import { getLesson, getAllLessons, getUserCurrentLesson, completeLesson } from "./tutor/lessonGenerator";
import { adaptiveResponse } from "./tutor/adaptiveResponse";
import { analyzeEmotion } from "./tutor/analyzeEmotion";
import {
  recordActivity,
  getStreakStatus,
  getStreakCalendar,
  grantStreakFreeze,
  grantXP,
  getXPStatus,
  getDailyXP,
  getWeeklyXP,
  getXPLeaderboard,
} from "./gamification/index";
import { recommendLessons, getUserPersonalization } from "./personalization/recommendLessons";
import {
  plantSeed,
  waterPlant,
  getGardenStats,
  getGarden,
  getPlant,
  getPlantsNeedingWater,
} from "./gamification/gardenFunctions";
import { checkStreaks } from "./scheduled/checkStreaks";
import { sendStreakReminder } from "./scheduled/sendStreakReminder";
import { onTextMessage, onVoiceMessage, checkDailyGoal } from "./triggers/chatXP";
import { getEpisode, getAllEpisodes } from "./drama/getEpisode";
import { processChoice } from "./drama/processChoice";
import { calculateEnding } from "./drama/calculateEnding";
import { getShadowContent } from "./shadow/getShadowContent";
import { analyzeRhythm } from "./shadow/analyzeRhythm";
import { getCulturalTopic, getAllCulturalTopics } from "./culture/getCulturalTopic";
import { addFriend, removeFriend, searchUsers, generateInviteLink } from "./social/friendFunctions";
import { createChallenge, updateChallenge, completeChallenge, sendCheerMessage } from "./social/challengeFunctions";
import { updateWeeklyXP, processWeekEnd, calculateRankings, getGlobalLeaderboard, initializeUserLeague } from "./league/leagueFunctions";

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
  createUserProfile,
  // Tutor functions
  tutorChat,
  getLesson,
  getAllLessons,
  getUserCurrentLesson,
  completeLesson,
  adaptiveResponse,
  analyzeEmotion,
  // Gamification functions
  recordActivity,
  getStreakStatus,
  getStreakCalendar,
  grantStreakFreeze,
  grantXP,
  getXPStatus,
  getDailyXP,
  getWeeklyXP,
  getXPLeaderboard,
  // Scheduled functions
  checkStreaks,
  sendStreakReminder,
  checkDailyGoal,
  // Firestore triggers
  onTextMessage,
  onVoiceMessage,
  // Personalization functions
  recommendLessons,
  getUserPersonalization,
  // Garden functions
  plantSeed,
  waterPlant,
  getGardenStats,
  getGarden,
  getPlant,
  getPlantsNeedingWater,
  // Drama functions
  getEpisode,
  getAllEpisodes,
  processChoice,
  calculateEnding,
  // Shadow functions
  getShadowContent,
  analyzeRhythm,
  // Culture functions
  getCulturalTopic,
  getAllCulturalTopics,
  // Friend System functions
  addFriend,
  removeFriend,
  searchUsers,
  generateInviteLink,
  // Challenge functions
  createChallenge,
  updateChallenge,
  completeChallenge,
  sendCheerMessage,
  // League functions
  updateWeeklyXP,
  processWeekEnd,
  calculateRankings,
  getGlobalLeaderboard,
  initializeUserLeague,
};
