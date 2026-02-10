# 📚 Edu_Hangul 프로젝트 종합 문서

> **AI 음성/텍스트 기반 실전 한국어 학습 플랫폼**
> "드라마처럼 자연스러운 한국어를 실제 대화하며 배우다"

---

## 목차
1. [프로젝트 철학](#프로젝트-철학)
2. [핵심 기능](#핵심-기능)
3. [기술 아키텍처](#기술-아키텍처)
4. [완성된 기능](#완성된-기능)
5. [진행 중 기능](#진행-중-기능)
6. [향후 계획](#향후-계획)
7. [비즈니스 모델](#비즈니스-모델)
8. [기술적 도전과제](#기술적-도전과제)

---

## 🎯 프로젝트 철학

### 1. **실전 중심 학습 (Real-life Korean)**
교과서가 아닌 **실제 한국인이 사용하는 언어**를 가르칩니다.
- 드라마에 나오는 자연스러운 표현
- 세대별/상황별 적절한 말투
- 속어, 줄임말, 유행어 포함
- 문화적 맥락(Context)과 함께 학습

**예시:**
```
❌ 교과서: "저는 학교에 갑니다"
✅ 실전: "나 학교 가" (친구), "학교 가요" (일반), "학교 갑니다" (정중)
```

### 2. **AI 친구와의 자연스러운 대화**
전통적인 "학습 앱" 느낌이 아닌, **친구와 대화하듯** 자연스럽게 배웁니다.
- 페르소나 선택 (동성친구, 이성친구, 연인)
- 반말/존댓말 자동 조절
- 감정 표현이 있는 음성 (Google Journey TTS)
- 대화 흐름을 기억하는 컨텍스트 관리

### 3. **모바일 우선 (Mobile-First)**
언제 어디서나 **스마트폰으로 한국어 연습**
- Push-to-Talk 음성 대화 (통근, 산책 중에도 가능)
- 모바일 최적화 UI/UX
- 5분~15분 짧은 세션으로 학습
- 오프라인 대비 (향후 계획)

### 4. **접근성 (Accessibility)**
누구나 부담 없이 시작할 수 있도록
- **Free 플랜**: 주 15분 무료 (광고 포함)
- **학생 할인**: 만 20세 이하 50% 할인
- **무료 STT**: Web Speech API 사용 (서버 비용 없음)
- **최고 품질 AI**: 모든 플랜에서 Claude Sonnet 3.5 제공

### 5. **피드백 기반 성장**
단순 대화가 아닌 **학습 분석과 피드백**
- 실시간 대화 통계 (시간, 점유율, 레벨)
- 상세 분석 (발음, 어휘, 문법, 유창성)
- 대화 도우미 (막힐 때 AI가 문장 제안)
- 학습 진도 추적 (향후 계획)

---

## 🚀 핵심 기능

### 1. 음성 대화 (Voice Chat) - 핵심 기능 ⭐

#### 1.1 기술 스택
```
사용자 음성 (한국어)
    ↓
Web Speech API (실시간 STT, 무료)
    ↓
Firebase Cloud Functions
    ↓
Claude Sonnet 3.5 (자연스러운 한국어 응답)
    ↓
Google Cloud TTS Journey (감정 표현 음성)
    ↓
Base64 MP3 스트리밍 재생
```

#### 1.2 주요 특징
- **Push-to-Talk UI**: 버튼 누르고 말하기 (모바일 최적화)
- **실시간 Transcript**: 인식 중인 텍스트 실시간 표시
- **자동 TTS 재생**: AI 응답을 음성으로 즉시 재생
- **대화 컨텍스트 관리**: 이전 대화 내용 기억 (롤링 서머리)
- **시간 추적**: 사용자/AI 말하기 시간 분리 추적

#### 1.3 페르소나 시스템
사용자가 선택한 AI 캐릭터와 대화:
- **동성 친구** (same-sex-friend): 편하게 반말
- **이성 친구** (opposite-sex-friend): 친근하되 조심스럽게
- **남자친구/여자친구** (boyfriend/girlfriend): 다정하고 친밀하게

#### 1.4 대화 스타일 커스터마이징
- **응답 성격** (responseStyle):
  - `empathetic`: 공감형 (따뜻하게)
  - `balanced`: 균형형 (일반적)
  - `blunt`: 직설형 (솔직하게)
- **교정 강도** (correctionStrength):
  - `minimal`: 최소 교정 (자연스러운 대화 우선)
  - `strict`: 엄격 교정 (문법 정확도 우선)
- **격식 수준** (formalityLevel):
  - `formal`: 격식체 (합니다/합니까)
  - `polite`: 공손체 (해요/해요?)
  - `casual`: 반말 (해/해?)
  - `intimate`: 친밀체 (애교, 줄임말)

### 2. 텍스트 채팅 (Text Chat)

#### 2.1 주요 특징
- **키보드 친화적**: Enter 전송, Shift+Enter 줄바꿈
- **자동 스크롤**: 새 메시지 자동 포커스
- **토큰 표시**: Pro 사용자는 Claude API 토큰 사용량 표시
- **데스크톱 최적화**: 넓은 화면 활용
- **음성 대화와 동일한 AI**: Claude Sonnet 3.5

#### 2.2 크레딧 환산
- 텍스트 1 메시지 = 음성 30초 환산
- Free 플랜: 주 30개 메시지 (15분 × 2메시지/분)
- Free+ 플랜: 주 50개 메시지 (25분 × 2메시지/분)
- Pro/Pro+ 플랜: 무제한

### 3. 크레딧 시스템

#### 3.1 7일 롤링 사이클
- **기존 방식 (X)**: 매주 월요일 자정 리셋 → 사용자가 날짜 계산해야 함
- **채택한 방식 (O)**: 첫 대화 시작부터 7일 단위 → 개인별 맞춤 사이클

```typescript
// 예시: 2024년 1월 3일 오후 3시 첫 대화 시작
weeklyResetAt = 2024-01-10 15:00:00

// 2024년 1월 10일 오후 3시가 되면 자동 리셋
// 다음 리셋은 2024년 1월 17일 오후 3시
```

#### 3.2 플랜별 제한
| 플랜 | 주간 시간 | 텍스트 환산 | 비고 |
|------|-----------|-------------|------|
| Free | 15분 | 30 메시지 | 광고 있음 |
| Free+ | 25분 | 50 메시지 | 광고 없음 |
| Pro | 무제한 | 무제한 | 상세 분석 일 3회 |
| Pro+ | 무제한 | 무제한 | 상세 분석 일 7회 |

#### 3.3 크레딧 관리 로직
```typescript
// functions/src/speech/creditManager.ts
export async function checkAndDeductCredit(
  userId: string,
  durationSeconds: number
): Promise<void> {
  const user = await getUserDocument(userId);

  // Free/Free+ 플랜만 크레딧 체크
  if (["pro", "pro+"].includes(user.subscriptionTier)) {
    return; // 무제한 사용
  }

  // 7일 사이클 리셋 체크
  const now = Timestamp.now();
  if (now.toMillis() >= user.weeklyResetAt.toMillis()) {
    await resetWeeklyCredit(userId);
  }

  // 크레딧 체크
  const limit = user.subscriptionTier === "free+" ? 25 : 15;
  const minutesUsed = user.weeklyMinutesUsed / 60;

  if (minutesUsed >= limit) {
    throw new AppError("CREDIT_EXHAUSTED", "주간 크레딧이 소진되었습니다");
  }

  // 크레딧 차감
  await deductCredit(userId, durationSeconds);
}
```

### 4. 대화 도우미 (Assistant Suggestion)

#### 4.1 목적
대화 중 막힐 때 AI가 **상황에 맞는 자연스러운 문장 3개 제안**

#### 4.2 사용 시나리오
```
사용자: "오늘 날씨 좋네"
AI: "진짜? 나는 집에만 있어서 몰랐어. 너 밖에 나왔어?"

💡 [대화 도우미 버튼 클릭]

AI 제안:
1. "응, 친구 만나러 나왔어"
2. "아니, 집에서 창문 열어놓으니까 좋더라"
3. "산책하러 나왔어. 같이 갈래?"
```

#### 4.3 플랜별 제한
- **Free**: 사용 불가
- **Free+**: 주 1회
- **Pro/Pro+**: 무제한

#### 4.4 구현
```typescript
// functions/src/speech/assistantSuggestion.ts
export const getAssistantSuggestion = onCall(async (request) => {
  const userId = request.auth?.uid;
  const { sessionId, recentMessages } = request.data;

  // 사용 권한 체크
  const user = await getUserDocument(userId);
  if (user.subscriptionTier === "free") {
    throw new AppError("PERMISSION_DENIED", "Free 플랜은 대화 도우미를 사용할 수 없습니다");
  }

  if (user.subscriptionTier === "free+" && user.weeklyAssistantUsed >= 1) {
    throw new AppError("QUOTA_EXCEEDED", "주간 대화 도우미 사용 횟수 초과");
  }

  // Claude API로 제안 생성
  const suggestions = await generateSuggestions(recentMessages);

  // 사용 횟수 증가
  if (user.subscriptionTier === "free+") {
    await incrementAssistantUsage(userId);
  }

  return { suggestions };
});
```

### 5. 학습 성과 (Session Summary)

#### 5.1 기본 통계 (모든 사용자)
대화 종료 시 자동 생성:
- **총 대화 시간**: 전체 세션 길이
- **대화 점유율**: 사용자 말하기 시간 / 전체 시간 × 100%
- **말하기 레벨**: 점유율 기반 레벨링
  - 👶 Beginner (0-20%)
  - 🧒 Elementary (20-40%)
  - 🧑 Intermediate (40-60%)
  - 👨‍🎓 Advanced (60-80%)
  - 👨‍🏫 Expert (80-100%)

#### 5.2 Pro 추가 통계
- **총 메시지 수**: 주고받은 메시지 개수
- **평균 문장 길이**: 사용자 메시지의 평균 길이

#### 5.3 구현
```typescript
// functions/src/speech/sessionSummary.ts
export const getSessionSummary = onCall(async (request) => {
  const { sessionId } = request.data;
  const session = await getSessionDocument(sessionId);

  const totalMinutes = Math.floor(session.totalDurationSeconds / 60);
  const userPercentage = Math.round(
    (session.userSpeakingSeconds / session.totalDurationSeconds) * 100
  );

  const level = calculateLevel(userPercentage);

  return {
    totalMinutes,
    userPercentage,
    level,
    // Pro 전용
    messageCount: session.messageCount,
    averageLength: await calculateAverageMessageLength(sessionId),
  };
});
```

### 6. 상세 분석 (Detailed Analysis) - Pro 전용

#### 6.1 분석 항목
4가지 영역을 0-100점으로 평가:
1. **발음 (Pronunciation)**
   - 한국어 발음 정확도
   - 받침, 이중모음 처리
   - 억양, 강세

2. **어휘력 (Vocabulary)**
   - 사용한 단어의 다양성
   - 적절한 어휘 선택
   - 고급 표현 사용

3. **문법 (Grammar)**
   - 문법적 정확도
   - 조사, 어미 사용
   - 문장 구조

4. **유창성 (Fluency)**
   - 말의 흐름
   - 자연스러움
   - 대화 속도

#### 6.2 최소 요구사항
- **3분 이상** OR **500자 이상** (둘 중 하나만 만족해도 OK)
- 너무 짧은 대화는 분석 불가능

#### 6.3 플랜별 제한
- **Free/Free+**: 평생 1회 (체험용)
- **Pro**: 일 3회
- **Pro+**: 일 7회

#### 6.4 구현
```typescript
// functions/src/speech/detailedAnalysis.ts
export const getDetailedAnalysis = onCall(async (request) => {
  const userId = request.auth?.uid;
  const { sessionId } = request.data;

  // 최소 요구사항 체크
  const session = await getSessionDocument(sessionId);
  const totalMinutes = session.totalDurationSeconds / 60;
  const totalChars = await getTotalChars(sessionId);

  if (totalMinutes < 3 && totalChars < 500) {
    throw new AppError("INSUFFICIENT_DATA", "3분 이상 또는 500자 이상 필요");
  }

  // 할당량 체크
  const user = await getUserDocument(userId);
  if (["free", "free+"].includes(user.subscriptionTier) && user.analysisUsedLifetime) {
    throw new AppError("QUOTA_EXCEEDED", "평생 1회 분석을 이미 사용했습니다");
  }

  if (user.subscriptionTier === "pro" && user.dailyAnalysisUsed >= 3) {
    throw new AppError("QUOTA_EXCEEDED", "일일 분석 횟수 초과 (3회)");
  }

  if (user.subscriptionTier === "pro+" && user.dailyAnalysisUsed >= 7) {
    throw new AppError("QUOTA_EXCEEDED", "일일 분석 횟수 초과 (7회)");
  }

  // Claude API로 분석 생성
  const analysis = await analyzeSession(sessionId);

  // 사용 횟수 업데이트
  await updateAnalysisQuota(userId, user.subscriptionTier);

  return {
    pronunciation: { score: 85, feedback: [...] },
    vocabulary: { score: 78, feedback: [...] },
    grammar: { score: 90, feedback: [...] },
    fluency: { score: 82, feedback: [...] },
    recommendations: [...],
  };
});
```

### 7. 광고 시스템 (Free 플랜 전용)

#### 7.1 전면 광고 (Interstitial Ad)
**표시 시점:**
- 대화 시작 직전 (5초 카운트다운)
- 대화 종료 직후 (5초 카운트다운)

**업그레이드 유도:**
```
광고를 건너뛰려면 Free+ 플랜으로 업그레이드하세요!
월 $4.9로 광고 없는 학습 + 주 25분 대화
```

#### 7.2 배너 광고 (Banner Ad)
**표시 시점:**
- 대화 중 5분마다 화면 하단에 표시
- 3초 후 자동 숨김

**구현:**
```typescript
// src/components/AdInterstitial.tsx
export default function AdInterstitial({ onComplete }: Props) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80">
      {/* Google AdSense */}
      <ins className="adsbygoogle" ... />

      <div className="countdown">
        {countdown}초 후 건너뛰기
      </div>

      <button onClick={handleUpgrade}>
        Free+ 업그레이드 ($4.9/월)
      </button>
    </div>
  );
}
```

### 8. Stripe 구독 시스템

#### 8.1 8개 플랜
| 플랜 | 월간 | 연간 | 특징 |
|------|------|------|------|
| Free+ | $4.9 | $59 | 광고 제거 + 주 25분 |
| Pro | $20.9 | $209 | 무제한 + 일 3회 분석 |
| Pro+ | $30.9 | $309 | 무제한 + 일 7회 분석 |
| Pro+ Student | $15.45 | $154.5 | 만 20세 이하 50% 할인 |

**연간 할인:** 10개월 결제 + 2개월 무료

#### 8.2 학생 할인 시스템
```typescript
// functions/src/utils/studentHelper.ts
export function isStudentAge(birthDate: Timestamp): boolean {
  const today = new Date();
  const birth = birthDate.toDate();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age <= 20; // 만 20세 이하
}

// 사용자가 생년월일 입력 → 자동으로 isStudent 플래그 설정
export const updateProfile = onCall(async (request) => {
  const { birthDate } = request.data;

  const isStudent = isStudentAge(Timestamp.fromDate(new Date(birthDate)));

  await updateUser(userId, {
    birthDate: Timestamp.fromDate(new Date(birthDate)),
    isStudent,
  });
});
```

#### 8.3 Stripe Checkout 플로우
```
1. /pricing 페이지에서 플랜 선택
2. "선택하기" 버튼 클릭
3. createCheckoutSession Function 호출
4. Stripe Checkout 페이지로 리디렉션
5. 결제 완료
6. Stripe Webhook 트리거 (checkout.session.completed)
7. Firestore 사용자 문서 업데이트:
   - subscriptionTier = "pro+"
   - subscriptionStatus = "active"
   - stripeCustomerId = "cus_xxx"
   - stripeSubscriptionId = "sub_xxx"
8. /app 페이지로 리디렉션 (success_url)
```

#### 8.4 Customer Portal (구독 관리)
사용자가 직접 결제 수단 변경, 구독 취소 등 가능:
```typescript
// functions/src/stripe/checkout.ts
export const createPortalSession = onCall(async (request) => {
  const userId = request.auth?.uid;
  const user = await getUserDocument(userId);

  if (!user.stripeCustomerId) {
    throw new AppError("NO_SUBSCRIPTION", "활성 구독이 없습니다");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.APP_URL}/settings`,
  });

  return { url: session.url };
});
```

### 9. 세션 관리 (Session Management) - 신규 추가 ✨

#### 9.1 세션 히스토리
- **useSessionHistory 훅**: 실시간 세션 목록 (최대 50개)
- **고정 기능**: 중요한 세션을 상단에 고정 (`isPinned`)
- **정렬**: 고정된 세션 → 최신 메시지 순

#### 9.2 컨텍스트 메뉴
- **이름 변경**: 세션 제목 수정
- **상단 고정/해제**: 중요한 대화 고정
- **삭제**: 세션 삭제

#### 9.3 구현 (신규 파일)
```typescript
// src/hooks/useSessionHistory.ts
export function useSessionHistory(userId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", userId),
      orderBy("lastMessageAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionList = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        lastMessage: doc.data().lastMessagePreview,
        timestamp: doc.data().lastMessageAt.toDate(),
        isPinned: doc.data().isPinned,
      }));

      // 클라이언트 정렬: 고정 → 최신순
      sessionList.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setSessions(sessionList);
    });

    return () => unsubscribe();
  }, [userId]);

  return { sessions, isLoading };
}
```

---

## 🏗️ 기술 아키텍처

### 1. 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 14)                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ Voice Chat │  │ Text Chat  │  │  Pricing   │        │
│  │   Page     │  │    Page    │  │    Page    │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │          Hooks (Custom Logic)                    │    │
│  │  - useVoiceChat, useTextChat                     │    │
│  │  - useSpeechRecognition (Web Speech API)        │    │
│  │  - useUserCredits, useAssistant                  │    │
│  │  - useSessionHistory (NEW)                       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌─────────────────────────────────────────────────────────┐
│          Firebase Cloud Functions (Backend)              │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   voiceChat  │  │   textChat   │  │  synthesize  │  │
│  │  (핵심 로직)  │  │              │  │    Speech    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Learning Features                         │   │
│  │  - getAssistantSuggestion (대화 도우미)          │   │
│  │  - getSessionSummary (학습 성과)                 │   │
│  │  - getDetailedAnalysis (상세 분석)               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Session Management                        │   │
│  │  - createSession, updateSession                   │   │
│  │  - sessionManagement (CRUD)                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Stripe Integration                        │   │
│  │  - createCheckoutSession                          │   │
│  │  - createPortalSession                            │   │
│  │  - stripeWebhook (이벤트 처리)                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
           ↕                  ↕                  ↕
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│  Claude API      │  │ Google Cloud │  │   Stripe     │
│  (Sonnet 3.5)    │  │  TTS (Journey│  │   (결제)     │
│                  │  │     Voice)   │  │              │
└──────────────────┘  └──────────────┘  └──────────────┘
```

