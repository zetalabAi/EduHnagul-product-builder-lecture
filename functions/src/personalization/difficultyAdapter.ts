/**
 * Difficulty Adapter
 * Adjust content difficulty based on user level
 */

export type UserLevel = "beginner" | "elementary" | "intermediate" | "advanced";

export class DifficultyAdapter {
  /**
   * Calculate difficulty score (0-1) from user level
   */
  static calculateDifficulty(userLevel: UserLevel): number {
    const levelMap: Record<UserLevel, number> = {
      beginner: 0.3, // 30% difficulty
      elementary: 0.5, // 50%
      intermediate: 0.7, // 70%
      advanced: 0.9, // 90%
    };

    return levelMap[userLevel] || 0.5;
  }

  /**
   * Get level from difficulty score
   */
  static getLevelFromDifficulty(difficulty: number): UserLevel {
    if (difficulty < 0.4) return "beginner";
    if (difficulty < 0.6) return "elementary";
    if (difficulty < 0.8) return "intermediate";
    return "advanced";
  }

  /**
   * Adjust prompt difficulty
   */
  static adjustPromptDifficulty(
    basePrompt: string,
    difficulty: number,
    learningStyle?: string
  ): string {
    let difficultyGuidelines = "";

    if (difficulty < 0.4) {
      // Beginner
      difficultyGuidelines = `
【난이도: 초급】
- 짧은 문장 사용 (3-5 단어)
- 기본 어휘만 사용 (한자어 최소화)
- 천천히, 명확하게 말하기
- 자주 반복하고 확인하기
- 한 번에 하나의 개념만 가르치기
- 영어 번역 자주 제공
- 격려와 칭찬 많이 하기`;
    } else if (difficulty < 0.6) {
      // Elementary
      difficultyGuidelines = `
【난이도: 기초】
- 일반적인 문장 길이 (5-8 단어)
- 일상 어휘 사용
- 자연스러운 속도로 말하기
- 필요시 설명 추가
- 간단한 문법 설명 포함
- 예시를 통한 학습
- 긍정적인 피드백`;
    } else if (difficulty < 0.8) {
      // Intermediate
      difficultyGuidelines = `
【난이도: 중급】
- 자연스러운 문장 (8-12 단어)
- 다양한 어휘 및 표현
- 정상 속도로 대화
- 문법 설명 더 상세히
- 관용구와 속담 소개
- 문화적 맥락 설명
- 실수 교정과 개선 제안`;
    } else {
      // Advanced
      difficultyGuidelines = `
【난이도: 고급】
- 긴 문장과 복잡한 구조
- 고급 어휘, 한자어, 관용구
- 빠른 속도로 자연스럽게
- 문화적 뉘앙스 포함
- 추상적 개념 논의
- 다양한 표현 방식 제시
- 미묘한 차이점 설명`;
    }

    // Add learning style specific guidelines
    let styleGuidelines = "";
    if (learningStyle) {
      const styleGuides: Record<string, string> = {
        visual: `
【Visual 학습자】
- "이것을 보세요", "이미지로 보면", "색깔로 구분하면" 등의 표현 사용
- 그림/도표로 설명하겠다고 언급
- 시각적 비유 사용 (예: "이 문법은 레고 블록처럼...")`,

        auditory: `
【Auditory 학습자】
- "들어보세요", "발음을 따라해보세요" 등의 표현 사용
- 리듬과 음성 패턴 강조
- 노래나 리듬으로 암기 제안
- 소리내어 읽기 권장`,

        reading: `
【Reading 학습자】
- 글로 된 설명 제공
- "이렇게 쓰면...", "텍스트로 보면..." 등의 표현
- 문법 규칙을 명확히 설명
- 쓰기 연습 권장`,

        kinesthetic: `
【Kinesthetic 학습자】
- "직접 해봅시다", "연습해봐요" 등의 표현
- 게임/퀴즈 형식 사용
- 역할극 제안
- 실제 상황 시뮬레이션`,
      };

      styleGuidelines = styleGuides[learningStyle] || "";
    }

    return `${basePrompt}

${difficultyGuidelines}
${styleGuidelines}`;
  }

  /**
   * Adjust vocabulary difficulty
   */
  static filterVocabByLevel(
    vocabList: string[],
    level: UserLevel,
    maxCount: number = 10
  ): string[] {
    // In a real implementation, this would filter based on word frequency/difficulty
    // For now, we'll just limit the count based on level

    const countByLevel: Record<UserLevel, number> = {
      beginner: 5,
      elementary: 10,
      intermediate: 15,
      advanced: 20,
    };

    const count = Math.min(countByLevel[level], maxCount);
    return vocabList.slice(0, count);
  }

  /**
   * Get appropriate feedback style
   */
  static getFeedbackStyle(level: UserLevel): {
    errorTolerance: number;
    correctionStyle: string;
    encouragementLevel: string;
  } {
    const styles: Record<
      UserLevel,
      {
        errorTolerance: number;
        correctionStyle: string;
        encouragementLevel: string;
      }
    > = {
      beginner: {
        errorTolerance: 0.8, // Very forgiving
        correctionStyle: "gentle", // Don't interrupt, correct after
        encouragementLevel: "high", // Lots of praise
      },
      elementary: {
        errorTolerance: 0.6,
        correctionStyle: "supportive", // Point out major errors
        encouragementLevel: "medium",
      },
      intermediate: {
        errorTolerance: 0.4,
        correctionStyle: "constructive", // Detailed corrections
        encouragementLevel: "moderate",
      },
      advanced: {
        errorTolerance: 0.2,
        correctionStyle: "precise", // Point out subtle mistakes
        encouragementLevel: "low", // Focus on improvement
      },
    };

    return styles[level];
  }

  /**
   * Get sentence complexity guidelines
   */
  static getSentenceComplexity(level: UserLevel): {
    avgWordCount: number;
    clausesPerSentence: number;
    allowedGrammarPoints: number;
  } {
    const complexity: Record<
      UserLevel,
      {
        avgWordCount: number;
        clausesPerSentence: number;
        allowedGrammarPoints: number;
      }
    > = {
      beginner: {
        avgWordCount: 4,
        clausesPerSentence: 1,
        allowedGrammarPoints: 1,
      },
      elementary: {
        avgWordCount: 7,
        clausesPerSentence: 1,
        allowedGrammarPoints: 2,
      },
      intermediate: {
        avgWordCount: 10,
        clausesPerSentence: 2,
        allowedGrammarPoints: 3,
      },
      advanced: {
        avgWordCount: 15,
        clausesPerSentence: 3,
        allowedGrammarPoints: 5,
      },
    };

    return complexity[level];
  }
}
