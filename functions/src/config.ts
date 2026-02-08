import * as functions from "firebase-functions";

export const config = {
  anthropic: {
    apiKey: functions.config().anthropic?.api_key || process.env.ANTHROPIC_API_KEY || "",
  },
  stripe: {
    secretKey: functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || "",
    priceId: functions.config().stripe?.price_id || process.env.STRIPE_PRICE_ID || "",
  },
  app: {
    url: functions.config().app?.url || process.env.APP_URL || "http://localhost:3000",
  },
};
