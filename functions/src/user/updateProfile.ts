import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { verifyAuth } from "../auth/authMiddleware";
import { AppError } from "../utils/errors";
import { isStudentAge } from "../utils/studentHelper";
import { Timestamp } from "firebase-admin/firestore";

interface UpdateProfileRequest {
  birthDate?: string; // ISO date string (YYYY-MM-DD)
  displayName?: string;
  koreanLevel?: "beginner" | "intermediate" | "advanced";
}

interface UpdateProfileResponse {
  success: boolean;
  isStudent: boolean;
  message: string;
}

/**
 * Update User Profile
 * Handles birth date for student eligibility
 */
export const updateProfile = functions.https.onCall(
  async (
    data: UpdateProfileRequest,
    context
  ): Promise<UpdateProfileResponse> => {
    const userId = verifyAuth(context);
    const { birthDate, displayName, koreanLevel } = data;

    const userRef = admin.firestore().collection("users").doc(userId);
    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    let isStudent = false;

    // Handle birth date update
    if (birthDate !== undefined) {
      if (!birthDate) {
        // Clear birth date
        updates.birthDate = null;
        updates.isStudent = false;
      } else {
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(birthDate)) {
          throw new AppError(
            "INVALID_DATE",
            "Invalid date format. Use YYYY-MM-DD",
            400
          );
        }

        const birthDateObj = new Date(birthDate);
        if (isNaN(birthDateObj.getTime())) {
          throw new AppError(
            "INVALID_DATE",
            "Invalid date value",
            400
          );
        }

        // Check if future date
        if (birthDateObj > new Date()) {
          throw new AppError(
            "INVALID_DATE",
            "Birth date cannot be in the future",
            400
          );
        }

        const birthTimestamp = Timestamp.fromDate(birthDateObj);
        updates.birthDate = birthTimestamp;

        // Check student eligibility
        isStudent = isStudentAge(birthTimestamp);
        updates.isStudent = isStudent;
      }
    }

    // Handle display name update
    if (displayName !== undefined) {
      if (displayName.trim().length === 0) {
        throw new AppError(
          "INVALID_NAME",
          "Display name cannot be empty",
          400
        );
      }
      updates.displayName = displayName.trim();
    }

    // Handle Korean level update
    if (koreanLevel !== undefined) {
      const validLevels = ["beginner", "intermediate", "advanced"];
      if (!validLevels.includes(koreanLevel)) {
        throw new AppError(
          "INVALID_LEVEL",
          "Invalid Korean level. Must be beginner, intermediate, or advanced",
          400
        );
      }
      updates.koreanLevel = koreanLevel;
    }

    // Update Firestore (source of truth)
    await userRef.update(updates);

    let message = "프로필이 업데이트되었습니다.";
    if (birthDate !== undefined && birthDate) {
      if (isStudent) {
        message += " 학생 할인이 적용됩니다! (만 20세 이하)";
      } else {
        message += " 학생 할인은 만 20세 이하만 가능합니다.";
      }
    }

    return {
      success: true,
      isStudent,
      message,
    };
  }
);
