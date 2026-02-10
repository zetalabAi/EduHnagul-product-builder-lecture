"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { useUserCredits } from "@/hooks/useUserCredits";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [koreanLevel, setKoreanLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { credits } = useUserCredits(user?.uid || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push("/auth/signin");
      } else {
        setDisplayName(currentUser.displayName || "");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Load korean level from credits
  useEffect(() => {
    if (credits?.koreanLevel) {
      setKoreanLevel(credits.koreanLevel);
    }
  }, [credits]);

  const handleKoreanLevelChange = async (newLevel: "beginner" | "intermediate" | "advanced") => {
    setKoreanLevel(newLevel);

    // Update immediately in Firestore
    if (functions) {
      try {
        const updateFn = httpsCallable(functions, "updateProfile");
        await updateFn({ koreanLevel: newLevel });
        toast.success("한국어 레벨이 업데이트되었습니다!");
      } catch (error: any) {
        console.error("Failed to update Korean level:", error);
        toast.error("레벨 업데이트에 실패했습니다.");
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!functions) return;

    try {
      setIsLoading(true);
      setMessage("");

      const updateFn = httpsCallable<
        { displayName?: string; koreanLevel?: string },
        { success: boolean; message: string }
      >(functions, "updateProfile");

      const updates: any = {};
      if (displayName !== user?.displayName) {
        updates.displayName = displayName;
      }
      // Korean level is now updated immediately, so no need to include it here

      const result = await updateFn(updates);
      toast.success(result.data.message);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      setMessage(error.message || "프로필 업데이트에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!functions) return;

    try {
      setIsLoading(true);

      const createPortalFn = httpsCallable<
        { returnUrl: string },
        { url: string }
      >(functions, "createPortalSession");

      const result = await createPortalFn({
        returnUrl: `${window.location.origin}/settings`,
      });

      window.location.href = result.data.url;
    } catch (error: any) {
      console.error("Failed to open portal:", error);
      toast.error("구독 관리 페이지를 열 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("로그아웃되었습니다.");
      router.push("/");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  if (!user || !credits) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 md:py-12 md:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-blue-400 hover:text-blue-300 transition-colors active:scale-95 touch-manipulation"
          >
            <span className="text-lg">←</span>
            <span className="font-medium">홈으로</span>
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-8">프로필</h1>

        {/* Account Info */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">계정 정보</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">이메일</label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full bg-gray-700 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">이름</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이름을 입력하세요"
              />
            </div>

            {message && (
              <div className="bg-blue-900 bg-opacity-50 rounded-lg p-3">
                <p className="text-blue-200 text-sm">{message}</p>
              </div>
            )}

            <button
              onClick={handleUpdateProfile}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-bold"
            >
              {isLoading ? "업데이트 중..." : "프로필 업데이트"}
            </button>
          </div>
        </div>

        {/* Korean Level Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📚 한국어 레벨</h2>
          <p className="text-sm text-gray-400 mb-4">
            AI가 당신의 레벨에 맞춰 대화합니다. 레벨이 높을수록 더 많은 질문과 복잡한 표현을 사용합니다.
            <br />
            <span className="text-blue-400">💡 선택하면 즉시 저장되며, 모든 대화에 자동으로 적용됩니다.</span>
          </p>

          <div className="space-y-3">
            <label className="flex items-start space-x-3 p-4 bg-gray-700 hover:bg-gray-650 rounded-lg cursor-pointer transition">
              <input
                type="radio"
                name="koreanLevel"
                value="beginner"
                checked={koreanLevel === "beginner"}
                onChange={(e) => handleKoreanLevelChange(e.target.value as "beginner")}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-bold text-white">🌱 초급 (Beginner)</div>
                <div className="text-sm text-gray-400 mt-1">
                  짧은 문장, 기본 어휘, 한 번에 1개 질문
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-4 bg-gray-700 hover:bg-gray-650 rounded-lg cursor-pointer transition">
              <input
                type="radio"
                name="koreanLevel"
                value="intermediate"
                checked={koreanLevel === "intermediate"}
                onChange={(e) => handleKoreanLevelChange(e.target.value as "intermediate")}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-bold text-white">🌿 중급 (Intermediate)</div>
                <div className="text-sm text-gray-400 mt-1">
                  자연스러운 대화, 일상 어휘, 한 번에 1-2개 질문
                </div>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-4 bg-gray-700 hover:bg-gray-650 rounded-lg cursor-pointer transition">
              <input
                type="radio"
                name="koreanLevel"
                value="advanced"
                checked={koreanLevel === "advanced"}
                onChange={(e) => handleKoreanLevelChange(e.target.value as "advanced")}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <div className="font-bold text-white">🌳 고급 (Advanced)</div>
                <div className="text-sm text-gray-400 mt-1">
                  원어민 수준, 다양한 표현, 질문 개수 제한 없음
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">구독 정보</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">현재 플랜</span>
              <span className="font-bold uppercase">{credits.subscriptionTier}</span>
            </div>

            {credits.subscriptionStatus && (
              <div className="flex justify-between">
                <span className="text-gray-400">상태</span>
                <span
                  className={`font-medium ${
                    credits.subscriptionStatus === "active"
                      ? "text-green-400"
                      : credits.subscriptionStatus === "past_due"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {credits.subscriptionStatus === "active"
                    ? "활성"
                    : credits.subscriptionStatus === "past_due"
                      ? "결제 대기"
                      : "취소됨"}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-400">주간 사용 시간</span>
              <span>
                {credits.weeklyMinutesUsed}분 /{" "}
                {credits.subscriptionTier === "pro" || credits.subscriptionTier === "pro+"
                  ? "무제한"
                  : credits.subscriptionTier === "free+"
                    ? "25분"
                    : "15분"}
              </span>
            </div>

            {credits.weeklyResetAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">다음 충전</span>
                <span>{credits.weeklyResetAt.toLocaleDateString("ko-KR")}</span>
              </div>
            )}

            {credits.subscriptionTier !== "free" && (
              <button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-bold mt-4"
              >
                구독 관리
              </button>
            )}

            {credits.subscriptionTier === "free" && (
              <button
                onClick={() => router.push("/pricing")}
                className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold mt-4"
              >
                플랜 업그레이드
              </button>
            )}
          </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">사용 현황</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">대화 도우미 사용</span>
              <span>
                {credits.weeklyAssistantUsed}회 /{" "}
                {credits.subscriptionTier === "pro" || credits.subscriptionTier === "pro+"
                  ? "무제한"
                  : credits.subscriptionTier === "free+"
                    ? "주 1회"
                    : "없음"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">분석 사용</span>
              <span>
                {credits.subscriptionTier === "free" || credits.subscriptionTier === "free+"
                  ? credits.analysisUsedLifetime
                    ? "1회 (평생 1회 사용 완료)"
                    : "0회 (평생 1회)"
                  : `${credits.dailyAnalysisUsed}회 / ${
                      credits.subscriptionTier === "pro+" ? "일 7회" : "일 3회"
                    }`}
              </span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="bg-gray-800 rounded-xl p-6">
          <button
            onClick={handleLogout}
            className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 text-red-500 hover:text-red-400"
          >
            <span>🚪</span>
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  );
}
