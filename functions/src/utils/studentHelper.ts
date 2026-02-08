import {Timestamp} from "firebase-admin/firestore";

/**
 * Check if user is a student (20 years old or younger)
 * 만 20세 이하인지 확인
 */
export function isStudentAge(birthDate: Timestamp | null): boolean {
  if (!birthDate) {
    return false;
  }

  const birth = birthDate.toDate();
  const today = new Date();

  // Calculate age
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // Adjust if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age <= 20;
}

/**
 * Get student price for Pro+ plan
 */
export function getStudentPrice(
  isStudent: boolean,
  isAnnual: boolean
): number {
  if (!isStudent) {
    return isAnnual ? 309 : 30.9; // Regular Pro+ price
  }

  // Student discount
  return isAnnual ? 200 : 25; // 8 months pay + 4 months free (annual)
}
