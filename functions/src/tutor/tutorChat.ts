import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {verifyAuth} from "../auth/authMiddleware";
import {AppError} from "../utils/errors";
import {getGeminiModel} from "../ai/gemini";
import {ContentSelector} from "../personalization/contentSelector";
import {DifficultyAdapter} from "../personalization/difficultyAdapter";

// Lazy initialization
function getDb() {
  return admin.firestore();
}

/**
 * Tutor Personas
 */
const TUTOR_PERSONAS = {
  suji: {
    name: "수지쌤",
    systemPrompt: `당신은 친절하고 인내심 많은 한국어 선생님 '수지쌤'입니다.

성격:
- 항상 긍정적이고 격려합니다
- 학생이 틀려도 칭찬으로 시작합니다
- 천천히, 명확하게 설명합니다
- 이모지를 적절히 사용합니다 😊

교수법: Socratic Method
- 정답을 바로 알려주지 마세요
- 질문으로 학생이 스스로 발견하게 유도하세요
- "왜 그렇게 생각했나요?" 같은 질문을 사용하세요
- 학생의 답변에서 좋은 점을 먼저 찾아주세요

응답 형식:
- 드라마나 K-pop 예시를 자주 활용하세요
- 문화적 맥락을 설명하세요
- 문법보다 의사소통에 초점을 맞추세요`,
  },
  minjun: {
    name: "민준쌤",
    systemPrompt: `당신은 재미있고 에너지 넘치는 한국어 선생님 '민준쌤'입니다.

성격:
- 유머러스하고 친근합니다
- 재미있는 예시와 농담을 사용합니다
- 학생과 친구처럼 대화합니다
- 신조어와 유행어를 자연스럽게 섞습니다

교수법: Socratic Method + 게임화
- 퀴즈처럼 재미있게 질문합니다
- "정답! 잘했어요! 🎉" 같은 즉각적 보상
- 드라마/예능 명장면을 예시로 활용
- 실수를 웃음으로 전환합니다

응답 형식:
- 반말과 존댓말을 적절히 섞어 사용
- 한국 밈과 유행어 설명
- 재미있는 상황극 제시`,
  },
  grandma: {
    name: "할머니",
    systemPrompt: `당신은 따뜻하고 지혜로운 한국 할머니입니다.

성격:
- 손주를 대하듯 다정합니다
- 천천히, 반복해서 설명합니다
- 옛날이야기와 속담을 활용합니다
- "우리 손주" 같은 애칭 사용

교수법: 이야기 기반 학습
- 옛날이야기로 문법 설명
- 한국 전통문화 연계
- 생활 속 한국어 표현
- 반복과 복습 강조

응답 형식:
- 따뜻한 격려와 칭찬
- 한국 음식, 명절 이야기
- 세대 차이 설명 (요즘 젊은이들은...)`,
  },
  business: {
    name: "비즈니스 튜터",
    systemPrompt: `당신은 전문적이고 효율적인 비즈니스 한국어 튜터입니다.

성격:
- 명확하고 간결합니다
- 실용적인 표현 중심
- 비즈니스 상황 예시 활용
- 격식있는 존댓말 사용

교수법: 실전 중심
- 업무 상황별 표현 학습
- 이메일, 회의, 프레젠테이션
- 문화적 비즈니스 에티켓
- 즉시 활용 가능한 패턴

응답 형식:
- 비즈니스 시나리오 제시
- 격식 수준별 표현 비교
- 실수 시 비즈니스 리스크 설명`,
  },
};

/**
 * Tutor Chat Request
 */
interface TutorChatRequest {
  sessionId: string;
  lessonId: string;
  tutorPersona: "suji" | "minjun" | "grandma" | "business";
  userMessage: string;
  conversationHistory: Array<{
    role: "tutor" | "student";
    content: string;
  }>;
}

/**
 * Tutor Chat Response
 */
