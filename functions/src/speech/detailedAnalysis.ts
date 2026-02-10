import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import {verifyAuth} from "../auth/authMiddleware";
import {AppError} from "../utils/errors";
import {UserDocument, SessionDocument, MessageDocument} from "../types";
import {checkAnalysisUsage, incrementAnalysisUsage} from "./creditManager";

function getDb() {
  return admin.firestore();
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface DetailedAnalysisRequest {
  sessionId: string;
}

interface DetailedAnalysisResponse {
  pronunciation: { score: number; feedback: string[] };
  vocabulary: { score: number; feedback: string[] };
  grammar: { score: number; feedback: string[] };
  fluency: { score: number; feedback: string[] };
  suggestions: string[];
  canAnalyzeAgain: boolean;
  usageInfo: string;
}

/**
 * Get detailed conversation analysis (Pro feature)
 */
export const getDetailedAnalysis = functions.https.onCall(
  async (data: DetailedAnalysisRequest, context): Promise<DetailedAnalysisResponse> => {
    const userId = verifyAuth(context);
    const {sessionId} = data;

    if (!sessionId) {
      throw new AppError("INVALID_INPUT", "Session ID required", 400);
    }

    try {
      // 1. Check if user can use analysis
      const canUse = await checkAnalysisUsage(userId);

      if (!canUse) {
        throw new AppError(
          "QUOTA_EXCEEDED",
          "Analysis quota exceeded. Free/Free+ get 1 lifetime. Pro gets 3/day.",
          429
        );
      }

      // 2. Get user, session, and messages
      const [userDoc, sessionDoc, messagesSnapshot] = await Promise.all([
        getDb().collection("users").doc(userId).get(),
        getDb().collection("sessions").doc(sessionId).get(),
        getDb()
          .collection("messages")
          .where("sessionId", "==", sessionId)
          .orderBy("createdAt", "asc")
          .get(),
      ]);

      if (!userDoc.exists || !sessionDoc.exists) {
        throw new AppError("NOT_FOUND", "User or session not found", 404);
      }

      const user = userDoc.data() as UserDocument;
      const session = sessionDoc.data() as SessionDocument;

      if (session.userId !== userId) {
        throw new AppError("FORBIDDEN", "Not your session", 403);
      }

      // 3. Check minimum requirements (3 min OR 500 chars)
      const totalChars = messagesSnapshot.docs
        .map(d => d.data() as MessageDocument)
        .filter(m => m.role === "user")
        .reduce((sum, m) => sum + m.content.length, 0);

      const totalMinutes = Math.floor(session.totalDurationSeconds / 60);

      if (totalMinutes < 3 && totalChars < 500) {
        throw new AppError(
          "INSUFFICIENT_DATA",
          `Need 3+ minutes OR 500+ characters. You have ${totalMinutes}분 / ${totalChars}자`,
          400
        );
      }

      // 4. Build conversation for analysis
      const conversation = messagesSnapshot.docs
        .map(doc => {
          const msg = doc.data() as MessageDocument;
          return `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`;
        })
        .join("\n");

      const prompt = `Analyze this Korean language learner's conversation and provide detailed feedback.

CONVERSATION:
${conversation}

USER LEVEL: ${session.formalityLevel}
NATIVE LANGUAGE: ${user.nativeLanguage}

Provide detailed analysis in JSON format:
{
  "pronunciation": {
    "score": 75,
    "feedback": ["Strong points", "Areas to improve"]
  },
  "vocabulary": {
    "score": 82,
    "feedback": ["Good usage examples", "Suggested new words"]
  },
  "grammar": {
    "score": 68,
    "feedback": ["Correct patterns used", "Common mistakes"]
  },
  "fluency": {
    "score": 80,
    "feedback": ["Natural flow", "Hesitation points"]
  },
  "suggestions": [
    "Practice more -았/었어요 endings",
    "Try using 그런데 instead of 그리고",
    "Learn casual particle dropping (친구처럼 말할 때)"
  ]
}

Scores are 0-100. Be encouraging but honest. Focus on actionable feedback.`;

      // 5. Call Claude for analysis
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 2048,
        messages: [{role: "user", content: prompt}],
      });

      const aiText = response.content[0].type === "text" ? response.content[0].text : "{}";

      // Parse JSON
      let analysis;
      try {
        analysis = JSON.parse(aiText);
      } catch {
        // Fallback
        analysis = {
          pronunciation: {score: 75, feedback: ["분석 중 오류 발생"]},
          vocabulary: {score: 75, feedback: ["분석 중 오류 발생"]},
          grammar: {score: 75, feedback: ["분석 중 오류 발생"]},
          fluency: {score: 75, feedback: ["분석 중 오류 발생"]},
          suggestions: ["다시 시도해주세요"],
        };
      }

      // 6. Increment usage
      await incrementAnalysisUsage(userId, user.subscriptionTier);

      // 7. Usage info
      let usageInfo = "";
      let canAnalyzeAgain = true;

      if (user.subscriptionTier === "free" || user.subscriptionTier === "free+") {
        usageInfo = "평생 1회 분석 사용 완료";
        canAnalyzeAgain = false;
      } else if (user.subscriptionTier === "pro") {
        const used = (user.dailyAnalysisUsed || 0) + 1;
        usageInfo = `오늘 ${used}/3회 분석 사용`;
        canAnalyzeAgain = used < 3;
      } else if (user.subscriptionTier === "pro+") {
        const used = (user.dailyAnalysisUsed || 0) + 1;
        usageInfo = `오늘 ${used}/7회 분석 사용`;
        canAnalyzeAgain = used < 7;
      }

      return {
        ...analysis,
        canAnalyzeAgain,
        usageInfo,
      };
    } catch (error: any) {
      functions.logger.error("Detailed analysis error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "ANALYSIS_ERROR",
        `Failed to analyze: ${error.message}`,
        500
      );
    }
  }
);
