"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useGarden } from "@/hooks/useGarden";
import GardenGrid from "@/components/Garden/GardenGrid";

/**
 * Garden Page
 * Mistake Garden - Where mistakes become flowers
 */
export default function GardenPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/signin");
      } else {
        setUser(currentUser);
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Garden hook
  const {
    plants,
    stats,
    isLoading: gardenLoading,
    error,
    waterPlant,
  } = useGarden(user?.uid || null);

  // Handle watering a plant
  const handleWaterPlant = async (plantId: string, success: boolean) => {
    try {
      const result = await waterPlant(plantId, success);
      return result;
    } catch (err) {
      console.error("Failed to water plant:", err);
      throw err;
    }
  };

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
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
              <span className="font-medium">홈으로</span>
            </button>

            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              실수 정원 🌸
            </h1>

            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {error ? (
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>
          </div>
        ) : (
          <GardenGrid
            plants={plants}
            stats={stats}
            isLoading={gardenLoading}
            onWaterPlant={handleWaterPlant}
          />
        )}
      </div>

      {/* Helpful Tip */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            💡 <strong>팁:</strong> 실수를 10번 연습하면 완벽하게 숙달됩니다!
            각 식물을 클릭하여 연습하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
