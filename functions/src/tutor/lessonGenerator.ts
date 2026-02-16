import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {verifyAuth} from "../auth/authMiddleware";

// Lazy initialization
function getDb() {
  return admin.firestore();
}

/**
 * Predefined Lessons (1-50)
 * 실제로는 CMS나 별도 시스템에서 관리
 */
const LESSONS = [
  // Beginner (1-15)
  {
    id: "lesson-1",
    number: 1,
    title: "자기소개",
    topic: "Self Introduction",
    difficulty: 0.1,
    objectives: [
      "이름 말하기",
      "국적 말하기",
      "직업 소개하기",
    ],
    estimatedMinutes: 15,
    xpReward: 50,
  },
  {
    id: "lesson-2",
    number: 2,
    title: "인사하기",
    topic: "Greetings",
    difficulty: 0.1,
    objectives: [
      "안녕하세요 vs 안녕",
      "상황별 인사",
      "헤어질 때 인사",
    ],
    estimatedMinutes: 15,
    xpReward: 50,
  },
  {
    id: "lesson-3",
    number: 3,
    title: "존댓말과 반말",
    topic: "Formal vs Informal Speech",
    difficulty: 0.2,
    objectives: [
      "존댓말이 필요한 상황",
      "반말 사용 시기",
      "관계에 따른 말투",
    ],
    estimatedMinutes: 20,
    xpReward: 75,
  },
  {
    id: "lesson-4",
    number: 4,
    title: "카페에서 주문하기",
    topic: "Ordering at Cafe",
    difficulty: 0.2,
    objectives: [
      "메뉴 읽기",
      "주문 표현",
      "사이즈, 옵션 말하기",
    ],
    estimatedMinutes: 20,
    xpReward: 75,
  },
  {
    id: "lesson-5",
    number: 5,
    title: "숫자와 날짜",
    topic: "Numbers and Dates",
    difficulty: 0.25,
    objectives: [
      "고유어 숫자",
      "한자어 숫자",
      "날짜 표현",
    ],
    estimatedMinutes: 25,
    xpReward: 100,
  },

  // Intermediate (6-10 sample)
  {
    id: "lesson-6",
    number: 6,
    title: "길 물어보기",
    topic: "Asking for Directions",
    difficulty: 0.3,
    objectives: [
      "위치 표현",
      "방향 말하기",
      "거리 표현",
    ],
    estimatedMinutes: 20,
    xpReward: 100,
  },
  {
    id: "lesson-7",
    number: 7,
    title: "쇼핑하기",
    topic: "Shopping",
    difficulty: 0.3,
    objectives: [
      "가격 물어보기",
      "할인 표현",
      "교환/환불",
    ],
    estimatedMinutes: 25,
    xpReward: 125,
  },
  {
    id: "lesson-8",
    number: 8,
    title: "식당에서",
    topic: "At Restaurant",
    difficulty: 0.35,
    objectives: [
      "메뉴 추천 받기",
      "맛 표현하기",
      "계산하기",
    ],
    estimatedMinutes: 25,
    xpReward: 125,
  },
  {
    id: "lesson-9",
    number: 9,
    title: "K-드라마 표현",
    topic: "K-Drama Expressions",
    difficulty: 0.4,
    objectives: [
      "드라마 단골 표현",
      "감정 표현",
      "유행어",
    ],
    estimatedMinutes: 30,
    xpReward: 150,
  },
  {
    id: "lesson-10",
    number: 10,
    title: "전화 통화",
    topic: "Phone Conversation",
    difficulty: 0.4,
    objectives: [
      "전화 받기/끊기",
      "메시지 남기기",
      "약속 잡기",
    ],
    estimatedMinutes: 30,
    xpReward: 150,
  },

  // Intermediate Lessons (11-30)
  // Business Korean (11-18)
  {
    id: "lesson-11",
    number: 11,
    title: "직장에서의 회의 표현",
    topic: "Business Korean",
    difficulty: 0.5,
    objectives: [
      "회의 시작과 마무리 표현 익히기",
      "의견 제시 방법 배우기",
      "공손하게 반대 의견 말하기",
    ],
    estimatedMinutes: 30,
    xpReward: 160,
  },
  {
    id: "lesson-12",
    number: 12,
    title: "비즈니스 이메일 작성",
    topic: "Business Korean",
    difficulty: 0.5,
    objectives: [
      "공식 이메일 형식 배우기",
      "요청과 감사 표현하기",
      "전문적인 마무리 인사",
    ],
    estimatedMinutes: 30,
    xpReward: 170,
  },
  {
    id: "lesson-13",
    number: 13,
    title: "전화 업무 대화",
    topic: "Business Korean",
    difficulty: 0.5,
    objectives: [
      "업무 전화 받고 돌리기",
      "메시지 전달 표현",
      "약속 일정 조율하기",
    ],
    estimatedMinutes: 30,
    xpReward: 180,
  },
  {
    id: "lesson-14",
    number: 14,
    title: "프레젠테이션 기초",
    topic: "Business Korean",
    difficulty: 0.6,
    objectives: [
      "발표 시작과 자기소개",
      "내용 전환 표현",
      "질의응답 대응하기",
    ],
    estimatedMinutes: 35,
    xpReward: 190,
  },
  {
    id: "lesson-15",
    number: 15,
    title: "협상과 설득",
    topic: "Business Korean",
    difficulty: 0.6,
    objectives: [
      "제안하고 설득하기",
      "조건 제시 표현",
      "타협점 찾기",
    ],
    estimatedMinutes: 35,
    xpReward: 200,
  },
  {
    id: "lesson-16",
    number: 16,
    title: "업무 보고서 작성",
    topic: "Business Korean",
    difficulty: 0.6,
    objectives: [
      "보고서 구조 이해하기",
      "객관적 서술 표현",
      "결론 및 제안 작성",
    ],
    estimatedMinutes: 35,
    xpReward: 210,
  },
  {
    id: "lesson-17",
    number: 17,
    title: "고객 응대",
    topic: "Business Korean",
    difficulty: 0.6,
    objectives: [
      "정중한 고객 응대 표현",
      "불만 처리 화법",
      "감사 인사 전달",
    ],
    estimatedMinutes: 35,
    xpReward: 220,
  },
  {
    id: "lesson-18",
    number: 18,
    title: "면접 대비",
    topic: "Business Korean",
    difficulty: 0.7,
    objectives: [
      "자기소개 및 경력 설명",
      "장단점 표현하기",
      "포부와 계획 말하기",
    ],
    estimatedMinutes: 40,
    xpReward: 230,
  },

  // Travel Korean (19-24)
  {
    id: "lesson-19",
    number: 19,
    title: "공항과 출입국",
    topic: "Travel Korean",
    difficulty: 0.5,
    objectives: [
      "체크인 및 탑승 표현",
      "세관 신고 대화",
      "짐 찾기 및 분실 신고",
    ],
    estimatedMinutes: 30,
    xpReward: 240,
  },
  {
    id: "lesson-20",
    number: 20,
    title: "호텔 예약과 체크인",
    topic: "Travel Korean",
    difficulty: 0.5,
    objectives: [
      "객실 예약 표현",
      "체크인/아웃 절차",
      "편의시설 문의하기",
    ],
    estimatedMinutes: 30,
    xpReward: 250,
  },
  {
    id: "lesson-21",
    number: 21,
    title: "대중교통 이용",
    topic: "Travel Korean",
    difficulty: 0.5,
    objectives: [
      "지하철과 버스 표현",
      "택시 이용 회화",
      "길 묻고 설명하기",
    ],
    estimatedMinutes: 30,
    xpReward: 260,
  },
  {
    id: "lesson-22",
    number: 22,
    title: "관광지 방문",
    topic: "Travel Korean",
    difficulty: 0.5,
    objectives: [
      "입장권 구매 표현",
      "사진 촬영 허가",
      "가이드 투어 질문",
    ],
    estimatedMinutes: 30,
    xpReward: 270,
  },
  {
    id: "lesson-23",
    number: 23,
    title: "레스토랑과 카페",
    topic: "Travel Korean",
    difficulty: 0.5,
    objectives: [
      "메뉴 추천 받기",
      "주문 변경 요청",
      "계산 및 팁 표현",
    ],
    estimatedMinutes: 30,
    xpReward: 280,
  },
  {
    id: "lesson-24",
    number: 24,
    title: "쇼핑과 흥정",
    topic: "Travel Korean",
    difficulty: 0.6,
    objectives: [
      "가격 묻고 흥정하기",
      "교환 및 환불 요청",
      "배송 서비스 이용",
    ],
    estimatedMinutes: 35,
    xpReward: 290,
  },

  // Daily Life (25-34)
  {
    id: "lesson-25",
    number: 25,
    title: "병원 방문",
    topic: "Daily Life",
    difficulty: 0.6,
    objectives: [
      "증상 설명하기",
      "진료 예약 표현",
      "처방전 이해하기",
    ],
    estimatedMinutes: 35,
    xpReward: 300,
  },
  {
    id: "lesson-26",
    number: 26,
    title: "은행 업무",
    topic: "Daily Life",
    difficulty: 0.6,
    objectives: [
      "계좌 개설 표현",
      "송금 및 환전",
      "ATM 사용 표현",
    ],
    estimatedMinutes: 35,
    xpReward: 310,
  },
  {
    id: "lesson-27",
    number: 27,
    title: "부동산과 계약",
    topic: "Daily Life",
    difficulty: 0.7,
    objectives: [
      "집 구하기 표현",
      "계약 조건 협의",
      "관리비 및 보증금",
    ],
    estimatedMinutes: 40,
    xpReward: 320,
  },
  {
    id: "lesson-28",
    number: 28,
    title: "미용실과 네일샵",
    topic: "Daily Life",
    difficulty: 0.5,
    objectives: [
      "헤어 스타일 요청",
      "네일 디자인 설명",
      "예약 및 대기 표현",
    ],
    estimatedMinutes: 30,
    xpReward: 330,
  },
  {
    id: "lesson-29",
    number: 29,
    title: "헬스장과 운동",
    topic: "Daily Life",
    difficulty: 0.5,
    objectives: [
      "회원권 등록 표현",
      "운동 종류 및 기구",
      "PT 수업 표현",
    ],
    estimatedMinutes: 30,
    xpReward: 340,
  },
  {
    id: "lesson-30",
    number: 30,
    title: "반려동물 돌보기",
    topic: "Daily Life",
    difficulty: 0.5,
    objectives: [
      "동물병원 방문",
      "사료 및 용품 구매",
      "산책 및 훈련 표현",
    ],
    estimatedMinutes: 30,
    xpReward: 350,
  },
  {
    id: "lesson-31",
    number: 31,
    title: "수리 및 A/S",
    topic: "Daily Life",
    difficulty: 0.6,
    objectives: [
      "고장 신고 표현",
      "수리 요청하기",
      "비용 견적 받기",
    ],
    estimatedMinutes: 35,
    xpReward: 360,
  },
  {
    id: "lesson-32",
    number: 32,
    title: "우체국과 택배",
    topic: "Daily Life",
    difficulty: 0.5,
    objectives: [
      "소포 발송 표현",
      "등기 및 보험 우편",
      "배송 조회하기",
    ],
    estimatedMinutes: 30,
    xpReward: 370,
  },
  {
    id: "lesson-33",
    number: 33,
    title: "동네 이웃과 인사",
    topic: "Daily Life",
    difficulty: 0.5,
    objectives: [
      "이사 인사 표현",
      "이웃과 담소",
      "소음 불만 전달",
    ],
    estimatedMinutes: 30,
    xpReward: 380,
  },
  {
    id: "lesson-34",
    number: 34,
    title: "클럽과 모임",
    topic: "Daily Life",
    difficulty: 0.6,
    objectives: [
      "동호회 가입 표현",
      "정기 모임 약속",
      "회비 및 일정 조율",
    ],
    estimatedMinutes: 35,
    xpReward: 390,
  },

  // Culture & Society (35-40)
  {
    id: "lesson-35",
    number: 35,
    title: "한국의 명절",
    topic: "Culture & Society",
    difficulty: 0.6,
    objectives: [
      "설날과 추석 이해하기",
      "명절 인사 표현",
      "전통 음식과 풍습",
    ],
    estimatedMinutes: 35,
    xpReward: 400,
  },
  {
    id: "lesson-36",
    number: 36,
    title: "한국의 역사",
    topic: "Culture & Society",
    difficulty: 0.7,
    objectives: [
      "주요 역사 사건",
      "역사 유적지 설명",
      "역사적 인물 소개",
    ],
    estimatedMinutes: 40,
    xpReward: 410,
  },
  {
    id: "lesson-37",
    number: 37,
    title: "한국의 예절",
    topic: "Culture & Society",
    difficulty: 0.6,
    objectives: [
      "식사 예절 배우기",
      "어른 공경 표현",
      "선물 주고받기",
    ],
    estimatedMinutes: 35,
    xpReward: 420,
  },
  {
    id: "lesson-38",
    number: 38,
    title: "한국의 교육",
    topic: "Culture & Society",
    difficulty: 0.7,
    objectives: [
      "교육 시스템 이해",
      "학원 및 과외 문화",
      "대학 입시 표현",
    ],
    estimatedMinutes: 40,
    xpReward: 430,
  },
  {
    id: "lesson-39",
    number: 39,
    title: "한국의 정치와 사회",
    topic: "Culture & Society",
    difficulty: 0.8,
    objectives: [
      "정치 용어 배우기",
      "사회 이슈 토론",
      "뉴스 이해하기",
    ],
    estimatedMinutes: 45,
    xpReward: 440,
  },
  {
    id: "lesson-40",
    number: 40,
    title: "한국의 대중문화",
    topic: "Culture & Society",
    difficulty: 0.6,
    objectives: [
      "K-pop과 아이돌 문화",
      "K-drama 유행어",
      "예능 프로그램 표현",
    ],
    estimatedMinutes: 35,
    xpReward: 450,
  },

  // Advanced Grammar (41-46)
  {
    id: "lesson-41",
    number: 41,
    title: "고급 문법: 피동과 사동",
    topic: "Advanced Grammar",
    difficulty: 0.8,
    objectives: [
      "피동사 만들기",
      "사동사 사용하기",
      "피동과 사동 구별",
    ],
    estimatedMinutes: 45,
    xpReward: 460,
  },
  {
    id: "lesson-42",
    number: 42,
    title: "고급 문법: 간접 인용",
    topic: "Advanced Grammar",
    difficulty: 0.8,
    objectives: [
      "평서문 인용",
      "의문문 인용",
      "명령문과 청유문 인용",
    ],
    estimatedMinutes: 45,
    xpReward: 470,
  },
  {
    id: "lesson-43",
    number: 43,
    title: "고급 문법: 관형사형 어미",
    topic: "Advanced Grammar",
    difficulty: 0.8,
    objectives: [
      "-는/-은/-ㄴ 구별",
      "-던과 -았/었던",
      "-(으)ㄹ 사용",
    ],
    estimatedMinutes: 45,
    xpReward: 480,
  },
  {
    id: "lesson-44",
    number: 44,
    title: "고급 문법: 연결어미 심화",
    topic: "Advanced Grammar",
    difficulty: 0.9,
    objectives: [
      "조건 연결어미",
      "양보 연결어미",
      "대립 연결어미",
    ],
    estimatedMinutes: 50,
    xpReward: 490,
  },
  {
    id: "lesson-45",
    number: 45,
    title: "고급 문법: 높임법 완성",
    topic: "Advanced Grammar",
    difficulty: 0.9,
    objectives: [
      "주체 높임법",
      "상대 높임법",
      "객체 높임법",
    ],
    estimatedMinutes: 50,
    xpReward: 500,
  },
  {
    id: "lesson-46",
    number: 46,
    title: "고급 문법: 부정 표현",
    topic: "Advanced Grammar",
    difficulty: 0.8,
    objectives: [
      "안 부정과 못 부정",
      "이중 부정 표현",
      "금지 표현 구별",
    ],
    estimatedMinutes: 45,
    xpReward: 510,
  },

  // Idioms & Proverbs (47-50)
  {
    id: "lesson-47",
    number: 47,
    title: "한국 속담 배우기",
    topic: "Idioms & Proverbs",
    difficulty: 0.7,
    objectives: [
      "일상에서 쓰는 속담",
      "속담의 유래",
      "상황별 속담 사용",
    ],
    estimatedMinutes: 40,
    xpReward: 520,
  },
  {
    id: "lesson-48",
    number: 48,
    title: "관용 표현",
    topic: "Idioms & Proverbs",
    difficulty: 0.7,
    objectives: [
      "신체 관련 관용어",
      "동물 관련 관용어",
      "자연 관련 관용어",
    ],
    estimatedMinutes: 40,
    xpReward: 530,
  },
  {
    id: "lesson-49",
    number: 49,
    title: "사자성어",
    topic: "Idioms & Proverbs",
    difficulty: 0.8,
    objectives: [
      "자주 쓰는 사자성어",
      "한자 이해하기",
      "사자성어 활용",
    ],
    estimatedMinutes: 45,
    xpReward: 540,
  },
  {
    id: "lesson-50",
    number: 50,
    title: "신조어와 유행어",
    topic: "Idioms & Proverbs",
    difficulty: 0.7,
    objectives: [
      "최신 신조어",
      "인터넷 용어",
      "세대별 언어 차이",
    ],
    estimatedMinutes: 40,
    xpReward: 550,
  },
];

