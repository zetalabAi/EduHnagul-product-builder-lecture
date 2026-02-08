# Edu_Hangul MVP - Product Specification

## Goal

Enable Korean learners to practice through **long, natural AI conversations** in a chat-only interface. The AI adapts to learner preferences (persona, tone, correction style) to maximize engagement and retention.

## Non-Goals (Explicitly Excluded)

- ❌ Voice/audio input or output
- ❌ Flashcards, vocabulary lists, or structured lessons
- ❌ Grammar explanations or educational content outside chat
- ❌ Community features, leaderboards, or social sharing
- ❌ Multiple language learning (Korean only)
- ❌ Mobile native apps (web-only MVP)
- ❌ Offline mode
- ❌ Integration with external platforms (Anki, Notion, etc.)

## Core Features

### 1. Personas (4 Roles)

Users select one persona per session. The AI adopts the corresponding tone and relationship dynamic:

1. **Same-sex Friend** - Casual, supportive, encouraging
2. **Opposite-sex Friend** - Friendly, slightly more formal, helpful
3. **Boyfriend** - Warm, caring, affectionate (no explicit sexual content)
4. **Girlfriend** - Sweet, encouraging, affectionate (no explicit sexual content)

**Content Constraints:**
- No explicit sexual content or graphic descriptions
- Romantic personas may use affectionate language but remain appropriate for general audiences
- AI will deflect or refuse inappropriate requests

### 2. Response Style Toggle

Controls the AI's conversational tone within the chosen persona:

- **Empathetic**: Warm, patient, lots of encouragement
- **Balanced**: Neutral, practical, clear feedback
- **Blunt**: Direct, honest, minimal sugar-coating

**Auto-Suggest Feature:**
- System may suggest switching styles based on user behavior (e.g., repeated mistakes → suggest "Blunt" for clarity)
- Suggestions are **non-binding** - user must manually accept
- Max 1 suggestion per session to avoid annoyance

### 3. Correction Strength Toggle

Controls how the AI corrects Korean mistakes:

**Minimal:**
- Only correct critical errors that block communication
- Inline corrections: `"안녕하세요 (you wrote 안녕세요 - missing 하)"`
- Keep conversation flowing

**Strict:**
- Correct all grammatical, spelling, and usage errors
- Detailed explanations when needed
- May pause conversation to clarify

**Correction Format Rules:**
- Always provide corrected version inline
- Use parentheses for brief explanations
- Keep corrections concise (1-2 sentences max)
- Never derail conversation flow

### 4. Translation Feature

Users can translate the **last user message** or **last AI message**:

- Button triggers instant translation
- Shows both original and translated text
- Translations are **not saved** to message history
- Uses Gemini Flash for speed

### 5. Supported Native Languages (Locked List)

Users select their native language for translations and UI:

- English (en)
- Spanish (es)
- Japanese (ja)
- Chinese (zh)
- French (fr)

**Note:** Korean (ko) is not offered as a native language since the product teaches Korean.

## Monetization

### Free Tier

- 20 messages per day (resets at midnight UTC)
- Gemini 1.5 Flash model
- All personas and settings available
- Basic chat history (last 30 days)

### Pro Tier ($9.99/month)

- Unlimited messages
- Gemini 2.0 Flash Experimental model (better quality)
- Unlimited chat history
- Priority support

### 5-Minute Pro Trial

- Activated automatically on first session
- 5 minutes of Pro access OR 50 messages (whichever comes first)
- After trial ends, user drops to Free tier
- Trial is **one-time only** per account

**Trial Logic:**
- Timer starts on first message of first session
- Counts elapsed time + message output tokens
- Soft cutoff: show "trial ending" warning at 4 minutes or 45 messages
- Hard cutoff: block new messages, prompt upgrade

## Quota Reset Logic

- Free tier quota resets daily at 00:00 UTC
- Track reset using Firestore timestamp + Cloud Function cron job
- On reset:
  - Set `dailyMessagesUsed` to 0
  - Update `lastQuotaReset` timestamp

## MVP Success Criteria

**Engagement Metrics:**
- 30% of users complete 10+ message exchanges in first session
- Average session length: 15+ minutes
- 60% of users return within 7 days

**Conversion Metrics:**
- 5% trial-to-paid conversion within 14 days
- 10% free-to-paid conversion within 30 days

**Technical Metrics:**
- 95% uptime
- <2s message response time (P95)
- <1% error rate on chat streaming

**Quality Metrics:**
- User satisfaction score >4.0/5.0
- <5% reports of inappropriate AI responses
