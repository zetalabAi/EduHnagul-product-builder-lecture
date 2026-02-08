# 🚀 Stripe 계정 생성 가이드 (실전)

## 📝 준비물
- [ ] 이메일 주소
- [ ] 여권 또는 신분증 (나중에 인증용)
- [ ] Payoneer 또는 Wise 계정 (정산용, 나중에 가능)

---

## Step 1: Stripe 가입 시작

### 1-1. Stripe 홈페이지 접속
```
https://stripe.com
```

**화면**:
```
┌─────────────────────────────────────┐
│  Stripe Logo                        │
│                                     │
│  Financial infrastructure for      │
│  the internet                      │
│                                     │
│  [Start now] [Sign in]             │
└─────────────────────────────────────┘
```

### 1-2. "Start now" 클릭

---

## Step 2: 계정 정보 입력

### 2-1. 이메일 & 비밀번호
```
Email: your-email@gmail.com
Full name: Your Name
Country: United States 🇺🇸 (권장)

또는:
- Singapore 🇸🇬 (아시아 선호 시)
- Hong Kong 🇭🇰

Password: 강력한 비밀번호 (8자 이상)

[Create account] 클릭
```

**왜 United States?**
```
✅ Stripe 본사 소재지
✅ 기능 가장 많음
✅ 수수료 가장 낮음
✅ 안정적
```

### 2-2. 이메일 인증
```
받은 편지함 확인
→ Stripe에서 온 이메일
→ "Verify email" 클릭
→ 인증 완료!
```

---

## Step 3: 비즈니스 정보 입력

### 3-1. Business type 선택
```
┌─────────────────────────────────────┐
│ What type of business are you?     │
│                                     │
│ ○ Individual                        │
│   I'm self-employed or a sole      │
│   proprietor                       │
│                                     │
│ ○ Company                          │
│   I'm registering on behalf of     │
│   a company                        │
└─────────────────────────────────────┘

→ "Individual" 선택 (개인)
→ [Continue]
```

**Individual vs Company**:
```
Individual (개인):
✅ 빠름 (5분)
✅ 서류 간단
✅ 바로 시작 가능
→ 추천!

Company (법인):
⏰ 오래 걸림
📄 서류 많음 (사업자등록증 등)
💰 법인 설립 필요
```

### 3-2. 개인 정보
```
Legal first name: [이름 (여권 기준)]
Legal last name: [성 (여권 기준)]

Date of birth: [생년월일]
예: 01/15/1990 (MM/DD/YYYY)

Last 4 of SSN or full SSN: [나중에]
→ Skip for now 클릭 (미국 시민 아니면 스킵 가능)
```

### 3-3. 주소
```
Country: United States

⚠️ 주의: 실제 미국 주소 필요!

옵션 1: 가상 주소 서비스
- US Global Mail
- Anytime Mailbox
- 비용: $10-20/월

옵션 2: 친구/지인 미국 주소 빌리기

예시 주소:
Street: 123 Main Street
City: New York
State: New York
ZIP: 10001

[Continue]
```

---

## Step 4: 비즈니스 세부정보

### 4-1. What do you sell?
```
Category: Software

Industry: SaaS

Product description:
"AI-powered Korean language learning platform
with voice conversation and text chat"

Website: https://eduhangul.com (또는 임시 URL)

[Continue]
```

### 4-2. 예상 매출
```
What's your expected annual volume?

○ Less than $1,000
○ $1,000 - $10,000
● $10,000 - $100,000  ← 선택
○ $100,000 - $1,000,000
○ More than $1,000,000

Average transaction size: $20

[Continue]
```

---

## Step 5: 정산 정보 (나중에 가능)

### 5-1. Bank account 설정
```
┌─────────────────────────────────────┐
│ Add a bank account to receive      │
│ payouts                            │
│                                     │
│ We'll send you money here          │
│                                     │
│ [Add bank account]                 │
│                                     │
│ [Skip for now] ← 클릭              │
└─────────────────────────────────────┘

→ Skip for now 선택
→ 나중에 Payoneer/Wise 연결
```

---

## Step 6: Dashboard 접속! 🎉

