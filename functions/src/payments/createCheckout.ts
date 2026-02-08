import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { config } from "../config";
import { AppError, UserDocument } from "../types";
import { requireAuth } from "../utils/auth";

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2023-10-16",
});

export const createStripeCheckout = functions.https.onCall(async (data, context) => {
  try {
    const userId = requireAuth(context);
    const { successUrl, cancelUrl } = data;

    if (!successUrl || !cancelUrl) {
      throw new AppError("INVALID_INPUT", "Success and cancel URLs are required", 400);
    }

    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw new AppError("USER_NOT_FOUND", "User not found", 404);
    }

    const user = userDoc.data() as UserDocument;

    // Check if already subscribed
    if (user.subscriptionTier === "pro" && user.subscriptionStatus === "active") {
      throw new AppError("ALREADY_SUBSCRIBED", "User already has an active Pro subscription", 400);
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          firebaseUID: userId,
        },
      });

      customerId = customer.id;

      await userDoc.ref.update({
        stripeCustomerId: customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: config.stripe.priceId, // Set this in Firebase config
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebaseUID: userId,
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  } catch (error: any) {
    functions.logger.error("createStripeCheckout error:", error);

    if (error instanceof AppError) {
      throw new functions.https.HttpsError(
        error.statusCode === 401 ? "unauthenticated" :
        error.statusCode === 404 ? "not-found" : "invalid-argument",
        error.message,
        { code: error.code }
      );
    }

    throw new functions.https.HttpsError("internal", "Failed to create checkout session");
  }
});
