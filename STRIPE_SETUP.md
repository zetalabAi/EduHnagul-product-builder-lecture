# Stripe 구독 시스템 설정 가이드

## 1. Stripe Dashboard에서 Products & Prices 생성

### Free+ Plans

**Free+ Monthly**
- Product Name: `Free+ Monthly`
- Price: `$4.90 USD / month`
- Billing Period: Monthly
- Copy Price ID and set as env var: `STRIPE_PRICE_FREE_PLUS_MONTHLY`

**Free+ Yearly**
- Product Name: `Free+ Yearly`
- Price: `$59.00 USD / year`
- Billing Period: Yearly
- Copy Price ID and set as env var: `STRIPE_PRICE_FREE_PLUS_YEARLY`

### Pro Plans

**Pro Monthly**
- Product Name: `Pro Monthly`
- Price: `$20.90 USD / month`
- Billing Period: Monthly
- Copy Price ID and set as env var: `STRIPE_PRICE_PRO_MONTHLY`

**Pro Yearly**
- Product Name: `Pro Yearly`
- Price: `$209.00 USD / year`
- Billing Period: Yearly
- Copy Price ID and set as env var: `STRIPE_PRICE_PRO_YEARLY`

### Pro+ Plans (Regular)

**Pro+ Monthly**
- Product Name: `Pro+ Monthly`
- Price: `$30.90 USD / month`
- Billing Period: Monthly
- Copy Price ID and set as env var: `STRIPE_PRICE_PRO_PLUS_MONTHLY`

**Pro+ Yearly**
- Product Name: `Pro+ Yearly`
- Price: `$309.00 USD / year`
- Billing Period: Yearly
- Copy Price ID and set as env var: `STRIPE_PRICE_PRO_PLUS_YEARLY`

### Pro+ Plans (Student - 만 20세 이하)

**Pro+ Student Monthly**
- Product Name: `Pro+ Student Monthly`
- Price: `$25.00 USD / month`
- Billing Period: Monthly
- Copy Price ID and set as env var: `STRIPE_PRICE_PRO_PLUS_STUDENT_MONTHLY`

**Pro+ Student Yearly**
- Product Name: `Pro+ Student Yearly`
- Price: `$200.00 USD / year`
- Billing Period: Yearly
- Copy Price ID and set as env var: `STRIPE_PRICE_PRO_PLUS_STUDENT_YEARLY`

## 2. Firebase Functions Configuration

Set Stripe keys in Firebase Functions:

```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_..." \
  stripe.webhook_secret="whsec_..."
```

Or set environment variables for local development:

```bash
# .env.local (for functions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_FREE_PLUS_MONTHLY=price_...
STRIPE_PRICE_FREE_PLUS_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PRO_PLUS_MONTHLY=price_...
STRIPE_PRICE_PRO_PLUS_YEARLY=price_...
STRIPE_PRICE_PRO_PLUS_STUDENT_MONTHLY=price_...
STRIPE_PRICE_PRO_PLUS_STUDENT_YEARLY=price_...
```

## 3. Webhook 설정

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret and set as `stripe.webhook_secret` in Firebase Functions config

## 4. Test in Development

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local functions
stripe listen --forward-to http://localhost:5001/YOUR_PROJECT/us-central1/stripeWebhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
```

## 5. Student Discount Flow

1. User goes to Settings (`/settings`)
2. User enters birth date
3. System calculates age (만 20세 이하)
4. If eligible, `isStudent = true` is set in Firestore
5. Pricing page shows student pricing for Pro+ plans
6. When creating checkout, system validates student eligibility
7. If not eligible for student plan, checkout fails with error

## 6. Subscription Management

Users can manage their subscriptions via Stripe Customer Portal:
- Change payment method
- Update billing details
- Cancel subscription
- View invoice history

Access via:
- Settings page → "구독 관리" button
- Pricing page → "구독 관리" button (if already subscribed)

## 7. Pricing Summary

| Plan | Monthly | Yearly | Student Monthly | Student Yearly |
|------|---------|--------|----------------|---------------|
| Free+ | $4.9 | $59 | - | - |
| Pro | $20.9 | $209 (10mo+2mo free) | - | - |
| Pro+ | $30.9 | $309 (10mo+2mo free) | $25 | $200 (8mo+4mo free) |

## 8. Webhook Event Flow

### New Subscription
1. User clicks "선택하기" on pricing page
2. `createCheckoutSession` creates Stripe Checkout
3. User completes payment on Stripe
4. Stripe fires `checkout.session.completed` webhook
5. Stripe fires `customer.subscription.created` webhook
6. `handleSubscriptionUpdated` updates Firestore user document:
   - `subscriptionTier` → tier from metadata
   - `subscriptionStatus` → "active"
   - `stripeSubscriptionId` → subscription ID
   - `isStudent` → from metadata

### Payment Failed
1. Stripe automatic billing fails
2. Stripe fires `invoice.payment_failed` webhook
3. `handlePaymentFailed` updates user status to "past_due"
4. User is notified (TODO: send email)

### Subscription Canceled
1. User cancels via Customer Portal or Stripe Dashboard
2. Stripe fires `customer.subscription.deleted` webhook
3. `handleSubscriptionDeleted` downgrades user to "free" tier
4. User retains access until end of billing period (configurable in Stripe)

## 9. Important Notes

- **Test Mode vs Live Mode**: Use different API keys and webhook secrets
- **Student Verification**: Currently only checks age (만 20세 이하). No document verification.
- **Cancellation Policy**: Users can cancel anytime via Customer Portal
- **Refund Policy**: Configure in Stripe settings
- **Tax Collection**: Enable in Stripe if needed
- **Currency**: USD only (can add more currencies in Stripe Dashboard)

## 10. Deployment Checklist

- [ ] Create all 8 products & prices in Stripe Dashboard
- [ ] Copy all price IDs to environment variables
- [ ] Set Stripe secret key in Firebase Functions config
- [ ] Create webhook endpoint in Stripe Dashboard
- [ ] Set webhook secret in Firebase Functions config
- [ ] Test checkout flow in development
- [ ] Test webhook events with Stripe CLI
- [ ] Test student discount eligibility
- [ ] Switch to live mode keys for production
- [ ] Enable Customer Portal in Stripe settings
- [ ] Configure email notifications in Stripe
