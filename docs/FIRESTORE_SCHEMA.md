# Firestore Schema - Edu_Hangul MVP

## Collections Overview

```
/users/{userId}
/sessions/{sessionId}
/messages/{messageId}
```

---

## Collection: `users`

**Document ID:** Firebase Auth UID

### Fields

```typescript
{
  // Identity
  uid: string;                    // Firebase Auth UID (same as doc ID)
  email: string;                  // User email from auth provider
  displayName: string | null;     // Display name from provider
  photoURL: string | null;        // Profile photo URL from provider
  nativeLanguage: "en" | "es" | "ja" | "zh" | "fr";

  // Subscription
  subscriptionTier: "free" | "pro";
  subscriptionStatus: "active" | "canceled" | "past_due" | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  // Trial tracking
  trialUsed: boolean;             // Whether user has used 5-min trial
  trialStartedAt: Timestamp | null;
  trialEndedAt: Timestamp | null;
  trialMessagesUsed: number;      // Count messages during trial

  // Quota tracking (for free tier)
  dailyMessagesUsed: number;      // Resets daily at midnight UTC
  lastQuotaReset: Timestamp;      // Last reset timestamp

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Indexes

```
stripeCustomerId ASC
```

### Security Rules

```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Default Values (on user creation)

```typescript
{
  subscriptionTier: "free",
  subscriptionStatus: null,
  trialUsed: false,
  trialStartedAt: null,
  trialEndedAt: null,
  trialMessagesUsed: 0,
  dailyMessagesUsed: 0,
  lastQuotaReset: FieldValue.serverTimestamp(),
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp()
}
```

---

## Collection: `sessions`

**Document ID:** Auto-generated (Firestore auto-ID)

### Fields