/**
 * Get Lesson by ID
 */
export const getLesson = functions.https.onCall(
  async (data: { lessonId: string }, context) => {
    verifyAuth(context);

    const {lessonId} = data;

    if (!lessonId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "lessonId is required"
      );
    }

    const lesson = LESSONS.find((l) => l.id === lessonId);

    if (!lesson) {
      throw new functions.https.HttpsError(
        "not-found",
        "Lesson not found"
      );
    }

    return lesson;
  }
);

/**
 * Get All Lessons
 */
export const getAllLessons = functions.https.onCall(
  async (data, context) => {
    verifyAuth(context);

    return {
      lessons: LESSONS,
      total: LESSONS.length,
    };
  }
);

/**
 * Get User's Current Lesson
 */
export const getUserCurrentLesson = functions.https.onCall(
  async (data, context) => {
    const userId = verifyAuth(context);

    try {
      // Get user's tutor progress
      const progressDoc = await getDb()
        .collection("users")
        .doc(userId)
        .collection("tutorProgress")
        .doc("current")
        .get();

      if (!progressDoc.exists) {
        // Return first lesson for new users
        return {
          lesson: LESSONS[0],
          isNewUser: true,
        };
      }

      const progress = progressDoc.data();
      const currentLessonNumber = progress?.currentLesson || 1;

      const lesson = LESSONS.find((l) => l.number === currentLessonNumber);

      return {
        lesson: lesson || LESSONS[0],
        progress: {
          currentLesson: currentLessonNumber,
          lessonsCompleted: progress?.lessonsCompleted || [],
          totalXP: progress?.totalXP || 0,
        },
      };
    } catch (error: any) {
      functions.logger.error("Get current lesson error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get current lesson"
      );
    }
  }
);

