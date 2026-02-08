# 💳 Stripe 빠른 설정 (USD 전용)

## 🎯 목표
달러($)로만 결제 받기 - 전 세계 공통 가격!

---

## ✅ 장점 (USD만 사용)
```
✅ 설정 초간단 (기본 설정)
✅ 전 세계 동일 가격
✅ 환율 고민 불필요
✅ 가격 관리 쉬움
✅ 글로벌 서비스 느낌
```

**한국 사용자**:
```
$4.9 결제 → 카드사가 자동 환전 → 약 ₩6,500 청구
→ 사용자 입장에서 전혀 문제없음!
```

---

## 🚀 5분 설정 가이드

### 1️⃣ Stripe 계정 생성

#### 방법 A: 개인 (Individual) - 가장 빠름 ⭐
```
1. https://stripe.com 접속
2. "Start now" 클릭
3. 이메일 입력 → 비밀번호 설정
4. Country: United States (권장)
   또는 Singapore, Hong Kong
5. Business type: Individual
6. 개인 정보 입력
7. 은행 정보: Payoneer/Wise 가상 계좌
```

**Payoneer/Wise 가상 계좌**:
```
Stripe는 미국 은행 계좌 필요
  ↓
Payoneer/Wise에서 무료 가상 계좌 생성
  ↓
Routing Number + Account Number 받음
  ↓
Stripe에 입력
  ↓
정산 받기!
```

---

#### 방법 B: Stripe Atlas ($500) - 법인 + 계좌 자동
```
https://stripe.com/atlas

포함:
- Delaware LLC (미국 법인)
- 미국 은행 계좌
- Stripe 계정
- EIN (사업자번호)

기간: 2-3주
추천: 장기 사업, 투자 유치 계획 있을 때
```

---

### 2️⃣ Products & Prices 생성

#### Stripe Dashboard 접속
```
https://dashboard.stripe.com/test/products
```

#### Product 1: Edu_Hangul Free+
```
Dashboard → Products → Create product

Product name: Edu_Hangul Free+
Description: 광고 없이 주 25분 대화

Pricing:
├─ Recurring: Monthly
│  Amount: $4.90 USD
│  [Create]
│  → Price ID 복사: price_xxxxx1 ✅
│
└─ Recurring: Yearly
   Amount: $49.00 USD
   [Create]
   → Price ID 복사: price_xxxxx2 ✅
```

#### Product 2: Edu_Hangul Pro
```
Product name: Edu_Hangul Pro
Description: 무제한 대화 + 일 3회 분석

Pricing:
├─ Monthly: $20.90 USD → price_xxxxx3 ✅
└─ Yearly: $209.00 USD → price_xxxxx4 ✅
```

#### Product 3: Edu_Hangul Pro+
```
Product name: Edu_Hangul Pro+
Description: 무제한 대화 + 일 7회 분석

Pricing:
├─ Monthly: $30.90 USD → price_xxxxx5 ✅
└─ Yearly: $309.00 USD → price_xxxxx6 ✅
```

#### Product 4: Edu_Hangul Pro+ Student
```
Product name: Edu_Hangul Pro+ Student
Description: 학생 할인 (만 20세 이하)

Pricing:
├─ Monthly: $25.00 USD → price_xxxxx7 ✅
└─ Yearly: $200.00 USD → price_xxxxx8 ✅
```

**총 8개 Price IDs 생성 완료!** 🎉

---

### 3️⃣ Price IDs 코드에 입력

#### functions/.env 파일 생성
```bash
cd functions
cat > .env << 'EOF'
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_51Abc...xyz  # Dashboard에서 복사
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook 설정 후 복사

# Price IDs (USD)
STRIPE_PRICE_FREE_PLUS_MONTHLY=price_xxxxx1
STRIPE_PRICE_FREE_PLUS_YEARLY=price_xxxxx2
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx3
STRIPE_PRICE_PRO_YEARLY=price_xxxxx4
STRIPE_PRICE_PRO_PLUS_MONTHLY=price_xxxxx5
STRIPE_PRICE_PRO_PLUS_YEARLY=price_xxxxx6
STRIPE_PRICE_PRO_PLUS_STUDENT_MONTHLY=price_xxxxx7
STRIPE_PRICE_PRO_PLUS_STUDENT_YEARLY=price_xxxxx8
EOF
```

