import { useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { OnboardingData } from "@/types/onboarding";

/**
 * useOnboarding Hook
 * Manage onboarding flow state
 */
export function useOnboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    goal: null,
    level: null,
    learningStyle: null,
    dailyMinutes: null,
    preferredTime: null,
    notifications: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Move to next step with data
   */
  const nextStep = useCallback(
    (stepData: Partial<OnboardingData>) => {
      setData((prev) => ({ ...prev, ...stepData }));
      setStep((prev) => prev + 1);
    },
    []
  );

  /**
   * Go back to previous step
   */
  const previousStep = useCallback(() => {
    setStep((prev) => Math.max(1, prev - 1));
  }, []);

  /**
   * Complete onboarding
   */
  const complete = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const createProfileFn = httpsCallable<
        OnboardingData,
        { success: boolean }
      >(functions, "createUserProfile");

      await createProfileFn(data);

      return { success: true };
    } catch (err: any) {
      console.error("Failed to complete onboarding:", err);
      setError(err.message || "온보딩 완료에 실패했습니다.");
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [data]);

  return {
    step,
    data,
    isSubmitting,
    error,
    nextStep,
    previousStep,
    complete,
    totalSteps: 7,
  };
}
