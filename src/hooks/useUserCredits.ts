"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserCredits {
  subscriptionTier: "free" | "free+" | "pro" | "pro+";
  koreanLevel: "beginner" | "intermediate" | "advanced";
  weeklyMinutesUsed: number;
  weeklyResetAt: Date;
  remainingMinutes: number;
  isStudent: boolean;
  birthDate: Date | null;
  analysisUsedLifetime: boolean;
  dailyAnalysisUsed: number;
  weeklyAssistantUsed: number;
  subscriptionStatus: "active" | "canceled" | "past_due" | null;
}

export function useUserCredits(userId: string | null) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !db) {
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setIsLoading(false);
          return;
        }

        const data = snapshot.data();

        // Calculate remaining minutes
        const weeklyLimit = getWeeklyLimit(data.subscriptionTier);
        const used = data.weeklyMinutesUsed || 0;
        const remaining = weeklyLimit === Infinity ? Infinity : weeklyLimit - used;

        setCredits({
          subscriptionTier: data.subscriptionTier,
          koreanLevel: data.koreanLevel || "intermediate", // 기본값: 중급
          weeklyMinutesUsed: data.weeklyMinutesUsed || 0,
          weeklyResetAt: data.weeklyResetAt?.toDate() || new Date(),
          remainingMinutes: Math.max(0, remaining),
          isStudent: data.isStudent || false,
          birthDate: data.birthDate?.toDate() || null,
          analysisUsedLifetime: data.analysisUsedLifetime || false,
          dailyAnalysisUsed: data.dailyAnalysisUsed || 0,
          weeklyAssistantUsed: data.weeklyAssistantUsed || 0,
          subscriptionStatus: data.subscriptionStatus || null,
        });

        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching user credits:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { credits, isLoading };
}

function getWeeklyLimit(tier: string): number {
  // TEST MODE: Unlimited minutes for all tiers during testing
  return Infinity;

  /* Original limits (restore after testing):
  switch (tier) {
    case "free":
      return 15;
    case "free+":
      return 25;
    case "pro":
    case "pro+":
      return Infinity;
    default:
      return 15;
  }
  */
}
