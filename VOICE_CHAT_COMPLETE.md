# 🎤 Voice Chat Korean Learning App - 완료 요약

## 개요

Max.AI 스타일의 음성 기반 한국어 학습 앱. 실제 대화 수준의 자연스러운 한국어 (드라마 스타일, 속어 포함)를 학습할 수 있는 플랫폼.

## 완료된 기능 (Tasks 1-9)

### ✅ Task #1: Google Cloud STT + TTS 통합
- **Google Cloud Speech-to-Text**: 음성 인식 (실제로는 Web Speech API 사용)
- **Google Cloud Text-to-Speech Journey**: 감정 표현 가능한 고품질 음성 합성
- **Claude Sonnet 3.5**: 모든 플랜에서 최고 품질 AI 대화
- **synthesizeSpeech Function**: TTS 음성 생성
- **voiceChat Function**: 핵심 음성 대화 처리

### ✅ Task #2: 음성 대화 UI 구현
- **VoiceChat 컴포넌트**: Push-to-talk 인터페이스
- **useSpeechRecognition 훅**: Web Speech API 래퍼 (한국어 STT)
- **useVoiceChat 훅**: 음성 대화 상태 관리
- **실시간 transcript 표시**: 인식 중인 텍스트 실시간 표시
- **TTS 오디오 재생**: base64 MP3 자동 재생
- **/voice 페이지**: 음성 대화 전용 페이지

### ✅ Task #3: 크레딧 관리 시스템
- **7일 롤링 사이클**: 첫 대화부터 7일 단위 충전
- **크레딧 제한**:
  - Free: 주 15분
  - Free+: 주 25분
  - Pro/Pro+: 무제한
- **creditManager 유틸**: 크레딧 체크, 차감, 리셋
- **useUserCredits 훅**: 실시간 Firestore 리스너
- **크레딧 소진 UI**: 업그레이드 프롬프트

### ✅ Task #4: 대화 어시스턴트 기능
- **getAssistantSuggestion Function**: AI 기반 문장 제안
- **3개 한국어 문장 제안**: 상황별 자연스러운 표현
- **사용 제한**:
  - Free: 없음
  - Free+: 주 1회
  - Pro/Pro+: 무제한
- **useAssistant 훅**: 제안 요청 및 상태 관리
- **도움말 버튼 (💡)**: VoiceChat에 통합

### ✅ Task #5: 학습 성과 시스템
- **getSessionSummary Function**: 대화 통계 생성
- **기본 통계 (모든 사용자)**:
  - 총 대화 시간
  - 대화 점유율 (%)
  - 말하기 레벨
- **Pro 추가 통계**:
  - 총 메시지 수
  - 평균 문장 길이
- **SessionSummary 컴포넌트**: 중간/종료 보고서
- **endSession Function**: 대화 종료 처리

### ✅ Task #6: 대화 분석 기능 (Pro 전용)
- **getDetailedAnalysis Function**: 상세 분석
- **최소 요구사항**: 3분 OR 500자
- **분석 항목**:
  - 발음 (0-100점)
  - 어휘력 (0-100점)
  - 문법 (0-100점)
  - 유창성 (0-100점)
  - 각 항목별 피드백 리스트
  - 개선 제안
- **사용 제한**:
  - Free/Free+: 평생 1회
  - Pro: 일 3회
  - Pro+: 일 7회
- **DetailedAnalysis 컴포넌트**: 점수 카드 UI

### ✅ Task #7: 광고 시스템 (Free 플랜)
- **AdBanner 컴포넌트**: 배너 광고 (5분마다)
- **AdInterstitial 컴포넌트**: 전면 광고 (시작/종료)
- **5초 카운트다운**: 광고 건너뛰기 전 대기
- **Google AdSense 통합**: 개발/프로덕션 모드 지원
- **Free 플랜만 표시**: 조건부 렌더링
- **업그레이드 프롬프트**: "Free+ 업그레이드 ($4.9/월)"

### ✅ Task #8: Stripe 구독 시스템
- **8개 구독 플랜**:
  - Free+ Monthly/Yearly
  - Pro Monthly/Yearly
  - Pro+ Monthly/Yearly
  - Pro+ Student Monthly/Yearly (만 20세 이하)
