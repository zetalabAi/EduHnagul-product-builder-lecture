# Implementation Plan - Edu_Hangul MVP

## Overview

Build Edu_Hangul MVP in phases, from frontend foundation to full backend integration. Each phase is deployable and testable independently.

**Estimated Timeline:** 3-4 weeks (1 developer)

---

## Phase 1: Firebase Setup & Authentication (3 days)

### 1.1 Firebase Project Initialization

**Tasks:**
- [ ] Create Firebase project in console
- [ ] Enable Firestore database
- [ ] Enable Firebase Authentication
- [ ] Enable Cloud Functions
- [ ] Enable Firebase Hosting
- [ ] Set up billing (required for external API calls)

**Config files:**
- `firebase.json` - hosting and functions config
- `.firebaserc` - project aliases
- `firestore.rules` - security rules (from FIRESTORE_SCHEMA.md)
- `firestore.indexes.json` - composite indexes

### 1.2 Authentication Providers

**Providers to enable:**
- Google Sign-In
- Microsoft Sign-In (Azure AD)
- Apple Sign-In

**Frontend integration:**
- Create `src/lib/firebase.ts` with Firebase SDK initialization
- Create `src/hooks/useAuth.ts` for auth state management
- Create sign-in page at `/auth/signin`
- Update landing page CTA to check auth status
- Add auth state observer to persist login

**Testing:**
- Verify users can sign in with each provider
- Confirm user document created in Firestore on first sign-in
- Check auth token is included in all API calls

### 1.3 User Document Creation

**Cloud Function: `onUserCreate`**
- Trigger: `auth.user().onCreate()`
- Create user document in Firestore with default values
- Set `nativeLanguage` based on browser locale (fallback: "en")

**Deliverable:** Users can sign in and their profile is automatically created.

---

## Phase 2: Firestore Schema & Rules (2 days)

### 2.1 Create Collections

**Deploy Firestore schema:**
- Create `users`, `sessions`, `messages` collections
- Add composite indexes from `firestore.indexes.json`
- Deploy security rules from FIRESTORE_SCHEMA.md

**Testing:**
- Manually create test documents
- Verify security rules block unauthorized access
- Confirm indexes are created (check Firebase console)

### 2.2 Session Management (Frontend)

**Create session CRUD:**
- `src/lib/sessions.ts` - Firestore client functions
  - `createSession(settings)` → returns sessionId
  - `listSessions(userId)` → returns user's sessions
  - `updateSession(sessionId, updates)` → updates settings
  - `deleteSession(sessionId)` → soft delete

**Update `/app` page:**
- Replace mock sessions with real Firestore queries
- Add "New Session" functionality
- Persist session settings to Firestore
- Load existing sessions from Firestore

**Testing:**
- Create, update, delete sessions
- Verify ownership rules (can't access other users' sessions)
- Check sessions list updates in real-time

**Deliverable:** Sessions are fully managed in Firestore.

---

## Phase 3: Backend Functions - Core Chat (5 days)

### 3.1 Set Up Cloud Functions Project

**Initialize Functions:**
```bash
cd functions
npm install
npm install @google/generative-ai firebase-admin
```

**Environment variables:**
```bash
firebase functions:config:set gemini.api_key="YOUR_KEY"
```

**Create functions structure:**
```
functions/
├── src/
│   ├── index.ts              # Entry point
│   ├── chat/
│   │   ├── chatStream.ts     # SSE streaming
│   │   └── helpers.ts        # Prompt assembly
│   ├── translation/
│   │   └── translateLast.ts
│   ├── payments/
│   │   ├── createCheckout.ts
│   │   └── webhook.ts
│   └── scheduled/
│       └── resetQuotas.ts
├── package.json
└── tsconfig.json
```

### 3.2 Implement `chatStream` Function

**File: `functions/src/chat/chatStream.ts`**

**Steps:**
1. Verify auth token
2. Load session from Firestore
3. Check quota:
   - Free tier: `dailyMessagesUsed < 20`
   - Trial: `trialUsed && now < trialEndedAt`
   - Pro: no check
4. Load last 10 messages + rolling summary
5. Assemble prompt (from PROMPTS.md)
6. Select model based on tier
7. Stream Gemini response via SSE:
   - Send `event: token` for each chunk
   - Send `event: done` with metadata on completion
   - Send `event: error` on failure
