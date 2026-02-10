# 🚀 Edu_Hangul 배포 가이드

## 📋 체크리스트

### 1. 환경 변수 설정

#### Firebase Functions (.env)
```bash
cd functions
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-your-key-here
STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-secret-here
STRIPE_PRICE_FREE_PLUS_MONTHLY=price_xxx
STRIPE_PRICE_FREE_PLUS_YEARLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_PRO_PLUS_MONTHLY=price_xxx
STRIPE_PRICE_PRO_PLUS_YEARLY=price_xxx
STRIPE_PRICE_PRO_PLUS_STUDENT_MONTHLY=price_xxx
STRIPE_PRICE_PRO_PLUS_STUDENT_YEARLY=price_xxx
EOF
```

#### Firebase Config
```bash
firebase functions:config:set \
  anthropic.api_key="sk-ant-your-key-here" \
  stripe.secret_key="sk_live_your-key-here" \
  stripe.webhook_secret="whsec_your-secret-here"
```

### 2. Google Cloud APIs 활성화

```bash
# Google Cloud Console에서 활성화
# https://console.cloud.google.com/apis/library

✅ Cloud Text-to-Speech API
✅ Cloud Functions API
✅ Cloud Firestore API
✅ Firebase Authentication API
```

### 3. Stripe 설정

#### Products & Prices 생성
STRIPE_SETUP.md 참고하여 6개 상품 생성:

1. **Free+ Monthly**: $4.9/월
2. **Free+ Yearly**: $59/년
3. **Pro Monthly**: $20.9/월
4. **Pro Yearly**: $209/년
5. **Pro+ Monthly**: $30.9/월
6. **Pro+ Yearly**: $309/년

#### Webhook 설정
```
URL: https://us-central1-YOUR_PROJECT.cloudfunctions.net/stripeWebhook
Events:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
```

### 4. Google AdSense 설정

#### 1. AdSense 계정 생성
https://www.google.com/adsense/

#### 2. 사이트 추가 및 승인 대기

#### 3. Ad 단위 생성
- **Interstitial Ad**: 전면 광고 (시작/종료)
- **Display Ad**: 배너 광고 (5분마다)

#### 4. 코드 수정
```tsx
// src/app/layout.tsx
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_REAL_ID"
  crossOrigin="anonymous"
></script>

// src/components/AdBanner.tsx
data-ad-client="ca-pub-YOUR_REAL_ID"
data-ad-slot="YOUR_BANNER_SLOT_ID"

// src/components/AdInterstitial.tsx
data-ad-client="ca-pub-YOUR_REAL_ID"
data-ad-slot="YOUR_INTERSTITIAL_SLOT_ID"
```

---

## 🏗️ 빌드 & 테스트

### Functions 빌드
```bash
cd functions
npm install
npm run build

# 테스트 (로컬)
npm run serve
```

### Frontend 빌드
```bash
cd ..
npm install
npm run build

# 테스트 (로컬)
npm run dev
```

### 전체 테스트 항목
```
✅ 회원가입/로그인
✅ 음성 대화 (STT → Claude → TTS)
✅ 텍스트 채팅 (Claude)
✅ 크레딧 소진 및 리셋
✅ 대화 도우미 (💡)
✅ 대화 요약 (📊)
✅ 상세 분석 (Pro, 📊)
✅ 광고 표시 (Free 플랜)
✅ Stripe Checkout
✅ 학생 할인 검증
✅ 구독 관리 (Portal)
✅ 모바일 반응형
✅ 데스크톱 레이아웃
```

---

## 🚀 배포

### 1. Firebase Functions 배포
```bash
cd functions
npm run build

# 전체 Functions 배포
firebase deploy --only functions

# 특정 Function만 배포
firebase deploy --only functions:textChat
firebase deploy --only functions:voiceChat
```

### 2. Firebase Hosting 배포
```bash
cd ..
npm run build

firebase deploy --only hosting
```

### 3. 전체 배포
```bash
firebase deploy
```

### 4. Firestore Indexes 배포
```bash
firebase deploy --only firestore:indexes
```

### 5. Firestore Rules 배포
```bash
firebase deploy --only firestore:rules
```

---

## 🔐 보안 체크리스트

### API Keys
```
✅ .env 파일은 .gitignore에 추가됨
✅ Firebase config는 환경 변수로 설정
✅ Stripe 키는 Functions config에 저장
✅ Claude API 키는 안전하게 보관
```

