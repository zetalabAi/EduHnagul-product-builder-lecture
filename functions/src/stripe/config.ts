import Stripe from "stripe";
import * as functions from "firebase-functions";

const stripeSecretKey = functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Stripe secret key not configured");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

/**
 * Subscription Plans
 *
 * Free: 주 15분, 광고 O
 * Free+: 주 25분, 광고 X, $4.9/월 or $59/년
 * Pro: 무제한, 3회 분석/일, $20.9/월 or $209/년 (10 months + 2 free)
 * Pro+: 무제한, 7회 분석/일, $30.9/월 or $309/년 (10 months + 2 free)
 */

export const PRICE_IDS = {
  // Free+ Plans
  FREE_PLUS_MONTHLY: process.env.STRIPE_PRICE_FREE_PLUS_MONTHLY || "price_free_plus_monthly",
  FREE_PLUS_YEARLY: process.env.STRIPE_PRICE_FREE_PLUS_YEARLY || "price_free_plus_yearly",

  // Pro Plans
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || "price_pro_yearly",

  // Pro+ Plans
  PRO_PLUS_MONTHLY: process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY || "price_pro_plus_monthly",
  PRO_PLUS_YEARLY: process.env.STRIPE_PRICE_PRO_PLUS_YEARLY || "price_pro_plus_yearly",
};

export interface PriceInfo {
  priceId: string;
  tier: "free+" | "pro" | "pro+";
  isAnnual: boolean;
  amount: number; // in dollars
}

export const PRICE_MAP: Record<string, PriceInfo> = {
  [PRICE_IDS.FREE_PLUS_MONTHLY]: {
    priceId: PRICE_IDS.FREE_PLUS_MONTHLY,
    tier: "free+",
    isAnnual: false,
    amount: 4.9,
  },
  [PRICE_IDS.FREE_PLUS_YEARLY]: {
    priceId: PRICE_IDS.FREE_PLUS_YEARLY,
    tier: "free+",
    isAnnual: true,
    amount: 59,
  },
  [PRICE_IDS.PRO_MONTHLY]: {
    priceId: PRICE_IDS.PRO_MONTHLY,
    tier: "pro",
    isAnnual: false,
    amount: 20.9,
  },
  [PRICE_IDS.PRO_YEARLY]: {
    priceId: PRICE_IDS.PRO_YEARLY,
    tier: "pro",
    isAnnual: true,
    amount: 209,
  },
  [PRICE_IDS.PRO_PLUS_MONTHLY]: {
    priceId: PRICE_IDS.PRO_PLUS_MONTHLY,
    tier: "pro+",
    isAnnual: false,
    amount: 30.9,
  },
  [PRICE_IDS.PRO_PLUS_YEARLY]: {
    priceId: PRICE_IDS.PRO_PLUS_YEARLY,
    tier: "pro+",
    isAnnual: true,
    amount: 309,
  },
};
