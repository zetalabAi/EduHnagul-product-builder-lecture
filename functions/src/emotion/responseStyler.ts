/**
 * Response Styler
 * 감정 기반 응답 스타일 조정 시스템
 *
 * 목표: 사용자의 감정 상태에 맞는 응답 제공
 * - 스트레스 → 격려 + 난이도 낮춤
 * - 흥분 → 도전 + 칭찬
 * - 피곤 → 짧고 간단한 응답
 * - 긍정 → 유지 + 강화
 * - 부정 → 공감 + 지원
 */

import { EmotionType, EmotionResult } from "./emotionAnalyzer";

export interface StyledResponse {
  tone: string; // 응답 톤 설명
  encouragement?: string; // 격려 메시지
  difficultyAdjustment: number; // 난이도 조정 제안 (-0.2 ~ +0.2)
  responseLength: "short" | "medium" | "long"; // 응답 길이
  includeHumor: boolean; // 유머 포함 여부
  includeEmoji: boolean; // 이모지 포함 여부
  systemPromptAddition: string; // AI 튜터에게 전달할 추가 지침
}

export class ResponseStyler {
  /**
   * 감정에 맞는 응답 스타일 생성
   */
  static styleResponse(emotion: EmotionResult): StyledResponse {
    switch (emotion.primary) {
      case "stressed":
        return this.stressedStyle(emotion);
      case "excited":
        return this.excitedStyle(emotion);
      case "tired":
        return this.tiredStyle(emotion);
      case "positive":
        return this.positiveStyle(emotion);
      case "negative":
        return this.negativeStyle(emotion);
      case "neutral":
      default:
        return this.neutralStyle(emotion);
    }
  }

  /**
   * 스트레스/불안 상태 응답 스타일
   */
  private static stressedStyle(emotion: EmotionResult): StyledResponse {
    const encouragements = [
      "천천히 하나씩 해봐요. 괜찮아요! 😊",
      "어려워도 괜찮아요. 함께 차근차근 풀어봐요.",
      "긴장하지 마세요. 실수는 배움의 일부예요!",
      "잘하고 있어요. 조금만 더 여유를 가져봐요.",
      "완벽하지 않아도 돼요. 노력하는 모습이 멋져요!",
    ];

    return {
      tone: "gentle-supportive",
      encouragement: this.randomChoice(encouragements),
      difficultyAdjustment: emotion.intensity > 0.7 ? -0.15 : -0.1,
      responseLength: "medium",
      includeHumor: false,
      includeEmoji: true,
      systemPromptAddition: `사용자가 현재 스트레스를 받고 있습니다.
- 매우 부드럽고 격려하는 톤을 사용하세요.
- 복잡한 설명보다 간단하고 명확한 단계별 지침을 제공하세요.
- "잘하고 있어요", "괜찮아요" 같은 안심시키는 말을 자주 사용하세요.
- 난이도를 낮추고, 더 쉬운 예시로 설명하세요.`,
    };
  }

  /**
   * 흥분/열정 상태 응답 스타일
   */
  private static excitedStyle(emotion: EmotionResult): StyledResponse {
    const encouragements = [
      "와! 정말 열정적이네요! 계속 이 기세로 가봐요! 🔥",
      "에너지가 넘치는데요? 도전적인 문제를 풀어볼까요?",
      "이 의욕이면 금방 마스터하겠는걸요! 🚀",
      "완전 집중 모드네요! 더 재밌는 걸 해봐요!",
      "열정 최고! 이 속도면 레벨업 곧 하겠어요! ⭐",
    ];

    return {
      tone: "energetic-challenging",
      encouragement: this.randomChoice(encouragements),
      difficultyAdjustment: emotion.intensity > 0.7 ? +0.15 : +0.1,
      responseLength: "long",
      includeHumor: true,
      includeEmoji: true,
      systemPromptAddition: `사용자가 현재 매우 흥분하고 열정적입니다.
- 에너지 넘치는 톤으로 응답하세요.
- 도전적이고 재미있는 문제를 제시하세요.
- 칭찬과 격려를 많이 사용하세요.
- 난이도를 약간 높여 도전 욕구를 자극하세요.
- "와!", "대박!", "멋져요!" 같은 감탄사를 사용하세요.`,
    };
  }

