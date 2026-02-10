"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { useUserCredits } from "@/hooks/useUserCredits";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!functions) return;

    try {
      setIsLoading(true);
      setMessage("");

      const updateFn = httpsCallable<
        { displayName?: string },
        { success: boolean; message: string }
      >(functions, "updateProfile");

      const updates: any = {};
      if (displayName !== user?.displayName) {
        updates.displayName = displayName;
      }

      const result = await updateFn(updates);
      setMessage(result.data.message);

      // Reload user to get updated display name
      await user?.reload();
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

        <h1 className="text-4xl font-bold mb-8">프로필 설정</h1>

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
        <div className="bg-gray-800 rounded-xl p-6">
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
      </div>
    </div>
  );
}