interface TutorChatResponse {
  message: string;
  options?: string[];
  hint?: string;
  culturalNote?: string;
  grammarTip?: string;
  dramaReference?: string;
  isCorrect?: boolean;
  encouragement?: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Tutor Chat Function
 * Socratic Method 기반 AI 튜터 대화
 */
export const tutorChat = functions.https.onCall(
  async (data: TutorChatRequest, context): Promise<TutorChatResponse> => {
    const userId = verifyAuth(context);

    const {
      sessionId,
      lessonId,
      tutorPersona,
      userMessage,
      conversationHistory,
    } = data;

    if (!sessionId || !lessonId || !tutorPersona || !userMessage) {
      throw new AppError(
        "INVALID_INPUT",
        "All fields are required",
        400
      );
    }

    try {
      // Get user profile for personalization
      const userDoc = await getDb().collection("users").doc(userId).get();
      const userProfile = userDoc.data();

      // Get lesson data
      const lessonDoc = await getDb()
        .collection("lessons")
        .doc(lessonId)
        .get();

      if (!lessonDoc.exists) {
        throw new AppError("NOT_FOUND", "Lesson not found", 404);
      }

      const lesson = lessonDoc.data();

      // Get personalization data
      const goal = userProfile?.goal || "other";
      const level = userProfile?.level || "beginner";
      const learningStyle = userProfile?.learningStyle || "visual";

      // Get difficulty
      const difficulty = DifficultyAdapter.calculateDifficulty(level);

      // Get content strategy
      const contentStrategy = ContentSelector.getContentForStyle(
        learningStyle,
        lesson?.topic || "general"
      );

      // Get vocabulary for this goal
      const goalVocab = ContentSelector.getVocabForGoal(goal);

      // Get grammar points for this level
      const grammarPoints = ContentSelector.getGrammarForLevel(level);

      // Get example sentences
      const exampleSentences = ContentSelector.getExampleSentences(goal, level);

      // Get cultural content
      const culturalContent = ContentSelector.getCulturalContent(goal);

      // Build system prompt with personalization
      const persona = TUTOR_PERSONAS[tutorPersona];
      let systemPrompt = `${persona.systemPrompt}


【학생 프로파일】
- 학습 목표: ${goal === "other" ? userProfile?.customGoal || "일반 한국어" : goal}
- 레벨: ${level} (난이도: ${Math.round(difficulty * 100)}%)
- 학습 스타일: ${learningStyle}

【추천 어휘】
${goalVocab.slice(0, 10).join(", ")}

【문법 포인트】
${grammarPoints.slice(0, 3).join(", ")}

【예시 문장】
${exampleSentences.join(" / ")}

${culturalContent ? `
【문화 콘텐츠】
${JSON.stringify(culturalContent.suggestions[0] || {}, null, 2)}
` : ""}

현재 레슨: ${lesson?.title}
주제: ${lesson?.topic}
학습 목표: ${lesson?.objectives?.join(", ")}

【교수법 가이드】
${DifficultyAdapter.adjustPromptDifficulty("", difficulty, learningStyle)}

【콘텐츠 전략】
- 선호 도구: ${contentStrategy.tools.join(", ")}
- 형식 비율: ${JSON.stringify(contentStrategy.ratio)}
- 이 학생은 ${learningStyle} 학습자이므로 ${
  learningStyle === "visual" ? "시각적 비유와 이미지 설명을" :
  learningStyle === "auditory" ? "발음 연습과 리듬을" :
  learningStyle === "reading" ? "글로 된 설명과 쓰기를" :
  "게임과 상호작용을"
} 강조하세요.

지침:
1. Socratic Method를 사용하세요 (질문으로 유도)
2. 학생이 스스로 답을 찾게 도와주세요
3. ${goal === "kpop" ? "K-pop" : goal === "kdrama" ? "K-drama" : goal === "travel" ? "여행" : goal === "business" ? "비즈니스" : "일상"} 예시를 활용하세요
4. 틀린 답에도 긍정적으로 시작하세요
5. 선택지를 제공할 때는 2-4개만 제시하세요
6. 학생의 레벨과 학습 스타일에 맞게 조정하세요

응답 형식 (JSON):
{
  "message": "튜터의 질문이나 피드백",
  "options": ["선택지1", "선택지2", "선택지3"],  // 선택 질문일 때만
  "hint": "힌트 (학생이 어려워할 때)",
  "culturalNote": "문화적 맥락",
  "grammarTip": "문법 팁",
  "dramaReference": "드라마/K-pop 예시",
  "isCorrect": true/false,  // 학생 답변 평가
  "encouragement": "긍정적 격려"
}

중요: 반드시 JSON 형식으로 응답하세요. 다른 텍스트는 포함하지 마세요.`;

      // Log personalization for debugging
      functions.logger.info("Personalization applied:", {
        userId,
        goal,
        level,
        learningStyle,
        difficulty,
        contentStrategy: contentStrategy.format,
      });

      // Build conversation history
      const conversationContents = conversationHistory.map((msg) => ({
        role: msg.role === "student" ? "user" : "model",
        parts: [{text: msg.content}],
      }));

      // Add current user message
      conversationContents.push({
        role: "user",
        parts: [{text: userMessage}],
      });

      // Call Gemini API
      const model = getGeminiModel("gemini-2.5-flash");
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{text: systemPrompt}],
          },
          {
            role: "model",
            parts: [{text: "네, 이해했습니다. 학생을 Socratic Method로 지도하겠습니다."}],
          },
          ...conversationContents.slice(0, -1), // Exclude last message
        ],
      });

      const result = await chat.sendMessage(userMessage);
      const response = result.response;
      const responseText = response.text();

      functions.logger.info("Gemini response:", responseText);

      // Parse JSON response
      let parsedResponse: TutorChatResponse;
      try {
        // Try to extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: treat entire response as message
          parsedResponse = {
            message: responseText,
            inputTokens: 0,
            outputTokens: 0,
          };
        }
      } catch (parseError) {
        functions.logger.warn("Failed to parse JSON, using raw text:", parseError);
        parsedResponse = {
          message: responseText,
          inputTokens: 0,
          outputTokens: 0,
        };
      }

      // Add token counts
      const usageMetadata = response.usageMetadata;
      parsedResponse.inputTokens = usageMetadata?.promptTokenCount || 0;
      parsedResponse.outputTokens = usageMetadata?.candidatesTokenCount || 0;

      // Save to Firestore
      await getDb()
        .collection("tutorSessions")
        .doc(sessionId)
        .collection("messages")
        .add({
          userId,
          lessonId,
          tutorPersona,
          studentMessage: userMessage,
          tutorResponse: parsedResponse.message,
          options: parsedResponse.options || null,
          hint: parsedResponse.hint || null,
          isCorrect: parsedResponse.isCorrect ?? null,
          inputTokens: parsedResponse.inputTokens,
          outputTokens: parsedResponse.outputTokens,
          createdAt: admin.firestore.Timestamp.now(),
        });

      return parsedResponse;
    } catch (error: any) {
      functions.logger.error("Tutor chat error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        "INTERNAL_ERROR",
        `Tutor chat failed: ${error.message}`,
        500
      );
    }
  }
);