### Firestore Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Sessions
    match /sessions/{sessionId} {
      allow read: if request.auth != null &&
                    resource.data.userId == request.auth.uid;
      allow write: if request.auth != null &&
                     request.resource.data.userId == request.auth.uid;
    }

    // Messages
    match /messages/{messageId} {
      allow read: if request.auth != null &&
                    resource.data.userId == request.auth.uid;
      allow create: if request.auth != null &&
                      request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### CORS 설정
```typescript
// functions/src/index.ts
import * as cors from 'cors';
const corsHandler = cors({ origin: true });

export const yourFunction = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Your code
  });
});
```

---

## 📊 모니터링

### Firebase Console
```
https://console.firebase.google.com/project/YOUR_PROJECT

✅ Functions 로그
✅ Firestore 사용량
✅ Authentication 통계
✅ Hosting 트래픽
```

### Stripe Dashboard
```
https://dashboard.stripe.com

✅ 구독 현황
✅ 결제 내역
✅ Webhook 로그
✅ 고객 관리
```

### Google Cloud Console
```
https://console.cloud.google.com

✅ TTS API 사용량
✅ Functions 실행 시간
✅ 비용 모니터링
```

---

## 💰 예상 비용 (월간)

### Firebase (Spark/Blaze Plan)
```
Firestore:
- Read: 50K/일 = 무료
- Write: 20K/일 = 무료
- Storage: 1GB = 무료

Functions:
- 호출: 2M/월 = 무료
- 실행 시간: 초과분 = ~$5-20

Hosting:
- 10GB/월 = 무료
- SSL 인증서 = 무료

총: $0-20/월 (사용량에 따라)
```

### Google Cloud TTS
```
Journey 음성:
- $16 per 1M characters

예상 사용량:
- 100 사용자 × 주 15분 × 4주 = 6000분
- 평균 응답 100자 × 60회 = 6000자/사용자
- 100 × 6000 = 600K 자/월
- 비용: ~$10/월

총: $10-50/월 (사용자 수에 따라)
```

### Claude API
```
Sonnet 3.5:
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

예상 사용량:
- 100 사용자 × 60 메시지/월
- 평균 500 tokens/대화
- 6000 대화 × 500 = 3M tokens
- 비용: ~$50/월

총: $50-200/월 (사용자 수에 따라)
```

### Stripe
```
결제 수수료:
- 2.9% + $0.30 per transaction

예상:
- 20 유료 사용자 × $20 평균
- 수수료: ~$17/월

총: $15-50/월
```

### 총 예상 비용
```
초기 (100 사용자):
- Firebase: $10
- Google TTS: $10
- Claude API: $50
- Stripe: $15
총: ~$85/월

성장 후 (500 사용자):
- Firebase: $30
- Google TTS: $50
- Claude API: $250
- Stripe: $75
총: ~$405/월

유료 수익:
- Free+: 20명 × $4.9 = $98
- Pro: 10명 × $20.9 = $209
- Pro+: 5명 × $30.9 = $154.5
총: ~$461/월

순익: $461 - $405 = $56/월 (500 사용자 기준)
```

---

## 🎯 출시 전 최종 체크

### 기능 테스트
```
✅ 회원가입 플로우
✅ 음성 대화 (모바일)
✅ 텍스트 채팅 (데스크톱)
✅ 크레딧 시스템
✅ 광고 표시
✅ 결제 플로우
✅ 학생 할인
✅ 구독 관리
```

### 성능 테스트
```
✅ 페이지 로드 시간 < 3초
✅ TTS 응답 시간 < 2초
✅ Claude 응답 시간 < 5초
✅ 모바일 반응 속도
```

### 보안 테스트
```
✅ Firestore Rules 검증
✅ API 키 보호
✅ HTTPS 강제
✅ CSRF 방어
```

### UX 테스트
```
✅ 모바일 터치 영역
✅ 키보드 단축키 (데스크톱)
✅ 에러 메시지 명확성
✅ 로딩 상태 표시
```

---

## 🚦 배포 순서

### Phase 1: 테스트 배포
```bash
# 1. Functions 배포
firebase deploy --only functions --project=YOUR_PROJECT

# 2. Hosting 배포
firebase deploy --only hosting --project=YOUR_PROJECT

# 3. 테스트 도메인 확인
https://YOUR_PROJECT.web.app
```

### Phase 2: 도메인 연결
```bash
# Firebase Hosting 커스텀 도메인
firebase hosting:channel:deploy preview

# 도메인 추가
# https://console.firebase.google.com/project/YOUR_PROJECT/hosting/sites
```

### Phase 3: 프로덕션 배포
```bash
# Stripe Live 모드로 전환
# Google AdSense 승인 완료 후

# 전체 배포
firebase deploy --project=YOUR_PROJECT

# DNS 설정
# A Record: Firebase IP
# TXT Record: Verification
```

---

## 📱 PWA 설정 (Optional)

### manifest.json 생성
```json
{
  "name": "Edu_Hangul - 한국어 학습",
  "short_name": "Edu_Hangul",
  "description": "AI와 음성 대화로 배우는 한국어",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#1F2937",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker (Next.js)
```bash
npm install next-pwa
```

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  // existing config
});
```

---

## 🎉 완료!

배포 완료 후:
1. ✅ 실제 사용자 테스트
2. ✅ 피드백 수집
3. ✅ 버그 수정
4. ✅ 성능 모니터링
5. ✅ 비용 최적화

**성공적인 출시를 기원합니다!** 🚀🇰🇷
