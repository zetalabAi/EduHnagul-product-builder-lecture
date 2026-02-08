# 🎤 Google Cloud TTS API 설정 가이드

## 1. Google Cloud Console 접속

### Firebase 프로젝트와 연결
Firebase Functions는 **자동으로 Google Cloud 프로젝트를 생성**합니다.

1. Firebase Console 접속
   ```
   https://console.firebase.google.com/
   ```

2. 프로젝트 설정 → 일반 탭
   ```
   프로젝트 ID: edu-hangul-mvp-af962 (예시)
   ```

3. 이 프로젝트 ID로 Google Cloud Console 접속
   ```
   https://console.cloud.google.com/
   ```

---

## 2. Text-to-Speech API 활성화

### 옵션 A: 직접 링크 (빠름)
```
https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
```

### 옵션 B: 수동으로 찾기
1. 좌측 메뉴 → **APIs & Services** → **Library**
2. 검색: "Text-to-Speech"
3. **Cloud Text-to-Speech API** 선택
4. **ENABLE** 버튼 클릭

---

## 3. 인증 방법 선택

Google Cloud에는 **2가지 인증 방법**이 있습니다:

### 🔑 방법 A: Service Account Key (권장)
**장점**:
- Firebase Functions에서 자동 인증
- 별도 키 파일 불필요
- 배포 시 자동 권한 설정

**설정**:
```bash
# Firebase Functions는 기본적으로
# default service account 사용
# 별도 설정 불필요!
```

### 🔐 방법 B: API Key (간단, 덜 안전)
**장점**: 간단
**단점**: 공개 노출 위험

**설정**:
1. APIs & Services → Credentials
2. Create Credentials → API Key
3. 키 복사
4. Restrict key (권장):
   - API restrictions → Cloud Text-to-Speech API만 선택
   - Application restrictions → None (또는 IP 제한)

---

## 4. Firebase Functions에서 사용

### 🎯 방법 A: Default Service Account (권장)

Firebase Functions는 **자동으로** Google Cloud 서비스에 접근할 수 있습니다!

**코드 (이미 완료됨)**:
```typescript
// functions/src/speech/synthesizeSpeech.ts
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// 별도 인증 불필요! Firebase Functions가 자동 인증
const ttsClient = new TextToSpeechClient();
```

**권한 확인**:
```bash
# Google Cloud Console
IAM & Admin → Service Accounts

# 찾기:
# PROJECT_ID@appspot.gserviceaccount.com
# 역할: Editor (자동 부여됨)
```

**끝!** 추가 설정 필요 없음! ✅

---

### 🔐 방법 B: API Key 사용 (선택)

**1. API Key 생성**
```
Google Cloud Console
→ APIs & Services
→ Credentials
→ Create Credentials
→ API Key
```

**2. Key 복사**
```
AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**3. Firebase Functions Config 설정**
```bash
firebase functions:config:set \
  google.tts_api_key="AIzaSyC-xxxxx"
```

**4. 코드 수정**
```typescript
import * as functions from 'firebase-functions';

const apiKey = functions.config().google?.tts_api_key;

const ttsClient = new TextToSpeechClient({
  apiKey: apiKey,
});
```

---

## 5. 로컬 개발 환경 설정

### Firebase Emulator 사용 시

**옵션 A: gcloud CLI 인증 (권장)**
```bash
# 1. gcloud CLI 설치
# Mac
brew install google-cloud-sdk

# Windows
# https://cloud.google.com/sdk/docs/install

# 2. 로그인
gcloud auth login

# 3. Application Default Credentials 설정
gcloud auth application-default login

# 4. 프로젝트 설정
gcloud config set project PROJECT_ID

# 5. Functions 실행
cd functions
npm run serve
```

**옵션 B: Service Account Key 파일 (로컬 전용)**
```bash
# 1. Service Account Key 생성
# Google Cloud Console
# → IAM & Admin
# → Service Accounts
# → PROJECT_ID@appspot.gserviceaccount.com
# → Keys 탭
# → Add Key → Create new key → JSON

# 2. 파일 다운로드
# service-account-key.json

# 3. 환경 변수 설정
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# 4. Functions 실행
cd functions
npm run serve
```

**⚠️ 주의**:
- service-account-key.json은 **절대 Git에 커밋하지 말 것!**
- .gitignore에 추가:
  ```
  service-account-key.json
  *.json
  ```

---

## 6. 비용 확인

### Text-to-Speech API 가격 (2024)
```
Standard voices:
- $4 per 1M characters

WaveNet voices:
- $16 per 1M characters

Journey voices (우리가 사용):
- $16 per 1M characters

Neural2 voices:
- $16 per 1M characters
```

### 무료 한도
```
Standard: 0-4M characters/월 무료
WaveNet/Journey: 0-1M characters/월 무료
```

### 예상 사용량
```
사용자 100명 × 주 15분 = 1,500분/주 = 6,000분/월
평균 응답 100자 × 60턴 = 6,000자/사용자
100명 × 6,000자 = 600,000자/월

비용: 무료 (1M 이하) 🎉
```

### 비용 모니터링
```
Google Cloud Console
→ Billing
→ Reports
→ Text-to-Speech API 필터
```

---

## 7. 문제 해결

### ❌ 에러: "The caller does not have permission"

**원인**: API가 활성화되지 않음

**해결**:
```bash
# Google Cloud Console에서 Text-to-Speech API 활성화
# 또는 CLI로:
gcloud services enable texttospeech.googleapis.com
```

---

### ❌ 에러: "Could not load the default credentials"

**원인**: 로컬 환경에서 인증 정보 없음

**해결 (옵션 1 - 권장)**:
```bash
gcloud auth application-default login
```

**해결 (옵션 2)**:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

---

### ❌ 에러: "Quota exceeded"

**원인**: 무료 한도 초과

**해결**:
```bash
# Google Cloud Console
# → Billing
# → 결제 계정 연결 (신용카드)
# → APIs & Services → Quotas
# → Text-to-Speech API quota 확인
```

---

## 8. 최종 체크리스트

### 배포 전
- [x] Text-to-Speech API 활성화
- [x] Firebase Functions 배포 권한 확인
- [x] 로컬 테스트 완료
- [ ] Billing 계정 연결 (무료 한도 초과 시)

### 배포 후
- [ ] Cloud Console에서 API 호출 확인
- [ ] 비용 모니터링 설정
- [ ] Quota 알림 설정

---

## 9. 요약

### 💡 가장 간단한 방법 (권장)

**Firebase Functions 사용 시**:
```
1. Google Cloud Console 접속
2. Text-to-Speech API 활성화
3. 끝! (Firebase가 자동 인증)
```

**코드에서**:
```typescript
// 이미 완료됨!
const ttsClient = new TextToSpeechClient();
// 별도 키 설정 불필요
```

**로컬 개발 시**:
```bash
gcloud auth application-default login
npm run serve
```

---

## 🎉 완료!

Google Cloud TTS API 설정 완료!

**다음**: Claude API 키 설정하기