8. Save user + assistant messages to Firestore
9. Update session metadata
10. Increment quota counters

**Key implementation details:**
- Use `res.setHeader('Content-Type', 'text/event-stream')`
- Use `res.write()` for streaming chunks
- Use `res.end()` to close connection
- Wrap in try-catch, send error events on failure

**Testing:**
- Send message as free user → verify quota increments
- Send 20 messages → verify quota block on 21st
- Send message as Pro → verify no quota check
- Verify messages saved to Firestore
- Check SSE stream works in browser

### 3.3 Prompt Assembly Logic

**File: `functions/src/chat/helpers.ts`**

**Function: `assemblePrompt(session, user, rollingSummary)`**

Concatenate:
1. Base system instruction
2. Persona template
3. Response style modifier
4. Correction strength modifier
5. Safety constraints
6. Rolling summary (if exists)
7. User's native language note

**Return:** Complete system instruction string

### 3.4 Rolling Summary (Future Enhancement)

**Trigger:** After every 20 messages

**Implementation:**
- Check `session.messageCount % 20 === 0`
- Load last 20 messages
- Call Gemini with summary prompt (from PROMPTS.md)
- Save summary to `session.rollingSummary`
- Update `session.lastSummaryAt`

**Note:** Can be implemented later if time is limited. Use last 10 messages only for MVP.

**Deliverable:** Chat streaming works end-to-end with real AI responses.

---

## Phase 4: Frontend - Real SSE Integration (3 days)

### 4.1 Replace Mock Streaming

**Update `src/app/app/page.tsx`:**
- Remove mock response logic
- Implement real SSE connection to `chatStream` function
- Handle `token`, `done`, `error` events
- Show loading state during streaming
- Handle connection failures (retry logic)

**SSE Client implementation:**
```typescript
const streamMessage = async (sessionId: string, message: string) => {
  const idToken = await auth.currentUser?.getIdToken();

  const eventSource = new EventSource(
    `/api/chatStream?sessionId=${sessionId}&message=${encodeURIComponent(message)}`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );

  eventSource.addEventListener('token', (e) => {
    const { token } = JSON.parse(e.data);
    appendTokenToMessage(token);
  });

  eventSource.addEventListener('done', (e) => {
    const metadata = JSON.parse(e.data);
    finalizeMessage(metadata);
    eventSource.close();
  });

  eventSource.addEventListener('error', (e) => {
    const error = JSON.parse(e.data);
    showErrorToast(error.message);
    eventSource.close();
  });
};
```

### 4.2 Message History Loading

**On session load:**
- Query Firestore: `messages` where `sessionId` ordered by `createdAt`
- Render messages in chat timeline
- Implement virtualization if >100 messages (use `react-window` or `react-virtual`)

### 4.3 Error Handling & User Feedback

**Error states:**
- Quota exceeded → show upgrade prompt
- Trial expired → show subscription CTA
- Network error → show retry button
- Invalid session → redirect to home

**Loading states:**
- Show typing indicator while AI is responding
- Disable input during streaming
- Show skeleton loader for message history

**Deliverable:** Chat works with real Gemini API, messages persist in Firestore.

---

## Phase 5: Translation Feature (1 day)

### 5.1 Implement `translateLast` Function

**File: `functions/src/translation/translateLast.ts`**

**Steps:**
1. Verify auth token
2. Validate request (sessionId, role)
3. Load user document → get `nativeLanguage`
4. Query last message: `messages` where `sessionId` and `role` order by `createdAt desc` limit 1
5. Call Gemini Flash with translation prompt (from PROMPTS.md)
6. Return translated text

**Testing:**
- Translate user message
- Translate assistant message
- Verify works for all 5 native languages

### 5.2 Frontend Integration

**Update `SettingsPanel.tsx`:**
- Connect translation buttons to `translateLast` callable
- Show translation in modal or inline below message
- Handle errors gracefully

**Deliverable:** Users can translate last user/AI message to their native language.

---

## Phase 6: Payments - Stripe Integration (4 days)

### 6.1 Stripe Setup

**Prerequisites:**
- Create Stripe account
- Get API keys (test mode first)
- Create product: "Edu_Hangul Pro" at $9.99/month

**Environment variables:**
```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_..." \
  stripe.webhook_secret="whsec_..."
```

### 6.2 Implement `createStripeCheckout`

**File: `functions/src/payments/createCheckout.ts`**