#### Firebase Functions Config 설정 (배포용)
```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_51Abc...xyz" \
  stripe.webhook_secret="whsec_..." \
  stripe.price_free_plus_monthly="price_xxxxx1" \
  stripe.price_free_plus_yearly="price_xxxxx2" \
  stripe.price_pro_monthly="price_xxxxx3" \
  stripe.price_pro_yearly="price_xxxxx4" \
  stripe.price_pro_plus_monthly="price_xxxxx5" \
  stripe.price_pro_plus_yearly="price_xxxxx6" \
  stripe.price_pro_plus_student_monthly="price_xxxxx7" \
  stripe.price_pro_plus_student_yearly="price_xxxxx8"
```

---

### 4️⃣ Webhook 설정

#### Webhook Endpoint 생성
```
Dashboard → Developers → Webhooks
→ Add endpoint

Endpoint URL:
https://us-central1-YOUR_PROJECT.cloudfunctions.net/stripeWebhook

Events to send:
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed

→ Add endpoint
```

#### Webhook Secret 복사
```
Signing secret: whsec_abc123...

→ .env에 추가
STRIPE_WEBHOOK_SECRET=whsec_abc123...

→ Firebase Config에도 추가
firebase functions:config:set stripe.webhook_secret="whsec_abc123..."
```

---

### 5️⃣ 테스트

#### Test Mode 확인
```
Dashboard 좌측 상단: "Viewing test data" 🧪
→ Test mode 활성화됨
```

#### 테스트 결제
```bash
# 로컬 서버 실행
npm run dev

# /pricing 페이지 접속
http://localhost:3000/pricing

# "선택하기" 클릭 → Checkout 페이지
```

#### 테스트 카드 번호
```
카드 번호: 4242 4242 4242 4242
만료일: 12/34 (미래 날짜 아무거나)
CVC: 123
우편번호: 12345
```

#### 결제 성공 확인
```
Dashboard → Payments
→ 방금 결제 내역 확인 ✅

Dashboard → Customers
→ 새 고객 생성됨 ✅

Dashboard → Subscriptions
→ 구독 활성화됨 ✅
```

---

## 6️⃣ Live Mode로 전환

### Test → Live 전환
```
1. Dashboard 좌측 상단 토글
   "Viewing test data" → "Viewing live data"

2. Activate account (계정 인증)
   - 개인정보 확인
   - 은행 계좌 연결 (Payoneer/Wise)
   - 비즈니스 세부정보 입력

3. Live Keys 복사
   Dashboard → Developers → API keys

   Secret key: sk_live_51Abc...
   → .env 업데이트
   → Firebase config 업데이트

4. Live Webhook 재생성
   - Test webhook은 Live에서 작동 안 함
   - 새로 생성 필요!
```

---

## 7️⃣ 정산 받기

### Payoneer 설정 (권장)
```
1. https://payoneer.com 가입

2. Receive → US Payment Service 신청
   → 미국 가상 은행 계좌 발급

   Routing Number: 026073150
   Account Number: 1234567890
   Account Type: Checking

3. Stripe에 입력
   Dashboard → Settings → Payouts
   → Add bank account
   → 위 정보 입력

4. 정산 받기
   Stripe → Payoneer (USD)
   → Withdraw to Korean bank (KRW)

   수수료:
   - Payoneer: $3 per transfer
   - 환전: 환율 + 2% 정도
```