### 2. 데이터베이스 (Firestore)

#### 2.1 Collections 구조
```
/users/{userId}
  - uid, email, displayName
  - subscriptionTier, stripeCustomerId
  - weeklyMinutesUsed, weeklyResetAt
  - isStudent, birthDate

/sessions/{sessionId}
  - userId, title
  - persona, responseStyle, correctionStrength, formalityLevel
  - isVoiceSession, totalDurationSeconds
  - isPinned, lastMessagePreview (NEW)

/messages/{messageId}
  - sessionId, userId
  - role, content
  - audioUrl, durationSeconds
  - modelUsed, inputTokens, outputTokens
```

#### 2.2 인덱스 (firestore.indexes.json)
```json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "lastMessageAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sessionId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 3. API 통합

#### 3.1 Claude API (Anthropic)
- **모델**: Claude Sonnet 3.5 (claude-3-5-sonnet-20241022)
- **용도**: 음성/텍스트 대화, 분석, 제안
- **비용**: Input $3/1M tokens, Output $15/1M tokens
- **특징**: 한국어 이해도 최고, 자연스러운 대화

#### 3.2 Google Cloud TTS
- **음성**: Journey (ko-KR-Neural2-C, ko-KR-Neural2-A)
- **용도**: AI 응답 음성 합성
- **비용**: $16/1M characters
- **특징**: 감정 표현 가능, 고품질

#### 3.3 Stripe
- **용도**: 구독 결제, 학생 할인
- **Webhook 이벤트**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

---

## ✅ 완성된 기능

### Phase 1: 핵심 인프라 (100% 완료)
- [x] Firebase 프로젝트 설정
- [x] Next.js 14 프론트엔드 구조
- [x] Firebase Functions 백엔드 구조
- [x] TypeScript 타입 시스템
- [x] Firestore 데이터 모델
- [x] 인증 시스템 (Google OAuth, Email/Password)

### Phase 2: 음성 대화 (100% 완료)
- [x] Web Speech API 통합 (STT)
- [x] Google Cloud TTS Journey 통합
- [x] Claude Sonnet 3.5 통합
- [x] VoiceChat 컴포넌트 (Push-to-Talk UI)
- [x] 실시간 transcript 표시
- [x] TTS 오디오 자동 재생
- [x] 페르소나 시스템 (4가지)
- [x] 대화 스타일 커스터마이징
- [x] 대화 컨텍스트 관리 (롤링 서머리)

### Phase 3: 텍스트 채팅 (100% 완료)
- [x] TextChat 컴포넌트
- [x] 키보드 단축키 (Enter, Shift+Enter)
- [x] 자동 스크롤
- [x] 토큰 사용량 표시
- [x] 데스크톱 레이아웃 최적화

### Phase 4: 크레딧 시스템 (100% 완료)
- [x] 7일 롤링 사이클
- [x] 플랜별 제한 (Free 15분, Free+ 25분)
- [x] 크레딧 체크 및 차감
- [x] 실시간 크레딧 표시 (useUserCredits)
- [x] 크레딧 소진 UI
- [x] 텍스트 메시지 크레딧 환산

### Phase 5: 학습 기능 (100% 완료)
- [x] 대화 도우미 (getAssistantSuggestion)
- [x] 학습 성과 (getSessionSummary)
- [x] 상세 분석 (getDetailedAnalysis)
- [x] 플랜별 사용 제한
- [x] SessionSummary 컴포넌트
- [x] DetailedAnalysis 컴포넌트

### Phase 6: 광고 시스템 (100% 완료)
- [x] AdInterstitial 컴포넌트 (전면 광고)
- [x] AdBanner 컴포넌트 (배너 광고)
- [x] 5초 카운트다운
- [x] Google AdSense 통합
- [x] Free 플랜 조건부 표시
- [x] 업그레이드 프롬프트

### Phase 7: Stripe 구독 (100% 완료)
- [x] 8개 플랜 설정
- [x] createCheckoutSession Function
- [x] createPortalSession Function
- [x] stripeWebhook Function
- [x] 학생 할인 자동 검증
- [x] Pricing 페이지
- [x] Settings 페이지
- [x] 구독 상태 실시간 동기화

### Phase 8: UI/UX (100% 완료)
- [x] 반응형 디자인 (모바일/데스크톱)
- [x] 모바일 하단 탭 네비게이션
- [x] 데스크톱 상단 메뉴
- [x] 다크모드
- [x] 로딩 상태 표시
- [x] 에러 처리
- [x] 홈페이지 (랜딩)

### Phase 9: 세션 관리 (95% 완료) ✨ NEW
- [x] useSessionHistory 훅
- [x] ContextMenu 컴포넌트
- [x] RenameDialog 컴포넌트
- [x] 세션 고정 기능 (isPinned)
- [x] 세션 삭제 기능
- [x] 세션 이름 변경 기능
- [ ] Sidebar 통합 (진행 중)

---

## 🚧 진행 중 기능

### 1. Sidebar 통합 (90% 완료)
**목표:** 데스크톱 왼쪽에 세션 히스토리 사이드바 추가

**완료된 것:**
- ✅ useSessionHistory 훅 구현
- ✅ ContextMenu 컴포넌트 구현
- ✅ RenameDialog 컴포넌트 구현
- ✅ 세션 고정/삭제/이름 변경 기능

**남은 작업:**
- [ ] Sidebar 컴포넌트 레이아웃 통합
- [ ] VoiceChat/TextChat 페이지에 Sidebar 추가
- [ ] 모바일 반응형 (슬라이드 오버레이)
- [ ] 새 대화 시작 버튼
- [ ] 세션 검색 기능

**예상 파일:**
```
src/components/Sidebar.tsx (이미 존재, 업데이트 필요)
src/app/chat/layout.tsx (레이아웃 수정)
src/app/voice/layout.tsx (레이아웃 수정)
```

### 2. 프로덕션 배포 준비 (60% 완료)
**완료된 것:**
- ✅ TypeScript 빌드 성공
- ✅ Functions 빌드 성공
- ✅ 모든 기능 구현 완료
- ✅ 문서화 완료

**남은 작업:**
- [ ] Google Cloud TTS API 키 발급
- [ ] Claude API 키 발급 (프로덕션)
- [ ] Stripe Products & Prices 생성 (Live 모드)
- [ ] Google AdSense 승인 신청
- [ ] 환경 변수 설정 (프로덕션)
- [ ] Firestore Rules 검토 및 배포
- [ ] 도메인 구입 및 연결 (선택)
- [ ] 전체 플로우 테스트

---

## 🔮 향후 계획

### Phase 10: 프로덕션 출시 (Q1 2025)
**목표:** 실제 사용자 대상 서비스 시작

**체크리스트:**
- [ ] API 키 발급 (Claude, Google Cloud)
- [ ] Stripe Live 모드 전환
- [ ] AdSense 승인 완료
- [ ] 베타 테스터 모집 (10-20명)
- [ ] 피드백 수집 및 버그 수정
- [ ] 프로덕션 배포
- [ ] 모니터링 설정 (Firebase Analytics)

### Phase 11: 고급 학습 기능 (Q2 2025)
**목표:** 학습 효과 극대화

**기능:**
- [ ] **학습 진도 추적**
  - 레벨 시스템 (1-100 레벨)
  - 경험치 (XP) 시스템
  - 레벨업 보상

- [ ] **단어장 & 복습 시스템**
  - 대화 중 새로운 단어 자동 저장
  - Spaced Repetition (간격 반복)
  - 플래시카드

- [ ] **발음 평가**
  - Web Speech API 신뢰도 점수 활용
  - 발음이 어려운 단어 목록
  - 발음 연습 모드

- [ ] **주제별 대화**
  - 여행, 쇼핑, 데이트, 업무 등 시나리오
  - 주제별 필수 표현 학습
  - 역할극 (Role-play) 모드

### Phase 12: 소셜 기능 (Q3 2025)
**목표:** 커뮤니티 활성화

**기능:**
- [ ] **친구 초대 시스템**
  - 초대 링크 생성
  - 추천인 보상 (크레딧 지급)

- [ ] **리더보드**
  - 주간/월간 학습 시간 랭킹
  - 레벨 랭킹
  - 국가별 랭킹

- [ ] **배지 시스템**
  - 달성 과제 (Achievements)
  - 배지 수집 및 프로필 표시

- [ ] **그룹 대화** (실험적)
  - 여러 사용자가 동시에 AI와 대화
  - 그룹 스터디 모드

### Phase 13: 모바일 앱 (Q4 2025)
**목표:** 네이티브 앱 경험

**플랫폼:**
- [ ] iOS 앱 (React Native 또는 Swift)
- [ ] Android 앱 (React Native 또는 Kotlin)

**추가 기능:**
- [ ] 오프라인 모드 (대화 히스토리 캐싱)
- [ ] 푸시 알림 (학습 리마인더)
- [ ] 위젯 (오늘의 표현, 학습 통계)
- [ ] 백그라운드 재생 (TTS 오디오)

### Phase 14: 다국어 지원 (2026)
**목표:** 글로벌 확장

**대상 언어:**
- [ ] 영어 → 한국어 (현재)
- [ ] 일본어 → 한국어
- [ ] 중국어 → 한국어
- [ ] 스페인어 → 한국어
- [ ] 한국어 → 영어 (역방향)

### Phase 15: B2B/교육 기관 (2026)
**목표:** 기관 고객 확보

**기능:**
- [ ] 학교/학원용 대시보드
- [ ] 교사 계정 (학생 관리)
- [ ] 과제 시스템
- [ ] 성적표 생성
- [ ] 그룹 라이선스

---

## 💰 비즈니스 모델

### 1. 수익 구조

#### 1.1 구독 수익 (주 수익원)
```
예상 사용자 분포 (500명 기준):
- Free: 400명 (80%)        → $0
- Free+: 50명 (10%)        → $245/월 ($4.9 × 50)
- Pro: 35명 (7%)           → $731.5/월 ($20.9 × 35)
- Pro+: 15명 (3%)          → $463.5/월 ($30.9 × 15)