  /**
   * 피곤/지침 상태 응답 스타일
   */
  private static tiredStyle(emotion: EmotionResult): StyledResponse {
    const encouragements = [
      "오늘 많이 피곤하신가봐요. 짧게 하고 쉬어요! 😴",
      "간단한 복습만 하고 쉬는 게 어때요?",
      "피곤할 땐 무리하지 말아요. 내일 더 잘할 수 있어요!",
      "지금은 쉬는 시간! 가벼운 내용만 할까요?",
      "충분히 휴식도 중요해요. 잠깐만 하고 쉬어요.",
    ];

    return {
      tone: "gentle-brief",
      encouragement: this.randomChoice(encouragements),
      difficultyAdjustment: -0.1,
      responseLength: "short",
      includeHumor: false,
      includeEmoji: true,
      systemPromptAddition: `사용자가 현재 피곤한 상태입니다.
- 응답을 짧고 간결하게 유지하세요.
- 복잡한 새 내용보다 간단한 복습을 제안하세요.
- 부담 주지 않는 톤을 사용하세요.
- 필요시 휴식을 권장하세요.
- "무리하지 마세요", "쉬어도 괜찮아요" 같은 배려를 보여주세요.`,
    };
  }

  /**
   * 긍정/즐거움 상태 응답 스타일
   */
  private static positiveStyle(emotion: EmotionResult): StyledResponse {
    const encouragements = [
      "좋은 컨디션이네요! 오늘 많이 배워봐요! 😊",
      "기분 좋은 하루! 즐겁게 공부해봐요!",
      "완벽한 학습 상태예요! 계속 가봐요!",
      "이 기분 그대로 쭉 가요! 응원해요! ✨",
      "긍정 에너지가 느껴져요! 멋져요!",
    ];

    return {
      tone: "friendly-positive",
      encouragement: this.randomChoice(encouragements),
      difficultyAdjustment: 0,
      responseLength: "medium",
      includeHumor: true,
      includeEmoji: true,
      systemPromptAddition: `사용자가 현재 긍정적이고 즐거운 상태입니다.
- 친근하고 밝은 톤을 사용하세요.
- 현재 난이도를 유지하세요.
- 격려와 칭찬을 적절히 섞어주세요.
- 재미있는 예시나 가벼운 유머를 사용해도 좋습니다.
- 사용자의 좋은 기분을 유지시켜주세요.`,
    };
  }

  /**
   * 부정/좌절 상태 응답 스타일
   */
  private static negativeStyle(emotion: EmotionResult): StyledResponse {
    const encouragements = [
      "괜찮아요. 어려울 수 있어요. 함께 해결해봐요. 💪",
      "좌절하지 마세요. 모두 이 과정을 거쳐요.",
      "실수는 성장의 기회예요. 다시 시도해봐요!",
      "힘들어도 포기하지 마세요. 당신은 할 수 있어요!",
      "지금은 어렵지만, 곧 쉬워질 거예요. 함께 해요!",
    ];

    return {
      tone: "empathetic-supportive",
      encouragement: this.randomChoice(encouragements),
      difficultyAdjustment: emotion.intensity > 0.7 ? -0.2 : -0.15,
      responseLength: "medium",
      includeHumor: false,
      includeEmoji: true,
      systemPromptAddition: `사용자가 현재 좌절감을 느끼고 있습니다.
- 공감하는 톤으로 응답하세요.
- "괜찮아요", "충분히 그럴 수 있어요" 같은 위로를 먼저 하세요.
- 난이도를 낮추고 더 쉬운 단계부터 시작하세요.
- 사용자의 노력을 인정하고 격려하세요.
- 작은 성공을 만들어서 자신감을 회복시켜주세요.`,
    };
  }

  /**
   * 중립/평온 상태 응답 스타일
   */
  private static neutralStyle(emotion: EmotionResult): StyledResponse {
    return {
      tone: "balanced-professional",
      encouragement: undefined,
      difficultyAdjustment: 0,
      responseLength: "medium",
      includeHumor: false,
      includeEmoji: false,
      systemPromptAddition: `사용자가 현재 중립적이고 평온한 상태입니다.
- 전문적이고 균형 잡힌 톤을 사용하세요.
- 현재 난이도를 유지하세요.
- 과도한 감정 표현 없이 효율적으로 가르치세요.
- 필요한 정보를 명확하고 체계적으로 전달하세요.`,
    };
  }

