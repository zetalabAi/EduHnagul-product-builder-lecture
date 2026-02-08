import { CallableContext } from "firebase-functions/v1/https";
import { AppError } from "../types";

export function requireAuth(context: CallableContext): string {
  if (!context.auth) {
    throw new AppError("AUTH_REQUIRED", "Authentication required", 401);
  }
  return context.auth.uid;
}
