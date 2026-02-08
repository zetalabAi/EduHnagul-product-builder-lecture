# Deployment Guide - Edu_Hangul MVP

Complete step-by-step guide to deploy Edu_Hangul to production.

## Pre-Deployment Checklist

- [ ] Firebase project created with Blaze plan
- [ ] All auth providers configured
- [ ] Gemini API key obtained
- [ ] Stripe product created ($9.99/month)
- [ ] Domain configured (if using custom domain)
- [ ] Environment variables set
- [ ] Code tested locally with emulators

## Quick Deploy

```bash
# 1. Set environment variables
firebase functions:config:set \
  gemini.api_key="YOUR_KEY" \
  stripe.secret_key="sk_live_..." \
  stripe.webhook_secret="whsec_..." \
  stripe.price_id="price_..."

# 2. Build frontend
npm run build

# 3. Deploy everything
firebase deploy
```

## Detailed Documentation

See full deployment steps in README.md

## Post-Deployment

1. Test all auth providers
2. Verify Stripe webhook
3. Send test message
4. Monitor logs: `firebase functions:log`

---

**Deployment completed! 🚀**