  /**
   * 감정 기반 시스템 프롬프트 생성
   */
  static generateEmotionAwarePrompt(emotion: EmotionResult): string {
    const style = this.styleResponse(emotion);
    const emotionLabel = this.getEmotionDescription(emotion);

    return `
[감정 인식 모드 활성화]

현재 사용자 감정 상태:
- 주 감정: ${emotionLabel}
- 강도: ${Math.round(emotion.intensity * 100)}%
- 신뢰도: ${Math.round(emotion.confidence * 100)}%

응답 스타일 지침:
${style.systemPromptAddition}

${style.encouragement ? `격려 메시지: "${style.encouragement}"` : ""}

응답 시 주의사항:
- 응답 길이: ${style.responseLength === "short" ? "짧게 (1-2문장)" : style.responseLength === "long" ? "길게 (4-5문장)" : "보통 (2-3문장)"}
- 이모지 사용: ${style.includeEmoji ? "적극 활용" : "최소화"}
- 유머 사용: ${style.includeHumor ? "적절히 사용" : "사용 안 함"}
${
  style.difficultyAdjustment !== 0
    ? `- 난이도 조절: ${style.difficultyAdjustment > 0 ? "약간 높임" : "약간 낮춤"}`
    : ""
}

위 지침을 따라 사용자에게 맞춤형 응답을 제공하세요.
`;
  }

  /**
   * 감정 설명 생성
   */
  private static getEmotionDescription(emotion: EmotionResult): string {
    const labels: Record<EmotionType, string> = {
      stressed: "스트레스/불안 😰",
      excited: "흥분/열정 🤩",
      tired: "피곤/지침 😴",
      positive: "긍정/즐거움 😊",
      negative: "부정/좌절 😔",
      neutral: "중립/평온 😐",
    };

    let description = labels[emotion.primary];

    if (emotion.secondaryEmotions && emotion.secondaryEmotions.length > 0) {
      const secondary = emotion.secondaryEmotions[0];
      description += ` (부차적: ${labels[secondary.emotion]})`;
    }

    return description;
  }

  /**
   * 배열에서 랜덤 선택
   */
  private static randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * 감정 기반 힌트 스타일 조정
   */
  static adjustHintStyle(
    baseHint: string,
    emotion: EmotionType
  ): string {
    switch (emotion) {
      case "stressed":
        return `💡 힌트: ${baseHint}\n\n천천히 생각해봐요. 시간 제한 없어요! 😊`;

      case "excited":
        return `🔥 힌트: ${baseHint}\n\n이 에너지면 금방 풀겠는데요? 💪`;

      case "tired":
        return `💡 ${baseHint}\n\n피곤할 땐 힌트 많이 써도 괜찮아요!`;

      case "positive":
        return `✨ 힌트: ${baseHint}\n\n좋은 컨디션이니 조금만 더 생각해봐요!`;

      case "negative":
        return `💙 힌트: ${baseHint}\n\n괜찮아요. 어려울 수 있어요. 한 단계씩 가봐요!`;

      case "neutral":
      default:
        return `힌트: ${baseHint}`;
    }
  }

  /**
   * 감정 기반 오류 메시지 조정
   */
  static adjustErrorMessage(
    baseError: string,
    emotion: EmotionType
  ): string {
    switch (emotion) {
      case "stressed":
        return `괜찮아요! 실수는 배움의 과정이에요. 😊\n\n${baseError}\n\n천천히 다시 시도해봐요!`;

      case "excited":
        return `아! 아쉽네요! 하지만 이 열정이면 금방 해낼 거예요! 🔥\n\n${baseError}\n\n다시 도전해봐요!`;

      case "tired":
        return `피곤할 때 실수할 수 있어요.\n\n${baseError}\n\n쉬고 다음에 해도 괜찮아요!`;

      case "positive":
        return `오! 아쉽지만 거의 다 왔어요!\n\n${baseError}\n\n조금만 수정하면 될 것 같아요!`;

      case "negative":
        return `힘내요! 모두 이런 실수를 해요. 당신만 그런 게 아니에요. 💪\n\n${baseError}\n\n함께 다시 해봐요!`;

      case "neutral":
      default:
        return baseError;
    }
  }
}