### 6-1. 계정 생성 완료!
```
┌─────────────────────────────────────┐
│ Stripe Dashboard                    │
│                                     │
│ 🎉 Welcome to Stripe!               │
│                                     │
│ You're in test mode                │
│                                     │
│ ● Payments                          │
│ ● Products                          │
│ ● Customers                         │
│ ● Developers                        │
└─────────────────────────────────────┘
```

### 6-2. Test Mode 확인
```
좌측 상단:
🧪 Viewing test data

→ Test mode 활성화됨!
→ 실제 돈 안 나감
→ 마음껏 테스트 가능!
```

---

## Step 7: API Keys 가져오기

### 7-1. Developers 메뉴
```
좌측 메뉴: Developers 클릭
→ API keys 탭 클릭
```

### 7-2. Test Keys 복사
```
┌─────────────────────────────────────┐
│ API keys                            │
│                                     │
│ Test mode                           │
│                                     │
│ Publishable key                     │
│ pk_test_51Abc...xyz                 │
│ [Copy] ← 클릭                       │
│                                     │
│ Secret key                          │
│ sk_test_51Abc...xyz                 │
│ [Reveal] → [Copy] ← 클릭            │
└─────────────────────────────────────┘
```

### 7-3. .env 파일에 저장
```bash
cd /home/user/eduhangul/functions

# .env 파일 생성
cat > .env << 'EOF'
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_51Abc...xyz
STRIPE_PUBLISHABLE_KEY=pk_test_51Abc...xyz

# Claude API (이미 있음)
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_CLAUDE_API_KEY_HERE
EOF

echo "✅ .env 파일 생성 완료!"
```

---

## Step 8: Products 생성

### 8-1. Products 메뉴
```
좌측 메뉴: Products 클릭
→ [+ Add product] 클릭
```

### 8-2. Product 1 - Free+ 생성
```
┌─────────────────────────────────────┐
│ Add a product                       │
│                                     │
│ Name:                               │
│ Edu_Hangul Free+                    │
│                                     │
│ Description: (optional)             │
│ Remove ads, 25min/week              │
│                                     │
│ Image: (optional)                   │
│ [Upload]                            │
│                                     │
│ Pricing model:                      │
│ ● Standard pricing                  │
│                                     │
│ Price:                              │
│ $ 4.90 USD                          │
│                                     │
│ Billing period:                     │
│ ● Recurring                         │
│   └─ Monthly ▼                      │
│                                     │
│ [Add product]                       │
└─────────────────────────────────────┘

→ [Add product] 클릭
```

### 8-3. Price ID 복사
```
Product 생성 완료!

┌─────────────────────────────────────┐
│ Edu_Hangul Free+                    │
│                                     │
│ Pricing                             │
│ ├─ $4.90/month                      │
│ │  ID: price_1Abc2Def3Ghi          │
│ │  [Copy ID] ← 클릭!               │
└─────────────────────────────────────┘

→ 복사한 ID 메모장에 저장:
price_1Abc2Def3Ghi = FREE_PLUS_MONTHLY
```

### 8-4. 연간 가격 추가
```
같은 Product 페이지에서:

[+ Add another price] 클릭

Price: $49.00 USD
Billing period: Yearly

[Add price]

→ Price ID 복사:
price_4Xyz5Wvu6Tsr = FREE_PLUS_YEARLY
```

### 8-5. 나머지 Products 생성
```
Product 2: Edu_Hangul Pro
├─ $20.90/month → price_xxx2 (PRO_MONTHLY)
└─ $209.00/year → price_xxx3 (PRO_YEARLY)

Product 3: Edu_Hangul Pro+
├─ $30.90/month → price_xxx4 (PRO_PLUS_MONTHLY)
└─ $309.00/year → price_xxx5 (PRO_PLUS_YEARLY)

Product 4: Edu_Hangul Pro+ Student
├─ $25.00/month → price_xxx6 (STUDENT_MONTHLY)
└─ $200.00/year → price_xxx7 (STUDENT_YEARLY)

총 8개 Price IDs!
```

---

## Step 9: Webhook 설정

### 9-1. Webhooks 메뉴
```
Developers → Webhooks
→ [+ Add endpoint] 클릭
```

