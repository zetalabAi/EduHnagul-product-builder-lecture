"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useOnboarding } from "@/hooks/useOnboarding";

// Onboarding Components
import Welcome from "@/components/Onboarding/Welcome";
import GoalSelection from "@/components/Onboarding/GoalSelection";
import LevelTest from "@/components/Onboarding/LevelTest";
import StyleQuiz from "@/components/Onboarding/StyleQuiz";
import ScheduleSetup from "@/components/Onboarding/ScheduleSetup";
import NotificationSetup from "@/components/Onboarding/NotificationSetup";
import Complete from "@/components/Onboarding/Complete";

/**
 * Onboarding Page
 * 7-step onboarding flow for new users
 */
export default function OnboardingPage() {
  const router = useRouter();
  const {
    step,
    data,
    isSubmitting,
    error,
    nextStep,
    previousStep,
    complete,
    totalSteps,
  } = useOnboarding();

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/auth/signin");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleComplete = async () => {
    const result = await complete();

    if (result.success) {
      // Redirect to home page
      router.push("/");
    } else {
      alert(result.error || "온보딩 완료에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={previousStep}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Edu_Hangul
              </h1>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {step} / {totalSteps}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {step === 1 && <Welcome onNext={() => nextStep({})} />}

        {step === 2 && (
          <GoalSelection onNext={(stepData) => nextStep(stepData)} />
        )}

        {step === 3 && (
          <LevelTest onNext={(stepData) => nextStep(stepData)} />
        )}

        {step === 4 && (
          <StyleQuiz onNext={(stepData) => nextStep(stepData)} />
        )}

        {step === 5 && (
          <ScheduleSetup onNext={(stepData) => nextStep(stepData)} />
        )}

        {step === 6 && (
          <NotificationSetup onNext={(stepData) => nextStep(stepData)} />
        )}

        {step === 7 && (
          <Complete onComplete={handleComplete} isLoading={isSubmitting} />
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
}
