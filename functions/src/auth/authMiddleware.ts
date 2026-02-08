import {CallableContext} from "firebase-functions/v1/https";
import {AppError} from "../types";

/**
 * Verify that the user is authenticated and return their UID
 */
export function verifyAuth(context: CallableContext): string {
  if (!context.auth || !context.auth.uid) {
    throw new AppError("UNAUTHENTICATED", "User must be authenticated", 401);
  }
  return context.auth.uid;
}