- **createCheckoutSession Function**: Stripe Checkout 생성
- **createPortalSession Function**: 구독 관리 포털
- **stripeWebhook Function**: 구독 이벤트 처리
- **updateProfile Function**: 생년월일 업데이트
- **Pricing 페이지**: 전체 플랜 비교
- **Settings 페이지**: 프로필 및 구독 정보
- **학생 할인 자동 검증**: 만 20세 이하 자동 적용

### ✅ Task #9: 사용자 타입 및 권한 관리
- **UserDocument 확장**: 모든 음성/구독 필드
- **onUserCreate 업데이트**: 초기 크레딧 설정
- **isStudentAge 헬퍼**: 나이 계산 (만 20세 이하)
- **권한 검증**: 각 기능별 플랜 체크

## 핵심 기술 스택

### Backend (Firebase Cloud Functions)
- **Firebase Admin SDK**: Firestore, Auth
- **Anthropic Claude API**: Claude Sonnet 3.5
- **Google Cloud TTS**: Journey 음성 (감정 표현)
- **Stripe SDK**: 구독 결제
- **TypeScript**: 타입 안전성

### Frontend (Next.js 14)
- **React 18**: 컴포넌트 기반 UI
- **Web Speech API**: 브라우저 기반 STT (무료, 실시간)
- **Firebase SDK**: Auth, Firestore, Functions
- **Stripe.js**: 결제 통합
- **Tailwind CSS**: 스타일링

## 데이터 모델