**Steps:**
1. Verify auth token
2. Check if user already has Pro subscription
3. Get or create Stripe customer ID
4. Create Checkout session:
   - Product: Pro monthly subscription
   - Success URL: `/app?success=true`
   - Cancel URL: `/pricing`
   - metadata: `{ userId: user.uid }`
5. Return checkout URL

**Testing:**
- Click "Upgrade to Pro" button
- Verify redirects to Stripe Checkout
- Complete test payment (use test card: `4242 4242 4242 4242`)
- Verify user document updated with `subscriptionTier: "pro"`

### 6.3 Implement `stripeWebhook`

**File: `functions/src/payments/webhook.ts`**

**Events handled:**
- `checkout.session.completed` → activate Pro
- `customer.subscription.updated` → update status
- `customer.subscription.deleted` → downgrade to Free
- `invoice.payment_failed` → mark past_due

**Steps:**
1. Verify Stripe signature
2. Parse event
3. Extract userId from metadata
4. Update user document in Firestore
5. Return 200 OK

**Stripe webhook setup:**
- Add endpoint in Stripe Dashboard
- URL: `https://us-central1-<project>.cloudfunctions.net/stripeWebhook`
- Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

**Testing:**
- Use Stripe CLI to forward webhook events locally:
  ```bash
  stripe listen --forward-to localhost:5001/<project>/us-central1/stripeWebhook
  ```
- Trigger test events
- Verify user document updates correctly

### 6.4 Frontend - Pricing & Upgrade Flow

**Create `/pricing` page:**
- Show Free vs Pro comparison table
- "Upgrade to Pro" button → calls `createStripeCheckout`
- Handle success/cancel redirects

**Update `/app` page:**
- Show quota usage for free users (e.g., "15/20 messages today")
- Show "Upgrade" prompt when quota exceeded
- Display Pro badge for Pro users

**Deliverable:** Users can subscribe to Pro tier and get unlimited access.

---

## Phase 7: Trial Logic (2 days)

### 7.1 Trial Activation

**On first message of new user:**
- Check `user.trialUsed === false`
- Set `trialUsed: true`, `trialStartedAt: now`, `trialEndedAt: now + 5 minutes`
- Allow Pro-tier access (Gemini 2.0 Flash)

### 7.2 Trial Enforcement

**In `chatStream` function:**
- Check if trial is active: `now < trialEndedAt`
- Count trial messages: `trialMessagesUsed < 50`
- If trial expired → block message, return `TRIAL_EXPIRED` error

### 7.3 Trial UI

**Frontend updates:**
- Show trial timer in header: "⏱️ Trial: 3:45 remaining"
- Show message count: "12/50 messages"
- At 4 minutes or 45 messages → show "Trial ending soon" banner
- On expiration → show upgrade modal

**Deliverable:** 5-minute Pro trial works with time and message limits.

---

## Phase 8: Scheduled Jobs (1 day)

### 8.1 Daily Quota Reset

**File: `functions/src/scheduled/resetQuotas.ts`**

**Schedule:** `0 0 * * *` (midnight UTC)

**Steps:**
1. Query Firestore: `users` where `subscriptionTier === "free"`
2. Batch update:
   ```typescript
   {
     dailyMessagesUsed: 0,
     lastQuotaReset: FieldValue.serverTimestamp()
   }
   ```
3. Log results

**Deploy:**
```bash
firebase deploy --only functions:resetDailyQuotas
```

**Testing:**
- Trigger manually via Firebase console
- Verify free users' quotas reset

### 8.2 Message Cleanup (Optional)

**Schedule:** Daily at 2:00 UTC

**Delete messages older than 30 days for free users:**
1. Query `messages` where `userId` in free users and `createdAt < 30 days ago`
2. Batch delete

**Deliverable:** Quotas reset automatically every day.

---

## Phase 9: Testing & Polish (3 days)

### 9.1 End-to-End Testing

**Test scenarios:**
- [ ] New user signs in → user doc created
- [ ] Create session → saved to Firestore
- [ ] Send message → AI responds, messages saved
- [ ] Free user hits quota → blocked, shown upgrade prompt
- [ ] User upgrades to Pro → quota removed, better model
- [ ] Translate message → works in all languages
- [ ] Change session settings → reflected in AI responses
- [ ] Trial expires → user blocked, shown upgrade