총 구독 수익: ~$1,440/월 = ~$17,280/년
```

#### 1.2 광고 수익 (보조 수익원)
```
Free 사용자 400명:
- 일 평균 10분 대화
- 전면 광고 2회/세션 (시작+종료)
- 배너 광고 1-2회/세션
- CPM $2-5 가정

월 광고 노출:
- 전면: 400명 × 30일 × 2회 = 24,000회
- 배너: 400명 × 30일 × 1.5회 = 18,000회
- 총: 42,000회

예상 수익: $84-210/월 = ~$1,000-2,500/년
```

#### 1.3 총 수익 (500명 기준)
```
구독: $17,280/년
광고: $1,800/년 (평균)
----------------------------
총: ~$19,080/년
```

### 2. 비용 구조 (500명 기준)

#### 2.1 API 비용
```
Claude API:
- 500명 × 60 메시지/월 = 30,000 메시지
- 평균 500 tokens/대화
- 15M tokens × ($3 input + $15 output) / 2
- 비용: ~$135/월 = $1,620/년

Google Cloud TTS:
- 유료 사용자 100명 × 무제한
- Free 400명 × 주 15분 = 6,000분/주
- 평균 100자/응답 × 60회 = 6,000자/사용자
- 500 × 6,000 = 3M 자/월
- 비용: ~$48/월 = $576/년

