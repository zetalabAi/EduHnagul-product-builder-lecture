# Edu_Hangul MVP - System Architecture

## Technology Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase SDK** (Auth, Firestore client)

### Backend
- **Firebase Cloud Functions** (TypeScript, Node.js 20)
- **Firestore** (document database)
- **Firebase Authentication** (Google, Microsoft, Apple sign-in)
- **Gemini API** (server-side only via Cloud Functions)
- **Stripe** (subscription payments + webhooks)

### Hosting
- **Firebase Hosting** (frontend)
- **Cloud Functions** (serverless backend)

## Security Principles

1. **API Keys Server-Side Only**
   - Gemini API key stored in Cloud Functions config
   - Stripe secret key in Functions environment
   - Never expose keys to client

2. **Firestore Ownership Rules**
   - Users can only read/write their own sessions and messages
   - Strict `request.auth.uid` validation
   - No public read access

3. **Authentication Required**
   - All Cloud Functions require Firebase Auth token
   - Verify `context.auth.uid` on every request
   - Reject unauthenticated calls

## Firestore Collections

### `users/{userId}`

```typescript
{
  uid: string;                    // Firebase Auth UID
  email: string;                  // User email
  displayName: string | null;     // Display name from provider
  photoURL: string | null;        // Profile photo URL
  nativeLanguage: "en" | "es" | "ja" | "zh" | "fr";

  // Subscription
  subscriptionTier: "free" | "pro";
  subscriptionStatus: "active" | "canceled" | "past_due" | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  // Trial
  trialUsed: boolean;
  trialStartedAt: Timestamp | null;
  trialEndedAt: Timestamp | null;

  // Quota
  dailyMessagesUsed: number;      // Reset daily for free users
  lastQuotaReset: Timestamp;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `stripeCustomerId` (for webhook lookups)

### `sessions/{sessionId}`

```typescript
{
  id: string;                     // Auto-generated session ID
  userId: string;                 // Owner UID
  title: string;                  // Auto-generated from first message

  // Settings
  persona: "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
  responseStyle: "empathetic" | "balanced" | "blunt";
  correctionStrength: "minimal" | "strict";

  // Memory
  rollingSummary: string | null;  // Compressed conversation context
  lastSummaryAt: Timestamp | null;

  // Metadata
  messageCount: number;
  lastMessageAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `userId, lastMessageAt desc` (for user's session list)

### `messages/{messageId}`

```typescript
{
  id: string;                     // Auto-generated message ID
  sessionId: string;              // Parent session
  userId: string;                 // Owner UID (for security)

  role: "user" | "assistant";
  content: string;                // Message text

  // Metadata
  modelUsed: "gemini-1.5-flash" | "gemini-2.0-flash-exp" | null;
  inputTokens: number | null;     // Gemini usage
  outputTokens: number | null;

  createdAt: Timestamp;
}
```

**Indexes:**
- `sessionId, createdAt asc` (for chat timeline)
- `userId, createdAt desc` (for user's all messages)

## Cloud Functions

### 1. `chatStream` (HTTPS Callable, SSE)

**Purpose:** Stream AI response for a user message.

**Flow:**
1. Verify auth token
2. Load session + last N messages
3. Check quota (free tier) or trial status
4. Assemble prompt (system + persona + style + corrections + memory)
5. Determine model (free: Flash 1.5, pro/trial: Flash 2.0 Exp)
6. Stream Gemini response via SSE
7. Save user + assistant messages to Firestore
8. Update session metadata (title, messageCount, lastMessageAt)
9. Increment dailyMessagesUsed (free users)
10. Trigger rolling summary if messageCount % 20 === 0

**Quota Logic:**
- Free: Check `dailyMessagesUsed < 20`
- Pro: Skip quota check
- Trial: Check `trialUsed && now < trialEndedAt && trialMessagesUsed < 50`

### 2. `translateLast` (HTTPS Callable)

**Purpose:** Translate last user or assistant message to native language.

**Flow:**
1. Verify auth token
2. Fetch target message from Firestore
3. Get user's `nativeLanguage`
4. Call Gemini Flash with translation prompt
5. Return translated text (do not save)

### 3. `createStripeCheckout` (HTTPS Callable)

**Purpose:** Create Stripe Checkout session for Pro subscription.

**Flow:**
1. Verify auth token
2. Get or create Stripe customer ID
3. Create Checkout session with:
   - Price: `$9.99/month`
   - Mode: `subscription`
   - Success URL, cancel URL
4. Return checkout URL

### 4. `stripeWebhook` (HTTPS)

**Purpose:** Handle Stripe events (subscription created, updated, canceled).

**Events Handled:**
- `checkout.session.completed` → activate Pro, set `subscriptionTier: "pro"`
- `customer.subscription.updated` → update status
- `customer.subscription.deleted` → downgrade to Free
- `invoice.payment_failed` → mark `past_due`

**Flow:**
1. Verify Stripe signature
2. Parse event
3. Update user document in Firestore
4. Return 200 OK

### 5. `resetDailyQuotas` (Scheduled)

**Purpose:** Reset free users' daily message quotas.

**Schedule:** Every day at 00:00 UTC (cron: `0 0 * * *`)

**Flow:**
1. Query all users with `subscriptionTier === "free"`
2. Batch update:
   - `dailyMessagesUsed = 0`
   - `lastQuotaReset = now`

## Prompt Assembly Strategy

### System Instruction (Base)

```
You are a Korean language learning partner. Your goal is to help the user practice Korean through natural conversation. Respond primarily in Korean, but provide corrections and explanations in the user's native language when needed.
```

### Persona Injection

Append persona-specific instructions:

- **Same-sex Friend**: "Act as a casual, supportive same-sex friend. Use informal speech (반말) when appropriate."
- **Opposite-sex Friend**: "Act as a friendly, helpful opposite-sex friend. Use polite speech (존댓말)."
- **Boyfriend**: "Act as a caring, affectionate boyfriend. Use warm, supportive language."
- **Girlfriend**: "Act as a sweet, encouraging girlfriend. Use affectionate, supportive language."

### Style Injection

- **Empathetic**: "Be warm, patient, and encouraging. Praise effort frequently."
- **Balanced**: "Be clear and practical. Provide balanced feedback."
- **Blunt**: "Be direct and honest. Prioritize clarity over politeness."

### Correction Injection

- **Minimal**: "Only correct critical errors that prevent understanding. Keep corrections brief and inline."
- **Strict**: "Correct all grammatical, spelling, and usage errors. Provide clear explanations."

### Rolling Memory Strategy

**Problem:** Gemini has token limits (~1M input tokens, but costs grow).

**Solution:** Rolling summary every 20 messages.

1. After every 20 messages, call Gemini with:
   - Last 20 messages
   - Previous summary (if exists)
   - Prompt: "Summarize the key topics, corrections made, and learner progress in this conversation. Keep it under 200 words."
2. Save summary to `session.rollingSummary`
3. On next chat, include:
   - Rolling summary (if exists)
   - Last 10 messages (for context continuity)

**Benefits:**
- Maintains long-term context
- Reduces token costs
- Enables hour-long conversations

## Model Routing

| User Tier | Model | Max Output Tokens |
|-----------|-------|-------------------|
| Free | `gemini-1.5-flash` | 1024 |
| Pro | `gemini-2.0-flash-exp` | 2048 |
| Trial | `gemini-2.0-flash-exp` | 2048 |

## Error Handling

**Client-Side:**
- Show toast notifications for errors
- Retry failed SSE connections (max 3 attempts)
- Graceful degradation (disable features if offline)

**Server-Side:**
- Wrap all Gemini calls in try-catch
- Return structured errors:
  ```typescript
  { error: { code: string, message: string } }
  ```
- Log errors to Firebase/Cloud Logging

**Common Error Codes:**
- `QUOTA_EXCEEDED` - Free tier daily limit reached
- `TRIAL_EXPIRED` - 5-minute trial ended
- `AUTH_REQUIRED` - Missing or invalid token
- `SESSION_NOT_FOUND` - Invalid session ID
- `GEMINI_ERROR` - AI API failure

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Sessions owned by user
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }

    // Messages owned by user (via sessionId check)
    match /messages/{messageId} {
      allow read: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Deployment Architecture

```
[Browser]
   ↓ HTTPS
[Firebase Hosting] → serve Next.js app
   ↓
[Firebase Auth] → authenticate user
   ↓
[Firestore] ← read/write chat data
   ↓
[Cloud Functions]
   ├─ chatStream (SSE) ← Gemini API
   ├─ translateLast ← Gemini API
   ├─ createStripeCheckout → Stripe
   ├─ stripeWebhook ← Stripe
   └─ resetDailyQuotas (cron)
```

## Cost Estimates (Monthly)

**Assumptions:** 1000 active users, 50% free, 50% pro

| Service | Usage | Cost |
|---------|-------|------|
| Firebase Hosting | 100GB bandwidth | $0.15/GB = $15 |
| Firestore | 10M reads, 5M writes, 50GB storage | ~$60 |
| Cloud Functions | 500K invocations, 1M GB-sec | ~$10 |
| Gemini API | 100M input tokens, 50M output | ~$150 |
| Stripe | 500 subscriptions × $9.99 | $150 revenue - $15 fees |
| **Total** | | ~$250/month |
| **Revenue** | 500 × $9.99 | $4,995/month |
| **Margin** | | ~95% |