### 9-2. Endpoint URL 입력
```
⚠️ 주의: 배포 후 실제 URL 필요!

테스트용 (로컬):
http://localhost:5001/YOUR_PROJECT/us-central1/stripeWebhook

프로덕션용 (나중에):
https://us-central1-YOUR_PROJECT.cloudfunctions.net/stripeWebhook

→ 일단 Skip! 배포 후 설정
```

---

## Step 10: .env 파일 완성

### 10-1. Price IDs 추가
```bash
cd /home/user/eduhangul/functions

cat >> .env << 'EOF'

# Stripe Price IDs (복사한 것들 입력)
STRIPE_PRICE_FREE_PLUS_MONTHLY=price_1Abc2Def3Ghi
STRIPE_PRICE_FREE_PLUS_YEARLY=price_4Xyz5Wvu6Tsr
STRIPE_PRICE_PRO_MONTHLY=price_xxx2
STRIPE_PRICE_PRO_YEARLY=price_xxx3
STRIPE_PRICE_PRO_PLUS_MONTHLY=price_xxx4
STRIPE_PRICE_PRO_PLUS_YEARLY=price_xxx5
STRIPE_PRICE_PRO_PLUS_STUDENT_MONTHLY=price_xxx6
STRIPE_PRICE_PRO_PLUS_STUDENT_YEARLY=price_xxx7
EOF

echo "✅ .env 업데이트 완료!"
```

---

## Step 11: 로컬 테스트

### 11-1. 개발 서버 실행
```bash
# Terminal 1: Functions
cd functions
npm run serve

# Terminal 2: Frontend
cd ..
npm run dev
```

### 11-2. Pricing 페이지 테스트
```
브라우저 열기:
http://localhost:3000/pricing

→ "선택하기" 클릭
→ Stripe Checkout 페이지 열림
```

### 11-3. 테스트 결제
```
┌─────────────────────────────────────┐
│ Stripe Checkout                     │
│                                     │
│ Email:                              │
│ test@example.com                    │
│                                     │
│ Card information:                   │
│ 4242 4242 4242 4242                 │
│                                     │
│ MM/YY:                              │
│ 12/34                               │
│                                     │
│ CVC:                                │
│ 123                                 │
│                                     │
│ [Pay $4.90]                         │
└─────────────────────────────────────┘

→ 결제 클릭!
```

### 11-4. 성공 확인
```
Stripe Dashboard → Payments
→ 방금 결제 내역 확인 ✅

Firestore Console
→ users collection
→ subscriptionTier: "free+" 확인 ✅

성공! 🎉
```

---

## 🎉 완료 체크리스트

### Stripe 계정
- [ ] Stripe 계정 생성 (Individual)
- [ ] Test mode 확인
- [ ] API Keys 복사
- [ ] .env 파일에 저장

### Products
- [ ] Free+ Product 생성 (2개 prices)
- [ ] Pro Product 생성 (2개 prices)
- [ ] Pro+ Product 생성 (2개 prices)
- [ ] Pro+ Student 생성 (2개 prices)
- [ ] 총 8개 Price IDs 복사

### Testing
- [ ] .env 파일 완성
- [ ] 로컬 서버 실행
- [ ] /pricing 페이지 확인
- [ ] 테스트 결제 성공
- [ ] Firestore에서 구독 확인

---

## 🚀 다음 단계

### 지금 가능
✅ 로컬 테스트 완료
✅ Test mode로 개발 계속

### 배포 전 필요
⏳ Webhook 설정 (배포 후)
⏳ Live mode 활성화
⏳ Payoneer/Wise 연결

### 배포 후
⏳ Live Products 생성
⏳ Live Keys로 교체
⏳ 실제 결제 테스트

---

## 💡 테스트 카드 모음

### 성공 케이스
```
일반 성공:
4242 4242 4242 4242

3D Secure 성공:
4000 0027 6000 3184
```

### 실패 케이스
```
카드 거부:
4000 0000 0000 0002

잔액 부족:
4000 0000 0000 9995

분실 카드:
4000 0000 0000 9987
```

더 많은 테스트 카드:
```
https://stripe.com/docs/testing
```

---

## 🎊 축하합니다!

Stripe 계정 생성 및 설정 완료! 🎉

**현재 상태**:
✅ Stripe 계정 있음
✅ Test mode 작동
✅ 8개 Products 생성
✅ 로컬 테스트 가능

**다음**:
🚀 배포하고 Live mode로 전환!