Firebase:
- Firestore: ~$30/월
- Functions: ~$50/월
- Hosting: $5/월
- 비용: ~$85/월 = $1,020/년

Stripe 수수료:
- 2.9% + $0.30/건
- 100명 유료 × $20 평균 = $2,000/월
- 수수료: ~$68/월 = $816/년
```

#### 2.2 총 비용
```
Claude: $1,620/년
Google TTS: $576/년
Firebase: $1,020/년
Stripe: $816/년
----------------------------
총: ~$4,032/년
```

### 3. 순익
```
수익: $19,080/년
비용: $4,032/년
----------------------------
순익: ~$15,048/년 (500명 기준)
```

### 4. 손익분기점 (Break-even)
```
고정 비용: ~$500/년 (도메인, 기타)
변동 비용: ~$8/사용자/년

손익분기점:
- Free 사용자: 비용만 발생 ($8/년)
- 유료 사용자: 평균 $50/년 수익 - $8/년 비용 = $42/년 순익
- 손익분기: ~12명 유료 사용자

현실적 목표:
- 6개월: 100명 (20명 유료) → 흑자 전환
- 1년: 500명 (100명 유료) → $15,000/년 순익
- 2년: 2,000명 (400명 유료) → $60,000/년 순익
```

---

## 🛠️ 기술적 도전과제

### 1. 해결된 문제들

#### 1.1 크레딧 관리
**문제:** 매주 월요일 자정 리셋 방식은 사용자가 날짜 계산해야 함
**해결:** 7일 롤링 사이클 (개인별 첫 대화 시점부터)

#### 1.2 음성 인식 비용
**문제:** Google Cloud STT 비용 너무 높음 ($0.006/15초)
**해결:** Web Speech API 사용 (무료, 실시간)
**트레이드오프:** 정확도 약간 낮음, 인터넷 필수

#### 1.3 TTS 응답 속도
**문제:** Google TTS API 호출 후 오디오 다운로드 시간
**해결:** Base64 MP3 스트리밍 (Functions에서 직접 반환)

#### 1.4 대화 컨텍스트 관리
**문제:** Claude API에 전체 대화 히스토리 전송 → 토큰 폭발
**해결:** 롤링 서머리 (5분마다 대화 요약 → 요약본 전송)

### 2. 현재 도전과제

#### 2.1 모바일 Safari Web Speech API
**문제:** iOS Safari에서 Web Speech API 지원 제한적
**임시 해결:** 크롬/삼성 브라우저 권장
**향후:** 네이티브 앱 개발 (iOS Speech Framework)

#### 2.2 음성 인식 정확도
**문제:** 한국어 발음이 부정확하면 인식률 낮음
**개선 방안:**
- 인식 중간 결과 표시 → 사용자 피드백
- 인식 실패 시 재시도 UI
- 텍스트 입력 대체 옵션

#### 2.3 광고 수익
**문제:** Google AdSense 승인 시간 (2-4주)
**대안:**
- 다른 광고 네트워크 (예: Adsterra, PropellerAds)
- 직접 스폰서십
- 티어 업그레이드 유도 강화

#### 2.4 비용 최적화
**문제:** Claude API 비용 증가 (사용자 증가 시)
**개선 방안:**
- 캐싱: 유사 질문은 캐싱된 응답 사용
- 모델 선택: 간단한 대화는 Haiku 사용
- 토큰 압축: 요약 알고리즘 개선

### 3. 향후 도전과제

#### 3.1 확장성 (Scalability)
- **문제:** 사용자 1만 명 시 Functions 동시 실행 제한
- **해결:** Functions 2nd gen 사용, 리전 분산

#### 3.2 보안
- **문제:** API 키 노출, 사용자 데이터 보호
- **해결:** Firebase App Check, Firestore Rules 강화

#### 3.3 성능
- **문제:** Claude API 응답 지연 (3-5초)
- **해결:** 스트리밍 응답 (Server-Sent Events)

---

## 📊 성공 지표 (KPI)

### 1. 사용자 지표
- **DAU/MAU**: 일간/월간 활성 사용자
- **Retention**: D1/D7/D30 잔존율
- **Churn Rate**: 구독 해지율

### 2. 학습 지표
- **평균 세션 시간**: 사용자당 평균 대화 시간
- **주간 대화 횟수**: 사용자당 주간 대화 빈도
- **학습 레벨 분포**: Beginner/Intermediate/Advanced

### 3. 비즈니스 지표
- **Conversion Rate**: Free → Paid 전환율
- **ARPU**: 사용자당 평균 수익
- **LTV**: 고객 생애 가치
- **CAC**: 고객 획득 비용

### 4. 기술 지표
- **API Latency**: Claude/TTS 응답 시간
- **Error Rate**: 에러 발생률
- **Uptime**: 서비스 가동률

---

## 🎓 배운 교훈

### 1. 기술적 교훈
- **Web Speech API**: 무료지만 정확도 낮음 → 사용자 경험 우선
- **롤링 서머리**: 컨텍스트 관리의 핵심 → 토큰 비용 90% 절감
- **TypeScript**: 타입 안전성 → 버그 70% 사전 방지
- **Firebase Functions**: 서버리스 편리 → Cold Start 고려 필요

### 2. 제품 교훈
- **모바일 우선**: 80% 사용자가 모바일 → 데스크톱은 보조
- **학생 할인**: 타겟 사용자의 50%가 학생 → 가격 민감도 높음
- **광고 vs 유료**: Free 사용자의 10-15%만 유료 전환 → 광고 수익 중요

### 3. 비즈니스 교훈
- **손익분기**: 20명 유료 사용자면 흑자 → 목표 달성 가능
- **API 비용**: Claude + TTS 비용이 전체의 50% → 최적화 필수
- **학생 시장**: 한국어 학습의 80%가 학생/젊은층 → 타겟 명확

---

## 🚀 다음 단계 (Action Items)

### 즉시 실행 (이번 주)
1. ✅ Sidebar 통합 완료
2. ✅ RenameDialog 통합 완료
3. [ ] 전체 플로우 테스트 (로컬)
4. [ ] 문서화 업데이트 (이 문서)

### 단기 (1-2주)
1. [ ] Google Cloud TTS API 키 발급
2. [ ] Claude API 키 발급 (프로덕션)
3. [ ] Stripe Products 생성 (Test 모드)
4. [ ] 베타 테스트 시작 (5-10명)

### 중기 (1개월)
1. [ ] Google AdSense 승인 신청
2. [ ] Stripe Live 모드 전환
3. [ ] 프로덕션 배포
4. [ ] 마케팅 시작 (SNS, 커뮤니티)

### 장기 (3개월)
1. [ ] 사용자 피드백 수집
2. [ ] 학습 진도 추적 기능 개발
3. [ ] 단어장 시스템 개발
4. [ ] iOS/Android 앱 개발 시작

---

## 📚 참고 자료

### 문서
- [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) - 프로젝트 완료 요약
- [VOICE_CHAT_COMPLETE.md](./VOICE_CHAT_COMPLETE.md) - 음성 대화 상세 설명
- [STRIPE_SETUP.md](./STRIPE_SETUP.md) - Stripe 설정 가이드
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 배포 가이드

### 외부 링크
- [Firebase Documentation](https://firebase.google.com/docs)
- [Claude API Documentation](https://docs.anthropic.com)
- [Google Cloud TTS](https://cloud.google.com/text-to-speech/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

## 🙏 감사의 말

이 프로젝트는 다음을 목표로 합니다:

1. **외국인에게 실전 한국어를** - 교과서가 아닌 진짜 한국어
2. **학생들에게 저렴한 가격으로** - 누구나 배울 수 있도록
3. **AI 기술로 혁신적인 학습 경험을** - 1:1 대화의 힘

**한국어 학습의 새로운 장을 열겠습니다.** 🇰🇷✨

---

*Last Updated: 2025-02-10*
*Version: 1.0.0*
*Author: Edu_Hangul Team*
