/**
 * Content Selector
 * Select content based on learning style and goals
 */

export type LearningStyle = "visual" | "auditory" | "reading" | "kinesthetic";
export type LearningGoal =
  | "travel"
  | "kpop"
  | "kdrama"
  | "business"
  | "other";

export interface ContentStrategy {
  format: string;
  tools: string[];
  ratio: Record<string, number>;
}

export interface CulturalContent {
  type: string;
  suggestions: any[];
}

export class ContentSelector {
  /**
   * Get content strategy for learning style
   */
  static getContentForStyle(
    style: LearningStyle,
    topic: string
  ): ContentStrategy {
    const strategies: Record<LearningStyle, ContentStrategy> = {
      visual: {
        format: "image_heavy",
        tools: ["flashcards", "infographics", "video_clips", "charts"],
        ratio: { visual: 0.6, text: 0.2, audio: 0.2 },
      },
      auditory: {
        format: "audio_heavy",
        tools: [
          "audio_lessons",
          "songs",
          "pronunciation_drills",
          "podcasts",
        ],
        ratio: { audio: 0.6, visual: 0.2, text: 0.2 },
      },
      reading: {
        format: "text_heavy",
        tools: [
          "articles",
          "dialogues",
          "written_exercises",
          "text_analysis",
        ],
        ratio: { text: 0.6, visual: 0.2, audio: 0.2 },
      },
      kinesthetic: {
        format: "interactive",
        tools: ["games", "quizzes", "role_play", "drag_drop", "simulations"],
        ratio: { interactive: 0.6, visual: 0.2, audio: 0.2 },
      },
    };

    return strategies[style];
  }

  /**
   * Get vocabulary set for goal
   */
  static getVocabForGoal(goal: LearningGoal): string[] {
    const vocabSets: Record<LearningGoal, string[]> = {
      travel: [
        "공항",
        "호텔",
        "택시",
        "지하철",
        "식당",
        "예약하다",
        "얼마예요",
        "어디예요",
        "도와주세요",
        "화장실",
        "길",
        "지도",
        "관광",
        "사진",
        "맛있다",
      ],
      kpop: [
        "사랑",
        "마음",
        "꿈",
        "별",
        "하늘",
        "노래",
        "춤",
        "무대",
        "팬",
        "콘서트",
        "가사",
        "멜로디",
        "리듬",
        "감정",
        "행복",
      ],
      kdrama: [
        "오빠",
        "언니",
        "친구",
        "가족",
        "사랑하다",
        "미안해",
        "고마워",
        "괜찮아",
        "같이",
        "혼자",
        "회사",
        "학교",
        "집",
        "이야기",
        "드라마",
      ],
      business: [
        "회의",
        "보고서",
        "이메일",
        "계약",
        "협상",
        "제안하다",
        "검토하다",
        "승인하다",
        "진행하다",
        "회사",
        "직원",
        "상사",
        "동료",
        "프로젝트",
        "마감일",
      ],
      other: [
        "안녕하세요",
        "감사합니다",
        "죄송합니다",
        "네",
        "아니요",
        "이름",
        "나이",
        "직업",
        "취미",
        "좋아하다",
      ],
    };

    return vocabSets[goal] || vocabSets.other;
  }

  /**
   * Get grammar points for level
   */
  static getGrammarForLevel(level: string): string[] {
    const grammarSets: Record<string, string[]> = {
      beginner: [
        "은/는 (topic marker)",
        "이/가 (subject marker)",
        "을/를 (object marker)",
        "입니다/입니까 (to be)",
        "있다/없다 (to have/exist)",
      ],
      elementary: [
        "-아/어요 (polite ending)",
        "-고 (and)",
        "-지만 (but)",
        "-(으)ㄹ 수 있다 (can)",
        "-고 싶다 (want to)",
      ],
      intermediate: [
        "-(으)면 (if)",
        "-아/어서 (because)",
        "-(으)니까 (because)",
        "-는데 (but/background)",
        "-(으)ㄹ 거예요 (will)",
      ],
      advanced: [
        "-(으)ㄴ/는/(으)ㄹ (modifiers)",
        "-기 때문에 (because)",
        "-(으)면서 (while)",
        "-도록 (so that)",
        "-(으)ㄴ/는 것 같다 (seems)",
      ],
    };

    return grammarSets[level] || grammarSets.beginner;
  }

