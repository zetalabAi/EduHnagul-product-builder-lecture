import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import {verifyAuth} from "../auth/authMiddleware";
import {AppError} from "../utils/errors";
import {UserDocument, SessionDocument, MessageDocument} from "../types";
import {checkAssistantUsage, incrementAssistantUsage} from "./creditManager";

function getDb() {
  return admin.firestore();
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface AssistantSuggestionRequest {
  sessionId: string;
}

interface AssistantSuggestionResponse {
  suggestions: Array<{
    text: string;
    translation: string;
    situation: string;
  }>;
  canUseAgain: boolean;
  usageInfo: string;
}

/**
 * Get AI-powered conversation suggestions for learners
 * Helps users know what to say next in Korean
 */
export const getAssistantSuggestion = functions.https.onCall(
  async (data: AssistantSuggestionRequest, context): Promise<AssistantSuggestionResponse> => {
    const userId = verifyAuth(context);
    const {sessionId} = data;

    if (!sessionId) {
      throw new AppError("INVALID_INPUT", "Session ID required", 400);
    }

    try {
      // 1. Check if user can use assistant
      const canUse = await checkAssistantUsage(userId);

      if (!canUse) {
        throw new AppError(
          "QUOTA_EXCEEDED",
          "Assistant usage limit reached. Upgrade to Pro for unlimited access!",
          429
        );
      }

      // 2. Get user, session, and recent messages
      const [userDoc, sessionDoc, messagesSnapshot] = await Promise.all([
        getDb().collection("users").doc(userId).get(),
        getDb().collection("sessions").doc(sessionId).get(),
        getDb()
          .collection("messages")
          .where("sessionId", "==", sessionId)
          .orderBy("createdAt", "desc")
          .limit(10)
          .get(),
      ]);

      if (!userDoc.exists || !sessionDoc.exists) {
        throw new AppError("NOT_FOUND", "User or session not found", 404);
      }

      const user = userDoc.data() as UserDocument;
      const session = sessionDoc.data() as SessionDocument;

      if (session.userId !== userId) {
        throw new AppError("FORBIDDEN", "Session does not belong to user", 403);
      }

      const messages = messagesSnapshot.docs
        .reverse()
        .map((doc) => doc.data() as MessageDocument);

      // 3. Build context for AI
      const recentConversation = messages
        .slice(-6) // Last 3 exchanges
        .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
        .join("\n");

      const formalityLabel = {
        formal: "정중하게 (Formal)",
        polite: "존댓말 (Polite)",
        casual: "친구처럼 (Casual)",
        intimate: "편하게 (Intimate)",
      }[session.formalityLevel];

      const prompt = `You are helping a Korean language learner. They're stuck and don't know what to say next.

CONTEXT:
- Formality Level: ${formalityLabel}
- Persona: ${session.persona}
- Native Language: ${user.nativeLanguage}

RECENT CONVERSATION:
${recentConversation || "No conversation yet - this is the start!"}

TASK:
Suggest 3 natural Korean phrases the user could say next. Make them:
1. Appropriate for the formality level and persona
2. Natural and conversational (not textbook!)
3. Varied (question, statement, reaction)
4. Helpful for continuing the conversation

FORMAT YOUR RESPONSE AS JSON:
{
  "suggestions": [
    {
      "text": "Korean phrase here",
      "translation": "English translation",
      "situation": "When to use this (1 sentence)"
    }
  ]
}

Example:
{
  "suggestions": [
    {
      "text": "오늘 날씨 진짜 좋다! 산책할래?",
      "translation": "The weather is really nice today! Wanna take a walk?",
      "situation": "Suggesting an activity based on good weather"
    },
    {
      "text": "너 요즘 뭐 하면서 지내?",
      "translation": "What have you been up to lately?",
      "situation": "Asking about their recent life"
    },
    {
      "text": "ㅋㅋㅋ 진짜? 대박이다",
      "translation": "Lol really? That's amazing",
      "situation": "Reacting with surprise to what they said"
    }
  ]
}`;

      // 4. Call Claude for suggestions
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{role: "user", content: prompt}],
      });

      const aiText = response.content[0].type === "text" ? response.content[0].text : "{}";

      // Parse JSON response
      let suggestions;
      try {
        const parsed = JSON.parse(aiText);
        suggestions = parsed.suggestions || [];
      } catch (parseError) {
        functions.logger.error("Failed to parse AI response:", aiText);
        // Fallback suggestions
        suggestions = [
          {
            text: "안녕하세요!",
            translation: "Hello!",
            situation: "Greeting someone",
          },
          {
            text: "오늘 어때요?",
            translation: "How's your day?",
            situation: "Asking about their day",
          },
          {
            text: "재미있네요!",
            translation: "That's interesting!",
            situation: "Showing interest",
          },
        ];
      }

      // 5. Increment usage (only for Free+ and Pro tiers)
      if (user.subscriptionTier === "free+") {
        await incrementAssistantUsage(userId);
      }

      // 6. Determine usage info
      let usageInfo = "";
      let canUseAgain = true;

      if (user.subscriptionTier === "free+") {
        const used = (user.weeklyAssistantUsed || 0) + 1;
        usageInfo = `Assistant used ${used}/1 this week`;
        canUseAgain = used < 1;
      } else if (user.subscriptionTier === "pro" || user.subscriptionTier === "pro+") {
        usageInfo = "Unlimited assistant (Pro)";
        canUseAgain = true;
      } else {
        usageInfo = "Upgrade to Free+ for assistant";
        canUseAgain = false;
      }

      return {
        suggestions,
        canUseAgain,
        usageInfo,
      };
    } catch (error: any) {
      functions.logger.error("Assistant suggestion error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "ASSISTANT_ERROR",
        `Failed to get suggestions: ${error.message}`,
        500
      );
    }
  }
);
