"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { useUserCredits } from "@/hooks/useUserCredits";

interface PlanFeatures {
  weeklyMinutes: string;
  ads: boolean;
  analysisQuota: string;
  assistant: string;
  ai: string;
  tts: string;
}

const plans: Record<string, PlanFeatures> = {
  free: {
    weeklyMinutes: "15분",
    ads: true,
    analysisQuota: "평생 1회",
    assistant: "없음",
    ai: "Claude Sonnet 3.5",
    tts: "Google Journey (감정 표현)",
  },
  "free+": {
    weeklyMinutes: "25분",
    ads: false,
    analysisQuota: "평생 1회",
    assistant: "주 1회",
    ai: "Claude Sonnet 3.5",
    tts: "Google Journey (감정 표현)",
  },
  pro: {
    weeklyMinutes: "무제한",
    ads: false,
    analysisQuota: "일 3회",
    assistant: "무제한",
    ai: "Claude Sonnet 3.5",
    tts: "Google Journey (감정 표현)",
  },
  "pro+": {
    weeklyMinutes: "무제한",
    ads: false,
    analysisQuota: "일 7회",
    assistant: "무제한",
    ai: "Claude Sonnet 3.5",
    tts: "Google Journey (감정 표현)",
  },
};

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [birthDate, setBirthDate] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const { credits } = useUserCredits(user?.uid || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push("/auth/signin");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (credits?.birthDate) {
      setBirthDate(credits.birthDate.toISOString().split("T")[0]);
      setIsStudent(credits.isStudent);
    }
  }, [credits]);

  const handleSubscribe = async (tier: "free+" | "pro" | "pro+", annual: boolean) => {
    if (!functions) return;

    try {
      setIsLoading(true);

      // Determine price ID
      let priceKey = "";
      if (tier === "free+") {
        priceKey = annual ? "FREE_PLUS_YEARLY" : "FREE_PLUS_MONTHLY";
      } else if (tier === "pro") {
        priceKey = annual ? "PRO_YEARLY" : "PRO_MONTHLY";
      } else if (tier === "pro+") {
        // Check if student eligible
        if (isStudent && tier === "pro+") {
          priceKey = annual ? "PRO_PLUS_STUDENT_YEARLY" : "PRO_PLUS_STUDENT_MONTHLY";
        } else {
          priceKey = annual ? "PRO_PLUS_YEARLY" : "PRO_PLUS_MONTHLY";
        }
      }

      const priceId = `price_${priceKey.toLowerCase()}`;

      const createCheckoutFn = httpsCallable<
        { priceId: string; successUrl: string; cancelUrl: string },
        { sessionId: string; url: string }
      >(functions, "createCheckoutSession");

      const result = await createCheckoutFn({
        priceId,
        successUrl: `${window.location.origin}/pricing?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      });

      // Redirect to Stripe Checkout
      window.location.href = result.data.url;
    } catch (error: any) {
      console.error("Failed to create checkout:", error);
      alert(error.message || "구독 시작에 실패했습니다. 다시 시도해주세요.");
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
        returnUrl: `${window.location.origin}/pricing`,
      });

      window.location.href = result.data.url;
    } catch (error: any) {
      console.error("Failed to open portal:", error);
      alert("구독 관리 페이지를 열 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentTier = credits?.subscriptionTier || "free";
  const hasActiveSubscription = currentTier !== "free";

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">요금제</h1>
        <p className="text-gray-400 text-center mb-8">
          한국어 학습에 딱 맞는 플랜을 선택하세요
        </p>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md font-medium transition ${
                billingCycle === "monthly"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              월간
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-md font-medium transition ${
                billingCycle === "yearly"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              연간 <span className="text-green-400 text-sm ml-1">2개월 무료!</span>
            </button>
          </div>
        </div>

        {/* Current Plan Badge */}
        {hasActiveSubscription && (
          <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4 mb-8 text-center">
            <p className="text-blue-200">
              현재 플랜: <span className="font-bold text-white uppercase">{currentTier}</span>
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
            >
              구독 관리
            </button>
          </div>
        )}

        {/* Student Eligibility */}
        {isStudent && (
          <div className="bg-green-900 bg-opacity-30 rounded-lg p-4 mb-8 text-center">
            <p className="text-green-200">
              🎓 학생 할인 적용 가능! (만 20세 이하)
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Pro+ 플랜이 특별 가격으로 제공됩니다
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Free */}
          <div className="bg-gray-800 rounded-xl p-6 border-2 border-gray-700">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-gray-400 text-sm mb-4">맛보기</p>
            <p className="text-4xl font-bold mb-6">$0</p>

            <ul className="space-y-3 mb-6 text-sm">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>주 15분 대화</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">✗</span>
                <span className="text-gray-500">광고 있음</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>분석 평생 1회</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Claude Sonnet 3.5</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full bg-gray-700 text-gray-500 px-6 py-3 rounded-lg font-bold cursor-not-allowed"
            >
              현재 플랜
            </button>
          </div>

          {/* Free+ */}
          <div className="bg-gray-800 rounded-xl p-6 border-2 border-blue-500">
            <h3 className="text-2xl font-bold mb-2">Free+</h3>
            <p className="text-gray-400 text-sm mb-4">광고 제거</p>
            <p className="text-4xl font-bold mb-6">
              ${billingCycle === "monthly" ? "4.9" : "49"}
              <span className="text-lg text-gray-400">
                /{billingCycle === "monthly" ? "월" : "년"}
              </span>
            </p>

            <ul className="space-y-3 mb-6 text-sm">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>주 25분 대화</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>광고 제거</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>분석 평생 1회</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>대화 도우미 주 1회</span>
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe("free+", billingCycle === "yearly")}
              disabled={isLoading || currentTier === "free+"}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-3 rounded-lg font-bold"
            >
              {currentTier === "free+" ? "현재 플랜" : "선택하기"}
            </button>
          </div>

          {/* Pro */}
          <div className="bg-gray-800 rounded-xl p-6 border-2 border-purple-500">
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-gray-400 text-sm mb-4">무제한 대화</p>
            <p className="text-4xl font-bold mb-6">
              ${billingCycle === "monthly" ? "20.9" : "209"}
              <span className="text-lg text-gray-400">
                /{billingCycle === "monthly" ? "월" : "년"}
              </span>
            </p>

            <ul className="space-y-3 mb-6 text-sm">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>무제한 대화</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>광고 제거</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>분석 일 3회</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>대화 도우미 무제한</span>
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe("pro", billingCycle === "yearly")}
              disabled={isLoading || currentTier === "pro"}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-3 rounded-lg font-bold"
            >
              {currentTier === "pro" ? "현재 플랜" : "선택하기"}
            </button>
          </div>

          {/* Pro+ */}
          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 border-2 border-yellow-400 relative">
            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">
              BEST
            </div>

            <h3 className="text-2xl font-bold mb-2">Pro+</h3>
            <p className="text-gray-100 text-sm mb-4">최고 플랜</p>
            <p className="text-4xl font-bold mb-2">
              ${billingCycle === "monthly"
                ? (isStudent ? "25" : "30.9")
                : (isStudent ? "200" : "309")}
              <span className="text-lg text-gray-100">
                /{billingCycle === "monthly" ? "월" : "년"}
              </span>
            </p>
            {isStudent && (
              <p className="text-xs text-yellow-200 mb-4">
                🎓 학생 할인 적용됨!
              </p>
            )}

            <ul className="space-y-3 mb-6 text-sm">
              <li className="flex items-start">
                <span className="text-yellow-200 mr-2">✓</span>
                <span>무제한 대화</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-200 mr-2">✓</span>
                <span>광고 제거</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-200 mr-2">✓</span>
                <span>분석 일 7회</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-200 mr-2">✓</span>
                <span>대화 도우미 무제한</span>
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe("pro+", billingCycle === "yearly")}
              disabled={isLoading || currentTier === "pro+"}
              className="w-full bg-white text-orange-600 hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-3 rounded-lg font-bold"
            >
              {currentTier === "pro+" ? "현재 플랜" : "선택하기"}
            </button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-6 text-center">상세 비교</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">기능</th>
                  <th className="text-center py-3 px-4">Free</th>
                  <th className="text-center py-3 px-4">Free+</th>
                  <th className="text-center py-3 px-4">Pro</th>
                  <th className="text-center py-3 px-4">Pro+</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">주간 대화 시간</td>
                  <td className="text-center py-3 px-4">15분</td>
                  <td className="text-center py-3 px-4">25분</td>
                  <td className="text-center py-3 px-4 text-green-400">무제한</td>
                  <td className="text-center py-3 px-4 text-green-400">무제한</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">광고</td>
                  <td className="text-center py-3 px-4 text-red-400">있음</td>
                  <td className="text-center py-3 px-4 text-green-400">없음</td>
                  <td className="text-center py-3 px-4 text-green-400">없음</td>
                  <td className="text-center py-3 px-4 text-green-400">없음</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">대화 분석</td>
                  <td className="text-center py-3 px-4">평생 1회</td>
                  <td className="text-center py-3 px-4">평생 1회</td>
                  <td className="text-center py-3 px-4">일 3회</td>
                  <td className="text-center py-3 px-4 text-yellow-400">일 7회</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">대화 도우미</td>
                  <td className="text-center py-3 px-4 text-gray-500">없음</td>
                  <td className="text-center py-3 px-4">주 1회</td>
                  <td className="text-center py-3 px-4 text-green-400">무제한</td>
                  <td className="text-center py-3 px-4 text-green-400">무제한</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3 px-4">AI 모델</td>
                  <td className="text-center py-3 px-4">Sonnet 3.5</td>
                  <td className="text-center py-3 px-4">Sonnet 3.5</td>
                  <td className="text-center py-3 px-4">Sonnet 3.5</td>
                  <td className="text-center py-3 px-4">Sonnet 3.5</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">TTS 음성</td>
                  <td className="text-center py-3 px-4">Journey</td>
                  <td className="text-center py-3 px-4">Journey</td>
                  <td className="text-center py-3 px-4">Journey</td>
                  <td className="text-center py-3 px-4">Journey</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm mb-2">질문이 있으신가요?</p>
          <button
            onClick={() => router.push("/")}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