  /**
   * Get cultural content for goal
   */
  static getCulturalContent(goal: LearningGoal): CulturalContent | null {
    const content: Record<LearningGoal, CulturalContent> = {
      kpop: {
        type: "music",
        suggestions: [
          {
            artist: "BTS",
            song: "Dynamite",
            difficulty: "beginner",
            vocab: ["light", "energy", "dance"],
          },
          {
            artist: "Blackpink",
            song: "How You Like That",
            difficulty: "intermediate",
            vocab: ["confidence", "power", "style"],
          },
          {
            artist: "IU",
            song: "Good Day",
            difficulty: "advanced",
            vocab: ["emotions", "seasons", "memories"],
          },
        ],
      },
      kdrama: {
        type: "tv",
        suggestions: [
          {
            title: "사랑의 불시착",
            difficulty: "intermediate",
            genre: "romance",
            vocab: ["love", "family", "North Korea"],
          },
          {
            title: "이태원 클라쓰",
            difficulty: "advanced",
            genre: "business",
            vocab: ["business", "revenge", "friendship"],
          },
          {
            title: "스타트업",
            difficulty: "intermediate",
            genre: "startup",
            vocab: ["technology", "dreams", "competition"],
          },
        ],
      },
      travel: {
        type: "places",
        suggestions: [
          {
            location: "서울",
            attractions: ["경복궁", "명동", "강남", "N서울타워"],
            phrases: [
              "여기가 어디예요?",
              "얼마예요?",
              "사진 찍어주세요",
            ],
          },
          {
            location: "부산",
            attractions: ["해운대", "자갈치시장", "감천문화마을"],
            phrases: ["맛있어요", "바다가 예뻐요", "어떻게 가요?"],
          },
        ],
      },
      business: {
        type: "scenarios",
        suggestions: [
          {
            scenario: "회의",
            phrases: [
              "안건을 설명드리겠습니다",
              "의견 있으신 분?",
              "검토 후 회신드리겠습니다",
            ],
          },
          {
            scenario: "이메일",
            phrases: [
              "안녕하세요, ○○입니다",
              "첨부파일 확인 부탁드립니다",
              "감사합니다",
            ],
          },
        ],
      },
      other: {
        type: "general",
        suggestions: [
          {
            topic: "일상 대화",
            phrases: [
              "안녕하세요",
              "오늘 날씨가 좋네요",
              "뭐 하세요?",
            ],
          },
        ],
      },
    };

    return content[goal] || null;
  }

  /**
   * Get example sentences for topic
   */
  static getExampleSentences(
    goal: LearningGoal,
    level: string
  ): string[] {
    const examples: Record<string, Record<string, string[]>> = {
      travel: {
        beginner: [
          "공항이 어디예요?",
          "택시 타고 싶어요.",
          "얼마예요?",
        ],
        elementary: [
          "호텔 예약했어요.",
          "식당 추천해 주세요.",
          "길을 잃어버렸어요.",
        ],
        intermediate: [
          "명동에 가고 싶은데 어떻게 가요?",
          "이 근처에 맛있는 식당이 있어요?",
          "관광지를 추천해 주실 수 있나요?",
        ],
      },
      kpop: {
        beginner: [
          "이 노래 좋아해요.",
          "누구 팬이에요?",
          "같이 들어요.",
        ],
        elementary: [
          "가사를 이해하고 싶어요.",
          "이 노래 의미가 뭐예요?",
          "따라 부르고 싶어요.",
        ],
        intermediate: [
          "이 가사가 정말 감동적이에요.",
          "멜로디와 가사가 잘 어울려요.",
          "이 노래를 듣고 힘을 얻어요.",
        ],
      },
    };

    return examples[goal]?.[level] || ["안녕하세요", "감사합니다", "잘 지내요"];
  }

  /**
   * Get recommended lesson topics
   */
  static getRecommendedTopics(
    goal: LearningGoal,
    level: string
  ): string[] {
    const topics: Record<LearningGoal, string[]> = {
      travel: [
        "공항 입국",
        "호텔 체크인",
        "식당 주문",
        "길 찾기",
        "쇼핑하기",
        "관광지 방문",
      ],
      kpop: [
        "가사 이해하기",
        "감정 표현",
        "은유와 비유",
        "노래 따라하기",
        "팬미팅 대화",
      ],
      kdrama: [
        "일상 대화",
        "감정 표현",
        "직장 용어",
        "연애 표현",
        "가족 호칭",
      ],
      business: [
        "회의 진행",
        "이메일 작성",
        "보고서 발표",
        "협상 기술",
        "네트워킹",
      ],
      other: [
        "자기소개",
        "일상 대화",
        "취미 이야기",
        "날씨 대화",
        "계획 말하기",
      ],
    };

    return topics[goal] || topics.other;
  }
}
