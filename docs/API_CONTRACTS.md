# API Contracts - Edu_Hangul MVP

## Authentication

All Cloud Functions require Firebase Authentication token in request headers:

```typescript
Authorization: Bearer <firebase-id-token>
```

Functions validate `context.auth.uid` and reject unauthenticated requests with:

```typescript
{
  error: {
    code: "AUTH_REQUIRED",
    message: "Authentication required"
  }
}
```

---

## 1. chatStream

**Type:** HTTPS Callable (Server-Sent Events)

**Purpose:** Stream AI response for user message

### Request

```typescript
interface ChatStreamRequest {
  sessionId: string;        // Existing session ID
  message: string;          // User's message content (1-2000 chars)
}
```

### Response (SSE Stream)

**Content-Type:** `text/event-stream`

**Events:**

```typescript
// Token stream
event: token
data: { token: string }

// Final metadata
event: done
data: {
  messageId: string;        // Saved assistant message ID
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
}

// Error event
event: error
data: {
  code: string;
  message: string;
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid auth token |
| `INVALID_SESSION` | 404 | Session not found or not owned by user |
| `QUOTA_EXCEEDED` | 429 | Free tier daily limit reached (20 messages) |
| `TRIAL_EXPIRED` | 402 | 5-minute trial ended, upgrade required |
| `MESSAGE_TOO_LONG` | 400 | Message exceeds 2000 characters |
| `GEMINI_ERROR` | 500 | AI API failure |
| `RATE_LIMIT` | 429 | Too many requests (10/min per user) |

### Example Usage (Frontend)

```typescript
const eventSource = new EventSource(
  `/api/chatStream?sessionId=${sessionId}&message=${encodeURIComponent(message)}`,
  {
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  }
);

eventSource.addEventListener('token', (e) => {
  const { token } = JSON.parse(e.data);
  appendToken(token);
});

eventSource.addEventListener('done', (e) => {
  const metadata = JSON.parse(e.data);
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  const error = JSON.parse(e.data);
  showError(error.message);
  eventSource.close();
});
```

---

## 2. translateLast

**Type:** HTTPS Callable

**Purpose:** Translate last user or assistant message to native language

### Request

```typescript
interface TranslateLastRequest {
  sessionId: string;
  role: "user" | "assistant";  // Which message to translate
}
```

### Response

```typescript
interface TranslateLastResponse {
  original: string;             // Original Korean text
  translated: string;           // Translated to user's native language
  targetLanguage: string;       // User's native language code
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid auth token |
| `INVALID_SESSION` | 404 | Session not found or not owned by user |
| `MESSAGE_NOT_FOUND` | 404 | No message of specified role in session |
| `GEMINI_ERROR` | 500 | Translation API failure |

### Example Usage

```typescript
const result = await functions.httpsCallable('translateLast')({
  sessionId: 'session123',
  role: 'assistant'
});

console.log(result.data.translated);
```

---

## 3. createStripeCheckout

**Type:** HTTPS Callable

**Purpose:** Create Stripe Checkout session for Pro subscription

### Request

```typescript
interface CreateStripeCheckoutRequest {
  successUrl: string;           // Redirect after successful payment
  cancelUrl: string;            // Redirect if user cancels
}
```

### Response

```typescript
interface CreateStripeCheckoutResponse {
  checkoutUrl: string;          // Stripe Checkout URL
  sessionId: string;            // Stripe session ID
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid auth token |
| `ALREADY_SUBSCRIBED` | 400 | User already has active Pro subscription |
| `STRIPE_ERROR` | 500 | Stripe API failure |

### Example Usage

```typescript
const result = await functions.httpsCallable('createStripeCheckout')({
  successUrl: 'https://app.eduhangul.com/success',
  cancelUrl: 'https://app.eduhangul.com/pricing'
});

window.location.href = result.data.checkoutUrl;
```

---

## 4. stripeWebhook

**Type:** HTTPS POST (webhook endpoint)

**Purpose:** Handle Stripe events (subscription lifecycle)

**URL:** `https://us-central1-<project>.cloudfunctions.net/stripeWebhook`

### Request

**Headers:**
```
stripe-signature: <signature>
```

**Body:** Raw Stripe event JSON

### Response

```typescript
{ received: true }
```

**HTTP 200** - Event processed successfully
**HTTP 400** - Invalid signature or malformed event
**HTTP 500** - Processing error (Stripe will retry)

### Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate Pro subscription, update user tier |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Downgrade to Free tier |
| `invoice.payment_failed` | Mark subscription as `past_due` |
| `invoice.payment_succeeded` | Mark subscription as `active` |

### Stripe Setup

1. Add webhook endpoint in Stripe Dashboard
2. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
3. Copy webhook signing secret to Cloud Functions config:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   ```

---

## 5. resetDailyQuotas (Scheduled)

**Type:** Cloud Scheduler (Cron)

**Purpose:** Reset free users' daily message quotas at midnight UTC

**Schedule:** `0 0 * * *` (every day at 00:00 UTC)

**No external API** - runs automatically

### Process

1. Query Firestore: `users` where `subscriptionTier == "free"`
2. Batch update:
   ```typescript
   {
     dailyMessagesUsed: 0,
     lastQuotaReset: FieldValue.serverTimestamp()
   }
   ```
3. Log results to Cloud Logging

---

## 6. createSession (Callable)

**Type:** HTTPS Callable

**Purpose:** Create a new chat session

### Request

```typescript
interface CreateSessionRequest {
  persona: "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
  responseStyle: "empathetic" | "balanced" | "blunt";
  correctionStrength: "minimal" | "strict";
}
```

### Response

```typescript
interface CreateSessionResponse {
  sessionId: string;
  createdAt: string;          // ISO timestamp
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid auth token |
| `INVALID_SETTINGS` | 400 | Invalid persona, style, or correction value |

---

## 7. updateSession (Callable)

**Type:** HTTPS Callable

**Purpose:** Update session settings mid-conversation

### Request

```typescript
interface UpdateSessionRequest {
  sessionId: string;
  persona?: "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
  responseStyle?: "empathetic" | "balanced" | "blunt";
  correctionStrength?: "minimal" | "strict";
}
```

### Response

```typescript
interface UpdateSessionResponse {
  success: boolean;
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_REQUIRED` | 401 | Missing or invalid auth token |
| `INVALID_SESSION` | 404 | Session not found or not owned by user |

---

## Common Response Patterns

### Success Response

```typescript
{
  data: <response-data>,
  status: "success"
}
```

### Error Response

```typescript
{
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Optional additional context
  },
  status: "error"
}
```

---

## Rate Limiting

**Per-User Limits:**
- `chatStream`: 10 requests/minute
- `translateLast`: 20 requests/minute
- `createSession`: 5 requests/minute
- `createStripeCheckout`: 3 requests/minute

**Implementation:** Use Firestore to track request timestamps per user. Return `429 RATE_LIMIT` if exceeded.

---

## Security Notes

1. **Never expose API keys to client** - all Gemini and Stripe calls are server-side only
2. **Validate ownership** - every function checks `request.auth.uid` matches resource owner
3. **Sanitize inputs** - escape user messages before passing to Gemini
4. **Rate limit aggressively** - prevent abuse and cost overruns
5. **Log all errors** - use Cloud Logging for debugging and monitoring
