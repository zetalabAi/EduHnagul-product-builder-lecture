import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { config } from "../config";

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2023-10-16",
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err: any) {
    functions.logger.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const db = admin.firestore();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.firebaseUID;

        if (!userId) {
          functions.logger.error("No firebaseUID in checkout session metadata");
          break;
        }

        const subscriptionId = session.subscription as string;

        await db.collection("users").doc(userId).update({
          subscriptionTier: "pro",
          subscriptionStatus: "active",
          stripeSubscriptionId: subscriptionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`Activated Pro for user ${userId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const usersSnapshot = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          functions.logger.error(`No user found with stripeCustomerId ${customerId}`);
          break;
        }

        const userDoc = usersSnapshot.docs[0];
        const status = subscription.status;

        const updates: any = {
          subscriptionStatus: status === "active" ? "active" : status === "canceled" ? "canceled" : "past_due",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (status === "canceled" || status === "unpaid") {
          updates.subscriptionTier = "free";
        }

        await userDoc.ref.update(updates);

        functions.logger.info(`Updated subscription status for user ${userDoc.id} to ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const usersSnapshot = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          functions.logger.error(`No user found with stripeCustomerId ${customerId}`);
          break;
        }

        const userDoc = usersSnapshot.docs[0];

        await userDoc.ref.update({
          subscriptionTier: "free",
          subscriptionStatus: "canceled",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`Downgraded user ${userDoc.id} to free tier`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const usersSnapshot = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          functions.logger.error(`No user found with stripeCustomerId ${customerId}`);
          break;
        }

        const userDoc = usersSnapshot.docs[0];

        await userDoc.ref.update({
          subscriptionStatus: "past_due",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`Marked user ${userDoc.id} subscription as past_due`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const usersSnapshot = await db
          .collection("users")
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (usersSnapshot.empty) {
          break;
        }

        const userDoc = usersSnapshot.docs[0];

        await userDoc.ref.update({
          subscriptionStatus: "active",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`Marked user ${userDoc.id} subscription as active`);
        break;
      }

      default:
        functions.logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    functions.logger.error("Webhook processing error:", error);
    res.status(500).send("Webhook processing failed");
  }
});