### 9.2 Error Handling

**Add error boundaries:**
- Wrap main app in `<ErrorBoundary>`
- Show user-friendly error messages
- Add Sentry or Firebase Crashlytics

**Network resilience:**
- Retry failed SSE connections (max 3 attempts)
- Handle offline mode gracefully
- Show connection status indicator

### 9.3 Performance Optimization

**Frontend:**
- Lazy load components
- Virtualize long message lists
- Optimize Firestore queries (use indexes)
- Add loading skeletons

**Backend:**
- Cache user/session documents (5-minute TTL)
- Use Firestore batch operations
- Optimize Gemini prompts (reduce token count)

### 9.4 UI Polish

**Design improvements:**
- Add smooth transitions
- Improve mobile responsiveness
- Add haptic feedback (mobile)
- Improve empty states
- Add success animations

**Accessibility:**
- Add ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Check color contrast

**Deliverable:** Polished, production-ready app.

---

## Phase 10: Deployment & Launch (2 days)

### 10.1 Production Setup

**Firebase:**
- Switch to production mode
- Set up billing alerts
- Configure environment variables
- Deploy Firestore rules and indexes

**Stripe:**
- Switch to live mode
- Create production product
- Update webhook endpoint
- Test live payments

**Gemini API:**
- Switch to production API key
- Set up rate limits
- Monitor usage

### 10.2 Deploy

```bash
# Deploy everything
firebase deploy

# Or deploy individually
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 10.3 Post-Launch Monitoring

**Set up alerts:**
- Cloud Function errors > 1%
- Response time > 5s (P95)
- Quota exceeded events
- Payment failures

**Analytics:**
- Firebase Analytics for user behavior
- Track conversion funnel (signup → first message → subscription)
- Monitor trial-to-paid conversion

**Deliverable:** App live in production with monitoring.

---

## Milestones Summary

| Milestone | Deliverable | Timeline |
|-----------|-------------|----------|
| M1 | Auth working, users can sign in | Day 3 |
| M2 | Sessions persist in Firestore | Day 5 |
| M3 | Chat streaming works with Gemini | Day 10 |
| M4 | Messages load from Firestore | Day 13 |
| M5 | Translation feature works | Day 14 |
| M6 | Stripe payments integrated | Day 18 |
| M7 | Trial logic complete | Day 20 |
| M8 | Scheduled jobs deployed | Day 21 |
| M9 | Testing & polish complete | Day 24 |
| M10 | Deployed to production | Day 26 |

---

## Out of Scope (Prevent Feature Creep)

**Explicitly excluded from MVP:**

❌ Voice/audio features
❌ Flashcards or vocabulary lists
❌ Grammar explanations outside chat
❌ Community features or social sharing
❌ Mobile native apps
❌ Offline mode
❌ External integrations (Anki, Notion, etc.)
❌ Multiple language support (Korean only)
❌ Custom persona creation
❌ Advanced analytics dashboard
❌ Referral program
❌ Team/group accounts
❌ API for third-party developers

**These can be considered for v2 after MVP validation.**

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Gemini API costs exceed budget | Set hard quotas, monitor usage, implement aggressive caching |
| SSE not working on some browsers | Add fallback to polling, test on Safari/iOS |
| Firestore costs grow too fast | Optimize queries, add indexes, implement pagination |
| Stripe webhook failures | Add retry logic, log all events, manual reconciliation script |

### Product Risks

| Risk | Mitigation |
|------|------------|
| Low engagement | A/B test personas, add onboarding tutorial |
| Low conversion | Extend trial, improve pricing page, add testimonials |
| AI quality issues | Fine-tune prompts, add feedback mechanism, monitor reports |
| Inappropriate content | Strict safety filters, user reporting, manual review queue |

---

## Success Criteria (Reminder from SPEC.md)

**Must achieve in first 30 days:**

✅ 30% of users complete 10+ message exchanges
✅ Average session: 15+ minutes
✅ 60% retention within 7 days
✅ 5% trial-to-paid conversion
✅ <2s response time (P95)
✅ 95% uptime

**If not met → iterate on prompts, UX, or pricing.**

---

## Next Steps After This Document

1. Review and approve this plan
2. Set up Firebase project (Phase 1.1)
3. Start implementation following phase order
4. Daily standups to track progress
5. Weekly demos of completed milestones

**Let's build Edu_Hangul! 🚀**