/**
 * Complete Lesson
 */
export const completeLesson = functions.https.onCall(
  async (data: { lessonId: string }, context) => {
    const userId = verifyAuth(context);
    const {lessonId} = data;

    if (!lessonId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "lessonId is required"
      );
    }

    try {
      const lesson = LESSONS.find((l) => l.id === lessonId);

      if (!lesson) {
        throw new functions.https.HttpsError(
          "not-found",
          "Lesson not found"
        );
      }

      const progressRef = getDb()
        .collection("users")
        .doc(userId)
        .collection("tutorProgress")
        .doc("current");

      const progressDoc = await progressRef.get();

      if (!progressDoc.exists) {
        // Create new progress
        await progressRef.set({
          currentLesson: lesson.number + 1,
          lessonsCompleted: [lesson.number],
          totalXP: lesson.xpReward,
          lastStudied: admin.firestore.Timestamp.now(),
        });
      } else {
        // Update existing progress
        const progress = progressDoc.data();
        const lessonsCompleted = progress?.lessonsCompleted || [];

        if (!lessonsCompleted.includes(lesson.number)) {
          await progressRef.update({
            currentLesson: lesson.number + 1,
            lessonsCompleted: admin.firestore.FieldValue.arrayUnion(lesson.number),
            totalXP: admin.firestore.FieldValue.increment(lesson.xpReward),
            lastStudied: admin.firestore.Timestamp.now(),
          });
        }
      }

      return {
        success: true,
        xpEarned: lesson.xpReward,
        nextLesson: LESSONS[lesson.number] || null,
      };
    } catch (error: any) {
      functions.logger.error("Complete lesson error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to complete lesson"
      );
    }
  }
);
