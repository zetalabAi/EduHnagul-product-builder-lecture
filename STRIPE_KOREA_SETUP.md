# 🇰🇷 Stripe 한국 사용자 설정 가이드

## 📋 목차
1. Stripe 계정 종류 선택
2. 한국 사용자 결제 설정
3. 통화 (KRW vs USD)
4. 결제 수단
5. 세금 처리
6. 실전 설정

---

## 1️⃣ Stripe 계정 종류 선택

### 옵션 A: 해외 법인 (미국/싱가포르 등) - 권장 ⭐
```
장점:
✅ Stripe 바로 사용 가능
✅ USD 결제 간편
✅ 글로벌 사용자 타겟
✅ 빠른 세팅

단점:
❌ 법인 설립 비용
❌ 해외 은행 계좌 필요
```

**추천 국가**:
- 🇺🇸 **미국 (Delaware LLC)**: 가장 흔함, 연 $300~500
- 🇸🇬 **싱가포르**: 아시아 타겟, 한국어 지원
- 🇭🇰 **홍콩**: 저렴, 설립 빠름

### 옵션 B: 한국 개인 사업자
```
장점:
✅ 한국 법인/사업자로 운영
✅ 한국 은행 계좌 사용
✅ 세금 처리 간단

단점:
❌ Stripe Korea 별도 신청 필요
❌ 승인 시간 소요
❌ 제한적인 기능
```

**Stripe Korea**:
- 신청: https://stripe.com/kr
- 승인: 1-2주
- 요구사항: 사업자등록증, 통신판매업 신고증

### 옵션 C: Stripe Atlas (미국 법인 + Stripe 동시 설립)
```
가격: $500 (법인 설립 + Stripe 계정)
기간: 2-3주
포함: Delaware LLC + 미국 은행 계좌 + Stripe 계정
```

**신청**:
```
https://stripe.com/atlas
```

---

## 2️⃣ 한국 사용자 결제 설정

### 핵심: 한국 사용자는 어디서든 결제 가능!

**Stripe 계정 위치는 상관없음**:
```
미국 Stripe 계정
  ↓
한국 사용자 결제 가능! ✅
  ↓
한국 신용카드로 결제
  ↓
USD로 청구됨 (또는 KRW 설정 가능)
```

---

## 3️⃣ 통화 설정 (KRW vs USD)

### 옵션 A: USD 청구 (간단) - 권장 ⭐

**설정**:
```javascript
// 모든 가격을 USD로 설정
Free+: $4.9/월
Pro: $20.9/월
Pro+: $30.9/월
```

**사용자 경험**:
```
한국 사용자가 결제하면
  ↓
신용카드사가 자동 환율 적용
  ↓
$4.9 → 약 ₩6,500 청구 (환율에 따라)
```

**장점**:
- ✅ 설정 간단
- ✅ 글로벌 통일 가격
- ✅ 환율 걱정 없음 (카드사가 처리)

**단점**:
- ❌ 환율 변동으로 가격 달라짐
- ❌ 한국 사용자 "달러 결제" 거부감

---

### 옵션 B: KRW 청구 (추천!)

**설정 방법**:

#### 1. Stripe Dashboard에서 KRW 활성화
```
Stripe Dashboard
→ Settings
→ Payment methods
→ Add currency
→ KRW (Korean Won) 선택
```

#### 2. KRW 가격 생성
```
Products & Prices에서:

Free+ Monthly:
- USD: $4.9
- KRW: ₩6,500 (별도 생성)

Pro+ Monthly:
- USD: $30.9
- KRW: ₩41,000

Pro+ Student Monthly:
- USD: $25
- KRW: ₩33,000
```

#### 3. 사용자 위치 기반 통화 선택
```typescript
// functions/src/stripe/checkout.ts
export const createCheckoutSession = functions.https.onCall(
  async (data, context) => {
    const { priceId, successUrl, cancelUrl } = data;

    // 사용자 위치 감지 (예: IP 기반)
    const userCountry = context.rawRequest.headers['cf-ipcountry'] || 'US';

    // 한국 사용자면 KRW, 아니면 USD
    const currency = userCountry === 'KR' ? 'krw' : 'usd';

    // 통화에 맞는 Price ID 선택
    const actualPriceId = currency === 'krw'
      ? priceId.replace('_usd', '_krw')  // 예: price_free_plus_monthly_krw
      : priceId;

    const session = await stripe.checkout.sessions.create({
      // ... existing code
      line_items: [{ price: actualPriceId, quantity: 1 }],
    });

    return { sessionId: session.id, url: session.url };
  }
);
```

#### 4. 프론트엔드에서 표시
```tsx
// src/app/pricing/page.tsx
const [currency, setCurrency] = useState<'usd' | 'krw'>('krw');

// 한국 IP면 기본 KRW
useEffect(() => {
  fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => {
      setCurrency(data.country_code === 'KR' ? 'krw' : 'usd');
    });
}, []);

return (
  <div>
    {/* 통화 토글 */}
    <button onClick={() => setCurrency('krw')}>₩ KRW</button>
    <button onClick={() => setCurrency('usd')}>$ USD</button>

    {/* 가격 표시 */}
    <p>
      {currency === 'krw' ? '₩6,500' : '$4.9'} / 월
    </p>
  </div>
);
```