```typescript
{
  // Identity
  id: string;                     // Same as document ID
  userId: string;                 // Owner Firebase UID

  // Content
  title: string;                  // Auto-generated from first messages

  // Settings (per session)
  persona: "same-sex-friend" | "opposite-sex-friend" | "boyfriend" | "girlfriend";
  responseStyle: "empathetic" | "balanced" | "blunt";
  correctionStrength: "minimal" | "strict";

  // Rolling memory
  rollingSummary: string | null;  // Compressed conversation context
  lastSummaryAt: Timestamp | null; // When summary was last updated
  summaryVersion: number;         // Increments on each summary update

  // Metadata
  messageCount: number;           // Total messages in session
  lastMessageAt: Timestamp;       // Last message timestamp
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Indexes

```
userId ASC, lastMessageAt DESC
userId ASC, createdAt DESC
```

### Security Rules

```javascript
match /sessions/{sessionId} {
  // Read/write only if user owns the session
  allow read, update, delete: if request.auth != null
    && resource.data.userId == request.auth.uid;

  // Create only if setting userId to own UID
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid;
}
```

### Default Values (on session creation)

```typescript
{
  userId: currentUser.uid,
  title: "New conversation",      // Updated after first exchange
  persona: "same-sex-friend",
  responseStyle: "balanced",
  correctionStrength: "minimal",
  rollingSummary: null,
  lastSummaryAt: null,
  summaryVersion: 0,
  messageCount: 0,
  lastMessageAt: FieldValue.serverTimestamp(),
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp()
}
```

---

## Collection: `messages`

**Document ID:** Auto-generated (Firestore auto-ID)

### Fields

```typescript
{
  // Identity
  id: string;                     // Same as document ID
  sessionId: string;              // Parent session ID
  userId: string;                 // Owner UID (for security)

  // Content
  role: "user" | "assistant";
  content: string;                // Message text (Korean or mixed)

  // AI metadata (null for user messages)
  modelUsed: "gemini-1.5-flash" | "gemini-2.0-flash-exp" | null;
  inputTokens: number | null;     // Gemini input token count
  outputTokens: number | null;    // Gemini output token count
  latencyMs: number | null;       // Time to generate (milliseconds)

  // Timestamps
  createdAt: Timestamp;
}
```

### Indexes

```
sessionId ASC, createdAt ASC
userId ASC, createdAt DESC
```

### Security Rules

```javascript
match /messages/{messageId} {
  // Read if user owns the message
  allow read: if request.auth != null
    && resource.data.userId == request.auth.uid;

  // Create only if setting userId to own UID
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid;

  // No updates or deletes (immutable messages)
  allow update, delete: if false;
}
```

### Message Size Limits

- User messages: 1-2000 characters
- Assistant messages: up to 2048 tokens output (≈1500 words)

---

## Composite Indexes Required

### 1. Sessions by User (recent first)

```
Collection: sessions
Fields: userId (Ascending), lastMessageAt (Descending)
```

### 2. Messages in Session (chronological)

```
Collection: messages
Fields: sessionId (Ascending), createdAt (Ascending)
```

### 3. User's All Messages (recent first)

```
Collection: messages
Fields: userId (Ascending), createdAt (Descending)
```

### 4. Stripe Customer Lookup

```
Collection: users
Fields: stripeCustomerId (Ascending)
```

---

## Data Lifecycle & Cleanup

### Free Tier Retention

- Chat history: **30 days**
- Cron job (daily): delete messages older than 30 days for free users
- Sessions without messages: delete after 7 days

### Pro Tier Retention

- Chat history: **unlimited**
- No automatic deletion

### User Deletion (GDPR)

When user deletes account:

1. Delete all `sessions` where `userId == deletedUserId`
2. Delete all `messages` where `userId == deletedUserId`
3. Cancel Stripe subscription
4. Delete `users/{userId}` document
5. Delete Firebase Auth account

**Implementation:** Cloud Function triggered on `auth.user.deleted()`

---

## Firestore Rules (Complete)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function: check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Sessions collection
    match /sessions/{sessionId} {
      allow read, update, delete: if isAuthenticated()
        && resource.data.userId == request.auth.uid;

      allow create: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.keys().hasAll([
          'userId', 'title', 'persona', 'responseStyle',
          'correctionStrength', 'messageCount', 'createdAt'
        ]);
    }

    // Messages collection (immutable after creation)
    match /messages/{messageId} {
      allow read: if isAuthenticated()
        && resource.data.userId == request.auth.uid;

      allow create: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.keys().hasAll([
          'sessionId', 'userId', 'role', 'content', 'createdAt'
        ])
        && request.resource.data.role in ['user', 'assistant'];

      // No updates or deletes
      allow update, delete: if false;
    }
  }
}
```

---

## Migration Strategy

### Phase 1: MVP Launch
- Create collections with indexes
- Deploy security rules
- No data migration needed

### Phase 2: Feature Additions (Future)

If adding new fields:

1. Add field to TypeScript interfaces
2. Update security rules if needed
3. Run migration script for existing documents
4. Deploy Functions with new field support

**Example migration (adding `favorited` field to sessions):**

```typescript
const batch = firestore.batch();
const sessions = await firestore.collection('sessions').get();

sessions.forEach(doc => {
  batch.update(doc.ref, { favorited: false });
});

await batch.commit();
```

---

## Performance Considerations

### Read Optimization

- **List sessions:** Use `userId, lastMessageAt DESC` index (paginate with `limit(20)`)
- **Load chat:** Use `sessionId, createdAt ASC` index (virtualize if >100 messages)
- **Check quota:** Single read from `users/{userId}`

### Write Optimization

- **Save message:** Single write to `messages` collection
- **Update session:** Batch with message write (atomic)
- **Quota increment:** Use `FieldValue.increment(1)` (avoids read)

### Cost Estimates (1000 users/month)

- Reads: ~500K/month = $0.18
- Writes: ~200K/month = $0.54
- Storage: 50GB = $0.09
- **Total:** ~$0.81/month (Firestore only)
