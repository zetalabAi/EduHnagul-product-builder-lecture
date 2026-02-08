import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { stripe, PRICE_MAP } from "./config";
import { verifyAuth } from "../auth/authMiddleware";
import { AppError } from "../utils/errors";
import { isStudentAge } from "../utils/studentHelper";
import { UserDocument } from "../types";

interface CreateCheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

interface CreateCheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * Create Stripe Checkout Session
 * Validates student eligibility for student plans
 */
export const createCheckoutSession = functions.https.onCall(
  async (
    data: CreateCheckoutRequest,
    context
  ): Promise<CreateCheckoutResponse> => {
    const userId = verifyAuth(context);
    const { priceId, successUrl, cancelUrl } = data;

    if (!priceId || !successUrl || !cancelUrl) {
      throw new AppError(
        "INVALID_PARAMS",
        "Missing required parameters",
        400
      );
    }

    // Get price info
    const priceInfo = PRICE_MAP[priceId];
    if (!priceInfo) {
      throw new AppError("INVALID_PRICE", "Invalid price ID", 400);
    }

    // Get user document
    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();
    const user = userDoc.data() as UserDocument;

    // Validate student eligibility
    if (priceInfo.isStudent) {
      if (!user.birthDate || !isStudentAge(user.birthDate)) {
        throw new AppError(
          "NOT_ELIGIBLE",
          "Student discount is only available for users 20 years old or younger. Please update your birth date in settings.",
          403
        );
      }
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

      // Save customer ID
      await userRef.update({
        stripeCustomerId: customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebaseUID: userId,
        tier: priceInfo.tier,
        isStudent: priceInfo.isStudent.toString(),
      },
      subscription_data: {
        metadata: {
          firebaseUID: userId,
          tier: priceInfo.tier,
          isStudent: priceInfo.isStudent.toString(),
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }
);

interface CreatePortalSessionRequest {
  returnUrl: string;
}

interface CreatePortalSessionResponse {
  url: string;
}

/**
 * Create Stripe Customer Portal Session
 * For managing subscriptions
 */
export const createPortalSession = functions.https.onCall(
  async (
    data: CreatePortalSessionRequest,
    context
  ): Promise<CreatePortalSessionResponse> => {
    const userId = verifyAuth(context);
    const { returnUrl } = data;

    if (!returnUrl) {
      throw new AppError("INVALID_PARAMS", "Missing return URL", 400);
    }

    // Get user
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const user = userDoc.data() as UserDocument;

    if (!user.stripeCustomerId) {
      throw new AppError(
        "NO_CUSTOMER",
        "No Stripe customer found. Please subscribe first.",
        404
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  }
);