---

## 4️⃣ 한국 사용자 선호 결제 수단

### Stripe에서 지원하는 한국 결제 수단

#### 1. 신용카드/체크카드 (기본) ✅
```
지원 카드:
- Visa
- Mastercard
- American Express
- JCB

한국 발급 카드 모두 사용 가능!
```

**설정**: 자동 활성화됨

---

#### 2. 카카오페이 (KakaoPay) 🟡
```
Status: Stripe에서 지원 안 함 ❌
대안: 포트원(PortOne/아임포트) 연동 필요
```

---

#### 3. 네이버페이 (Naver Pay) 🟢
```
Status: Stripe에서 지원 안 함 ❌
대안: 포트원(PortOne) 연동 필요
```

---

#### 4. 토스페이 (Toss Pay) 💙
```
Status: Stripe에서 지원 안 함 ❌
대안: 토스페이먼츠 직접 연동
```

---

### 💡 추천 전략

#### Phase 1: Stripe만 사용 (빠른 출시)
```
지원 결제 수단:
✅ 신용카드/체크카드 (Visa, Mastercard)

장점:
- 빠른 구현
- 글로벌 통용
- 한국 사용자도 대부분 카드 소유

단점:
- 간편결제 없음
```

#### Phase 2: 한국 간편결제 추가 (나중에)
```
포트원(PortOne) 연동:
- 카카오페이
- 네이버페이
- 토스
- 페이코

또는:

토스페이먼츠 직접 연동
```

---

## 5️⃣ 세금 처리 (VAT/부가세)

### 한국 부가세 (10%)

#### Stripe Tax 사용
```
Stripe Dashboard
→ Settings
→ Tax
→ Enable Stripe Tax
→ Korea 추가
→ VAT 10% 자동 계산
```

**자동 처리**:
```
사용자가 ₩6,500 결제하면
  ↓
₩5,909 (상품 가격)
₩591 (부가세 10%)
  ↓
합계: ₩6,500
```

---

#### 수동 처리 (Stripe Tax 없이)
```typescript
// 가격에 부가세 포함해서 설정
const priceWithVAT = Math.round(basePrice * 1.1);

// 예:
// Free+: ₩5,909 + 10% = ₩6,500
// Pro: ₩18,909 + 10% = ₩20,800
// Pro+: ₩37,273 + 10% = ₩41,000
```

---

## 6️⃣ 실전 설정 단계

### Step 1: Stripe 계정 선택

#### 가장 빠른 방법 (개인 개발자)
```
1. Stripe.com 가입 (해외 계정)
2. 비즈니스 타입: Individual
3. 국가: United States (또는 Singapore)
4. 은행: Payoneer/Wise 가상 계좌
```

**Payoneer/Wise 사용**:
```
Stripe → Payoneer/Wise (USD) → 한국 은행 (KRW 환전)
수수료: 약 1-2%
```

---

### Step 2: Products & Prices 생성

#### KRW 가격 계산
```
환율: $1 = ₩1,330 (2024년 기준)

Free+ Monthly:
- USD: $4.9
- KRW: ₩6,500 (부가세 포함)

Free+ Yearly:
- USD: $49
- KRW: ₩65,000

Pro Monthly:
- USD: $20.9
- KRW: ₩27,800

Pro Yearly:
- USD: $209
- KRW: ₩278,000

Pro+ Monthly:
- USD: $30.9
- KRW: ₩41,000

Pro+ Yearly:
- USD: $309
- KRW: ₩410,000

Pro+ Student Monthly:
- USD: $25
- KRW: ₩33,000

Pro+ Student Yearly:
- USD: $200
- KRW: ₩265,000
```

**깔끔한 가격 (권장)**:
```
Free+: ₩6,500 (월) / ₩65,000 (년)
Pro: ₩28,000 (월) / ₩280,000 (년)
Pro+: ₩41,000 (월) / ₩410,000 (년)
Pro+ 학생: ₩33,000 (월) / ₩265,000 (년)
```

---

### Step 3: Stripe에서 Price 생성

```
Stripe Dashboard → Products → Add product

Product 1: Edu_Hangul Free+
├─ Price 1: ₩6,500/month (recurring) [ID: price_free_plus_monthly_krw]
└─ Price 2: ₩65,000/year (recurring) [ID: price_free_plus_yearly_krw]

Product 2: Edu_Hangul Pro
├─ Price 1: ₩28,000/month [ID: price_pro_monthly_krw]
└─ Price 2: ₩280,000/year [ID: price_pro_yearly_krw]

Product 3: Edu_Hangul Pro+
├─ Price 1: ₩41,000/month [ID: price_pro_plus_monthly_krw]
└─ Price 2: ₩410,000/year [ID: price_pro_plus_yearly_krw]

Product 4: Edu_Hangul Pro+ 학생
├─ Price 1: ₩33,000/month [ID: price_pro_plus_student_monthly_krw]
└─ Price 2: ₩265,000/year [ID: price_pro_plus_student_yearly_krw]
```

