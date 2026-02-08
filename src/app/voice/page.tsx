"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { VoiceChat } from "@/components/VoiceChat";
import { useUserCredits } from "@/hooks/useUserCredits";

interface CreateSessionResponse {
  sessionId: string;
}

export default function VoiceChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { credits, isLoading: creditsLoading } = useUserCredits(user?.uid || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/signin");
      } else {
        setUser(currentUser);
        initializeSession();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const initializeSession = async () => {
    if (!functions) return;

    try {
      setIsLoading(true);

      // Create a new voice session with default settings
      const createSessionFn = httpsCallable<
        {
          persona: string;
          responseStyle: string;
          correctionStrength: string;
          formalityLevel: string;
          isVoiceSession: boolean;
        },
        CreateSessionResponse
      >(functions, "createSession");

      const result = await createSessionFn({
        persona: "same-sex-friend",
        responseStyle: "balanced",
        correctionStrength: "minimal",
        formalityLevel: "casual",
        isVoiceSession: true,
      });

      setSessionId(result.data.sessionId);
    } catch (error) {
      console.error("Failed to initialize session:", error);
      alert("세션 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || creditsLoading || !sessionId || !credits) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>세션 준비 중...</p>
        </div>
      </div>
    );
  }

  // Check if user has credits
  if (credits.remainingMinutes <= 0 && credits.subscriptionTier !== "pro" && credits.subscriptionTier !== "pro+") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md px-6">
          <h2 className="text-3xl font-bold mb-4">⏰ 시간 소진</h2>
          <p className="text-gray-400 mb-2">
            이번 주 무료 시간을 모두 사용했어요!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            다음 충전: {credits.weeklyResetAt.toLocaleDateString("ko-KR")}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/pricing")}
              className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold"
            >
              Pro로 업그레이드 (무제한!)
            </button>
            {credits.subscriptionTier === "free+" && (
              <button
                onClick={() => alert("추가 구매 기능 준비 중")}
                className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg"
              >
                추가 60분 구매 ($2)
              </button>
            )}
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPro = credits.subscriptionTier === "pro" || credits.subscriptionTier === "pro+";

  return (
    <VoiceChat
      sessionId={sessionId}
      remainingMinutes={credits.remainingMinutes}
      onMinutesUpdate={() => {}} // Credits are updated via Firestore listener
      isPro={isPro}
      subscriptionTier={credits.subscriptionTier}
    />
  );
}