### UserDocument
```typescript
{
  uid: string;
  email: string;
  displayName: string | null;
  nativeLanguage: "en" | "es" | "ja" | "zh" | "fr";

  subscriptionTier: "free" | "free+" | "pro" | "pro+";
  subscriptionStatus: "active" | "canceled" | "past_due" | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  isStudent: boolean; // 만 20세 이하
  birthDate: Timestamp | null;

  weeklyMinutesUsed: number;
  weeklyResetAt: Timestamp; // 7-day cycle

  analysisUsedLifetime: boolean; // Free/Free+ only
  dailyAnalysisUsed: number; // Pro/Pro+ only
  lastAnalysisReset: Timestamp;

  weeklyAssistantUsed: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### SessionDocument
```typescript
{
  id: string;
  userId: string;
  title: string;

  persona: "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
  responseStyle: "empathetic" | "balanced" | "blunt";
  correctionStrength: "minimal" | "strict";
  formalityLevel: "formal" | "polite" | "casual" | "intimate";

  isVoiceSession: boolean;
  totalDurationSeconds: number;
  userSpeakingSeconds: number;
  aiSpeakingSeconds: number;
  isPaused: boolean;

  rollingSummary: string | null;
  lastSummaryAt: Timestamp | null;
  summaryVersion: number;

  messageCount: number;
  lastMessageAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### MessageDocument
```typescript
{
  id: string;
  sessionId: string;
  userId: string;

  role: "user" | "assistant";
  content: string;

  audioUrl: string | null; // TTS audio URL
  durationSeconds: number | null; // Speaking duration

  modelUsed: "claude-3-5-sonnet-20241022" | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;

  createdAt: Timestamp;
}
```

## Cloud Functions (17개)

### Authentication
1. **onUserCreate**: 신규 사용자 초기화

### Voice Chat
2. **synthesizeSpeech**: TTS 음성 생성
3. **voiceChat**: 음성 대화 처리 (STT → Claude → TTS)

### Learning Features
4. **getAssistantSuggestion**: AI 문장 제안
5. **getSessionSummary**: 대화 통계
6. **endSession**: 대화 종료
7. **getDetailedAnalysis**: 상세 분석 (Pro 전용)

### Session Management
8. **createSession**: 새 대화 세션 생성
9. **updateSession**: 세션 설정 업데이트

### Stripe Payments
10. **createCheckoutSession**: Stripe Checkout 생성
11. **createPortalSession**: 구독 관리 포털
12. **stripeWebhook**: 구독 이벤트 처리

### User Management
13. **updateProfile**: 프로필 업데이트 (생년월일)

### Legacy (Text Chat)
14. **chatStream**: 텍스트 채팅
15. **translateLast**: 마지막 메시지 번역
16. **resetDailyQuotas**: 일일 할당량 리셋 (scheduled)

## 요금제 비교

| 기능 | Free | Free+ | Pro | Pro+ |
|------|------|-------|-----|------|
| **주간 대화 시간** | 15분 | 25분 | 무제한 | 무제한 |
| **광고** | ⭕ 있음 | ❌ 없음 | ❌ 없음 | ❌ 없음 |
| **대화 분석** | 평생 1회 | 평생 1회 | 일 3회 | 일 7회 |
| **대화 도우미** | ❌ 없음 | 주 1회 | 무제한 | 무제한 |
| **AI 모델** | Sonnet 3.5 | Sonnet 3.5 | Sonnet 3.5 | Sonnet 3.5 |
| **TTS 음성** | Journey | Journey | Journey | Journey |
| **월간 가격** | $0 | $4.9 | $20.9 | $30.9 |
| **연간 가격** | $0 | $59 | $209 | $309 |

**연간 할인**: Pro/Pro+ 10개월 결제 + 2개월 무료

## 주요 사용자 플로우

### 1. 회원가입 & 첫 대화
1. 사용자 회원가입 (Firebase Auth)
2. `onUserCreate` 트리거 → Firestore 사용자 문서 생성
3. Free 플랜, 주 15분 크레딧 제공
4. `/voice` 페이지 접속
5. AdInterstitial 5초 표시 (Free 플랜)
6. Push-to-talk으로 대화 시작
7. 5분마다 AdBanner 표시 (Free 플랜)
8. 대화 종료 → SessionSummary 표시
9. AdInterstitial 표시 후 종료 (Free 플랜)

### 2. 업그레이드 (Free → Pro+)
1. `/pricing` 페이지 접속
2. 플랜 선택 (예: Pro+ Yearly)
3. 학생이면 `/settings`에서 생년월일 입력
4. `updateProfile` → 만 20세 이하 확인 → `isStudent = true`
5. Pricing 페이지에서 학생 가격 표시 ($200/year)
6. "선택하기" 클릭 → `createCheckoutSession`
7. Stripe Checkout 페이지로 리디렉션
8. 결제 완료 → `stripeWebhook` 트리거
9. Firestore 사용자 문서 업데이트: `subscriptionTier = "pro+"`
10. 무제한 대화, 일 7회 분석 사용 가능

### 3. 대화 도우미 사용
1. 음성 대화 중 💡 버튼 클릭
2. `getAssistantSuggestion` 호출
3. Claude가 상황에 맞는 3개 한국어 문장 제안
4. 사용자가 제안 선택 → 말하기
5. Free+: 주 1회 제한, Pro/Pro+: 무제한

### 4. 상세 분석 요청
1. 대화 종료 → SessionSummary 표시
2. Pro 사용자: "📊 디테일 분석 보기" 버튼 클릭
3. `getDetailedAnalysis` 호출
4. 최소 요구사항 체크 (3분 OR 500자)
5. Claude가 발음/어휘/문법/유창성 분석 (0-100점)
6. DetailedAnalysis 모달 표시
7. Pro: 일 3회, Pro+: 일 7회 제한

### 5. 구독 관리
1. `/settings` 페이지 접속
2. "구독 관리" 버튼 클릭
3. `createPortalSession` 호출
4. Stripe Customer Portal로 리디렉션
5. 결제 수단 변경, 구독 취소 등
6. 구독 취소 시 `stripeWebhook` → `subscriptionTier = "free"`

## 배포 체크리스트

### Backend
- [ ] Firebase Functions 배포: `firebase deploy --only functions`
- [ ] Stripe 환경 변수 설정: `firebase functions:config:set`
- [ ] Google Cloud TTS API 활성화
- [ ] Claude API 키 설정
- [ ] Firestore 인덱스 생성
- [ ] Security Rules 검토

### Stripe
- [ ] 8개 Products & Prices 생성
- [ ] Price IDs 환경 변수 설정
- [ ] Webhook 엔드포인트 등록
- [ ] Webhook 시크릿 설정
- [ ] Customer Portal 활성화
- [ ] 이메일 알림 설정

### Frontend
- [ ] Next.js 빌드: `npm run build`
- [ ] Firebase Hosting 배포: `firebase deploy --only hosting`
- [ ] Google AdSense 계정 생성
- [ ] AdSense 클라이언트 ID 설정
- [ ] Ad 슬롯 ID 설정
- [ ] 도메인 연결

### Testing
- [ ] 회원가입 플로우
- [ ] 음성 대화 (STT → Claude → TTS)
- [ ] 크레딧 소진 & 리셋
- [ ] 대화 도우미
- [ ] 대화 분석
- [ ] 광고 표시 (Free 플랜)
- [ ] 구독 결제 (Stripe Checkout)
- [ ] 학생 할인 검증
- [ ] 구독 관리 (Customer Portal)
- [ ] Webhook 이벤트 처리

## 파일 구조

```
eduhangul/
├── functions/
│   └── src/
│       ├── auth/
│       │   ├── onUserCreate.ts
│       │   └── authMiddleware.ts
│       ├── chat/
│       │   ├── chatStream.ts
│       │   └── prompts.ts
│       ├── sessions/
│       │   └── sessionManagement.ts
│       ├── speech/
│       │   ├── voiceChat.ts
│       │   ├── synthesizeSpeech.ts
│       │   ├── creditManager.ts
│       │   ├── assistantSuggestion.ts
│       │   ├── sessionSummary.ts
│       │   └── detailedAnalysis.ts
│       ├── stripe/
│       │   ├── config.ts
│       │   ├── checkout.ts
│       │   └── webhooks.ts
│       ├── user/
│       │   └── updateProfile.ts
│       ├── utils/
│       │   ├── errors.ts
│       │   └── studentHelper.ts
│       ├── types.ts
│       └── index.ts
├── src/
│   ├── app/
│   │   ├── voice/
│   │   │   └── page.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── VoiceChat.tsx
│   │   ├── SessionSummary.tsx
│   │   ├── DetailedAnalysis.tsx
│   │   ├── AdBanner.tsx
│   │   └── AdInterstitial.tsx
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts
│   │   ├── useVoiceChat.ts
│   │   ├── useUserCredits.ts
│   │   └── useAssistant.ts
│   └── types/
│       └── speech.d.ts
├── STRIPE_SETUP.md
├── VOICE_CHAT_COMPLETE.md
└── package.json
```

## 다음 단계 (Optional)

### Task #10: 프론트엔드 UI/UX 개선
- 홈페이지 랜딩 페이지
- 온보딩 플로우
- 모바일 최적화
- 다크모드 개선
- 애니메이션 추가
- 로딩 상태 개선

### 추가 기능 아이디어
- 대화 히스토리 저장 & 재생
- 학습 진도 추적 (레벨 시스템)
- 친구 초대 시스템
- 리더보드 & 배지
- 주제별 대화 (여행, 쇼핑, 데이트 등)
- 발음 평가 (음성 인식 정확도 기반)
- 단어장 & 복습 시스템
- 대화 예약 시스템 (scheduled sessions)
- 그룹 대화 (멀티플레이어)

## 결론

**완성도**: 9개 Task 완료, MVP 준비 완료!

이제 실제 사용자 테스트를 시작할 수 있는 상태입니다. Stripe 테스트 모드로 결제 플로우를 검증한 후, Google AdSense 승인을 받고, 프로덕션 배포를 진행하세요.

**핵심 차별점**:
- ✅ 모든 플랜에서 Claude Sonnet 3.5 사용 (최고 품질)
- ✅ 감정 표현 가능한 Google Journey TTS
- ✅ 실시간 Web Speech API (무료, 빠름)
- ✅ 학생 할인 (만 20세 이하)
- ✅ 상세 대화 분석 (Pro 전용)
- ✅ AI 대화 도우미

화이팅! 🚀🇰🇷