---

### Step 4: 코드 업데이트

#### stripe/config.ts
```typescript
export const PRICE_IDS_KRW = {
  FREE_PLUS_MONTHLY: "price_free_plus_monthly_krw",
  FREE_PLUS_YEARLY: "price_free_plus_yearly_krw",
  PRO_MONTHLY: "price_pro_monthly_krw",
  PRO_YEARLY: "price_pro_yearly_krw",
  PRO_PLUS_MONTHLY: "price_pro_plus_monthly_krw",
  PRO_PLUS_YEARLY: "price_pro_plus_yearly_krw",
  PRO_PLUS_STUDENT_MONTHLY: "price_pro_plus_student_monthly_krw",
  PRO_PLUS_STUDENT_YEARLY: "price_pro_plus_student_yearly_krw",
};
```

---

### Step 5: 프론트엔드 가격 표시

```tsx
// src/app/pricing/page.tsx
const PRICES = {
  usd: {
    free_plus_monthly: 4.9,
    free_plus_yearly: 49,
    pro_monthly: 20.9,
    pro_yearly: 209,
    pro_plus_monthly: 30.9,
    pro_plus_yearly: 309,
    student_monthly: 25,
    student_yearly: 200,
  },
  krw: {
    free_plus_monthly: 6500,
    free_plus_yearly: 65000,
    pro_monthly: 28000,
    pro_yearly: 280000,
    pro_plus_monthly: 41000,
    pro_plus_yearly: 410000,
    student_monthly: 33000,
    student_yearly: 265000,
  }
};

// 한국 사용자 자동 감지
const [currency, setCurrency] = useState<'usd' | 'krw'>('krw');

return (
  <div>
    <p>
      {currency === 'krw' ? '₩' : '$'}
      {PRICES[currency].free_plus_monthly.toLocaleString()}
      / 월
    </p>
  </div>
);
```

---

## 7️⃣ 추천 설정 (최종)

### 🎯 개인 개발자 (빠른 출시)
```
1. Stripe.com 해외 계정 가입
2. KRW 통화 활성화
3. KRW 가격으로 Products 생성
4. 결제 수단: 신용카드만 (기본)
5. 정산: Payoneer/Wise → 한국 은행
```

**장점**:
- ✅ 30분 안에 설정 완료
- ✅ 바로 결제 받기 가능
- ✅ 한국 사용자 원화 결제

---

### 🏢 법인 (장기 운영)
```
1. Stripe Atlas로 미국 법인 설립 ($500)
2. 미국 은행 계좌 자동 생성
3. KRW + USD 멀티 통화 설정
4. Stripe Tax로 세금 자동 처리
5. 글로벌 확장 준비
```

---

## 8️⃣ 자주 묻는 질문

### Q: 한국 사용자는 꼭 KRW로 결제해야 하나?
```
A: 아니요! USD로 해도 됩니다.
   한국 카드로 USD 결제 가능
   → 카드사가 자동 환전
   → 편리함
```

### Q: Stripe Korea는 꼭 신청해야 하나?
```
A: 아니요! 해외 Stripe 계정으로도
   한국 사용자 결제 받기 가능

   Stripe Korea는:
   - 한국 법인만 신청 가능
   - 승인 오래 걸림
   - 기능 제한적
```

### Q: 카카오페이 안 되나요?
```
A: Stripe는 지원 안 함

   대안:
   1. 일단 신용카드만 (대부분 OK)
   2. 나중에 포트원 추가 연동
```

### Q: 정산은 어떻게?
```
A: Stripe → Payoneer/Wise → 한국 은행

   수수료:
   - Stripe: 3.4% + ₩30
   - Payoneer: 1-2%
   - 총 약 5% 정도
```

---

## 🚀 빠른 시작 가이드

### 30분 안에 한국 사용자 결제 받기

```bash
# 1. Stripe 가입
https://dashboard.stripe.com/register

# 2. KRW Products 생성
Dashboard → Products → Add product
가격: ₩6,500/월 (Free+)

# 3. Price ID 복사
price_xxxxxxxxxxxxx

# 4. 코드에 입력
# functions/src/stripe/config.ts
STRIPE_PRICE_FREE_PLUS_MONTHLY_KRW = "price_xxxxx"

# 5. 테스트
npm run dev
/pricing 페이지 → "선택하기" 클릭

# 6. 테스트 카드로 결제
카드 번호: 4242 4242 4242 4242
만료: 12/34
CVC: 123

# 7. 성공! 🎉
```

---

## 📋 체크리스트

### 배포 전
- [ ] Stripe 계정 생성
- [ ] KRW 통화 활성화
- [ ] 8개 KRW Products 생성
- [ ] Price IDs 코드에 입력
- [ ] 로컬 테스트 완료

### 배포 후
- [ ] 실제 카드로 결제 테스트
- [ ] 정산 확인 (Payoneer/Wise)
- [ ] 세금 처리 확인
- [ ] 환불 정책 설정

---

## 🎉 완료!

이제 한국 사용자가 원화(₩)로 결제할 수 있습니다!

**다음**: 실제 Stripe 계정 만들고 Products 생성하기
