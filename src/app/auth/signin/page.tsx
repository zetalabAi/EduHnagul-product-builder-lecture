"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Initialize user document in Firestore
  const initializeUserDocument = async (userId: string, email: string, name?: string) => {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        id: userId,
        email,
        displayName: name || email.split("@")[0],
        subscriptionTier: "free",
        weeklyMinutesUsed: 0,
        weeklyResetAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
        weeklyAssistantUsed: 0,
        analysisUsedLifetime: false,
        dailyAnalysisUsed: 0,
        lastAnalysisReset: Timestamp.now(),
        stripeCustomerId: null,
        subscriptionStatus: null,
        subscriptionEndDate: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  };

  // Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      toast.error("Firebase가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Initialize user document
      await initializeUserDocument(
        result.user.uid,
        result.user.email!,
        result.user.displayName || undefined
      );

      toast.success("환영합니다! 로그인에 성공했습니다.");
      router.push("/");
    } catch (error: any) {
      console.error("Google sign-in error:", error);

      if (error.code === "auth/popup-closed-by-user") {
        toast.error("로그인이 취소되었습니다.");
      } else if (error.code === "auth/popup-blocked") {
        toast.error("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");
      } else {
        toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFirebaseConfigured || !auth) {
      toast.error("Firebase가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (!displayName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Initialize user document with display name
      await initializeUserDocument(result.user.uid, email, displayName);

      toast.success("회원가입이 완료되었습니다!");
      router.push("/");
    } catch (error: any) {
      console.error("Sign-up error:", error);

      if (error.code === "auth/email-already-in-use") {
        toast.error("이미 사용 중인 이메일입니다.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("유효하지 않은 이메일 주소입니다.");
      } else if (error.code === "auth/weak-password") {
        toast.error("비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.");
      } else {
        toast.error("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFirebaseConfigured || !auth) {
      toast.error("Firebase가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Ensure user document exists (in case of legacy users)
      await initializeUserDocument(result.user.uid, email);

      toast.success("환영합니다! 로그인에 성공했습니다.");
      router.push("/");
    } catch (error: any) {
      console.error("Sign-in error:", error);

      if (error.code === "auth/user-not-found") {
        toast.error("등록되지 않은 이메일입니다.");
      } else if (error.code === "auth/wrong-password") {
        toast.error("비밀번호가 올바르지 않습니다.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("유효하지 않은 이메일 주소입니다.");
      } else if (error.code === "auth/invalid-credential") {
        toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
      } else {
        toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/icons/icon-192x192.png"
              alt="Edu_Hangul"
              width={80}
              height={80}
              className="rounded-xl shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">Edu_Hangul</h1>
          <p className="text-gray-600">AI 한국어 학습 플랫폼</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Firebase Warning */}
          {!isFirebaseConfigured && (
            <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
              <div className="font-semibold mb-1">⚠️ Firebase 미설정</div>
              <div className="text-xs">
                UI 미리보기 모드입니다. 전체 기능을 사용하려면{" "}
                <code className="bg-yellow-200 px-1 rounded">.env.local</code> 파일에 Firebase 설정을
                추가해주세요.
              </div>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setMode("signin")}
              disabled={isLoading}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                mode === "signin"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setMode("signup")}
              disabled={isLoading}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                mode === "signup"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              회원가입
            </button>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={mode === "signin" ? handleEmailSignIn : handleEmailSignUp}>
            {mode === "signup" && (
              <div className="mb-4">
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="홍길동"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="example@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="최소 6자 이상"
                required
                disabled={isLoading}
              />
            </div>

            {mode === "signup" && (
              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isLoading ? "처리 중..." : mode === "signin" ? "로그인" : "회원가입"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          계정을 생성하면{" "}
          <button className="text-primary-600 hover:underline">이용약관</button>과{" "}
          <button className="text-primary-600 hover:underline">개인정보처리방침</button>에 동의하는
          것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