### Wise 설정 (대안)
```
1. https://wise.com 가입

2. USD Balance 생성
   → 미국 은행 계좌 정보 제공받음

3. Stripe에 연결

4. 정산
   Stripe → Wise (USD)
   → Convert to KRW
   → Transfer to Korean bank

   수수료: 약 0.5-1% (Payoneer보다 저렴)
```

---

## 8️⃣ 고객 지원 설정

### 환불 정책
```
Dashboard → Settings → Customer emails
→ Customize email templates

환불 정책 명시:
- 7일 이내 100% 환불
- 이후 pro-rata 환불
- 또는 no refund (명시 필수)
```

### Customer Portal 활성화
```
Dashboard → Settings → Billing
→ Customer portal
→ Enable

고객이 직접:
- 결제 수단 변경
- 구독 취소
- 영수증 다운로드
```

---

## 9️⃣ 보안 설정

### API Keys 보호
```
✅ .env 파일은 .gitignore에 추가
✅ 절대 GitHub에 커밋하지 말 것
✅ Live key는 절대 공개하지 말 것
```

### Webhook Secret 검증
```typescript
// functions/src/stripe/webhooks.ts
// 이미 구현되어 있음! ✅

const sig = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(
  req.rawBody,
  sig,
  webhookSecret
);
// → 위조 요청 방어
```

---

## 🎯 완료 체크리스트

### Setup
- [ ] Stripe 계정 생성
- [ ] Test mode에서 8개 Products 생성
- [ ] 8개 Price IDs 복사
- [ ] .env 파일에 입력
- [ ] Webhook 설정
- [ ] Webhook secret 복사

### Testing
- [ ] 로컬 테스트 ($4.9 결제)
- [ ] Webhook 작동 확인
- [ ] 구독 생성 확인
- [ ] 구독 취소 테스트

### Production
- [ ] Live mode 활성화
- [ ] 계정 인증 완료
- [ ] Payoneer/Wise 연결
- [ ] Live Products 생성 (8개)
- [ ] Live Webhook 설정
- [ ] Live keys로 배포

---

## 💰 예상 수수료

### Stripe 수수료
```
국내 카드: 3.6% + $0.30
해외 카드: 3.9% + $0.30

예시 ($4.9 결제):
$4.9 × 3.6% = $0.18
$0.18 + $0.30 = $0.48
순수익: $4.9 - $0.48 = $4.42
```

### 정산 수수료
```
Payoneer:
- 인출: $3 per transfer
- 환전: 환율 + 약 2%

Wise:
- 인출: 무료
- 환전: 환율 + 약 0.5-1%

추천: Wise (수수료 저렴)
```

### 총 수수료
```
$100 수익 기준:

Stripe: $100 → $96.5 (3.5% 수수료)
Wise: $96.5 → ₩128,500 (환율 1,330 기준)
환전 수수료: -₩1,285 (1%)
최종: ₩127,215

실효 수수료: 약 4.5%
```

---

## 🚀 빠른 시작 (10분)

```bash
# 1. Stripe 가입
https://stripe.com
→ Sign up → Individual → US

# 2. Test Products 생성 (8개)
Dashboard → Products → Create
→ Price IDs 복사

# 3. .env 설정
cd functions
nano .env
→ Keys 입력

# 4. 로컬 테스트
npm run dev
→ /pricing 접속
→ 4242 4242 4242 4242 결제

# 5. 성공! 🎉
Dashboard에서 결제 확인

# 6. 배포
firebase deploy

# 7. Live mode 전환
Dashboard → Activate account
→ Payoneer/Wise 연결
→ Live keys 재설정
```

---

## 🎉 완료!

이제 전 세계 사용자가 달러($)로 결제할 수 있습니다!

**한국 사용자 경험**:
```
$4.9 선택
  ↓
카드사 자동 환전
  ↓
약 ₩6,500 청구
  ↓
아무 문제 없음! ✅
```

**다음**: Stripe 계정 만들기!

```
https://stripe.com
```
