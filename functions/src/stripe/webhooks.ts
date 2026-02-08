import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { stripe } from "./config";
import Stripe from "stripe";

/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).send("Missing stripe-signature header");
    return;
  }

  const webhookSecret =
    functions.config().stripe?.webhook_secret ||
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    functions.logger.error("Stripe webhook secret not configured");
    res.status(500).send("Webhook secret not configured");
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    functions.logger.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        functions.logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    functions.logger.error(`Error processing webhook: ${error.message}`);
    res.status(500).send(`Webhook processing error: ${error.message}`);
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.firebaseUID;
  if (!userId) {
    functions.logger.error("No firebaseUID in checkout session metadata");
    return;
  }

  functions.logger.info(`Checkout completed for user ${userId}`);

  // Subscription will be handled by subscription.created event
  // This is just for logging
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUID;
  if (!userId) {
    functions.logger.error("No firebaseUID in subscription metadata");
    return;
  }

  const tier = subscription.metadata?.tier as "free+" | "pro" | "pro+";
  const isStudent = subscription.metadata?.isStudent === "true";

  if (!tier) {
    functions.logger.error("No tier in subscription metadata");
    return;
  }

  const status = subscription.status;
  let subscriptionStatus: "active" | "canceled" | "past_due" | null = null;

  if (status === "active") {
    subscriptionStatus = "active";
  } else if (status === "canceled" || status === "unpaid") {
    subscriptionStatus = "canceled";
  } else if (status === "past_due") {
    subscriptionStatus = "past_due";
  }

  // Update user document
  await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .update({
      subscriptionTier: tier,
      subscriptionStatus: subscriptionStatus,
      stripeSubscriptionId: subscription.id,
      isStudent: isStudent,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  functions.logger.info(
    `Updated subscription for user ${userId}: ${tier} (${subscriptionStatus})`
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUID;
  if (!userId) {
    functions.logger.error("No firebaseUID in subscription metadata");
    return;
  }

  // Downgrade to free tier
  await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .update({
      subscriptionTier: "free",
      subscriptionStatus: null,
      stripeSubscriptionId: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  functions.logger.info(`Subscription deleted for user ${userId}, downgraded to free`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdated(subscription);

  functions.logger.info(`Payment succeeded for subscription ${subscriptionId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Get subscription to access metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.firebaseUID;
  if (!userId) return;

  // Mark as past_due
  await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .update({
      subscriptionStatus: "past_due",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  functions.logger.warn(`Payment failed for subscription ${subscriptionId}`);
}
