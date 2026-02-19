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
import { useLanguage } from "@/hooks/useLanguage";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const initializeUserDocument = async (userId: string, userEmail: string, name?: string) => {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        id: userId,
        email: userEmail,
        displayName: name || userEmail.split("@")[0],
        subscriptionTier: "free",
        mannerTemp: 36.5,
        streakDays: 0,
        freeSessionsLeft: 3,
        isPremium: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      toast.error("Firebase가 설정되지 않았습니다.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await initializeUserDocument(result.user.uid, result.user.email!, result.user.displayName || undefined);
      toast.success(t("auth.success.login"));
      router.push("/");
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        toast.error(t("auth.err.google_cancel"));
      } else {
        toast.error(t("auth.err.login_fail"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error(t("auth.err.pw_mismatch")); return; }
    if (password.length < 6) { toast.error(t("auth.err.pw_short")); return; }
    if (!displayName.trim()) { toast.error(t("auth.err.name_required")); return; }
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth!, email, password);
      await initializeUserDocument(result.user.uid, email, displayName);
      toast.success(t("auth.success.signup"));
      router.push("/");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") toast.error(t("auth.err.email_used"));
      else if (error.code === "auth/weak-password") toast.error(t("auth.err.pw_weak"));
      else toast.error(t("auth.err.signup_fail"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth!, email, password);
      await initializeUserDocument(result.user.uid, email);
      toast.success(t("auth.success.login"));
      router.push("/");
    } catch (error: any) {
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        toast.error(t("auth.err.invalid_credential"));
      } else if (error.code === "auth/too-many-requests") {
        toast.error(t("auth.err.too_many"));
      } else {
        toast.error(t("auth.err.login_fail"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: "#F8F9FA",
    border: "1.5px solid #E5E7EB",
    borderRadius: "12px",
    fontSize: "16px",
    color: "#1A1A2E",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "Pretendard, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "6px",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FA", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Pretendard, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "64px", marginBottom: "12px", animation: "bounceIn 0.5s both" }}>🐯</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#D63000", marginBottom: "4px" }}>Edu_Hangul</div>
          <div style={{ fontSize: "14px", color: "#6B7280" }}>{t("auth.subtitle")}</div>
        </div>

        {/* 카드 */}
        <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

          {/* Firebase 경고 */}
          {!isFirebaseConfigured && (
            <div style={{ marginBottom: "20px", padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "12px", fontSize: "13px", color: "#92400E" }}>
              ⚠️ Firebase 미설정 — UI 미리보기 모드입니다.
            </div>
          )}

          {/* 모드 탭 */}
          <div style={{ display: "flex", gap: "4px", background: "#F3F4F6", borderRadius: "12px", padding: "4px", marginBottom: "24px" }}>
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={isLoading}
                style={{ flex: 1, height: "38px", border: "none", borderRadius: "9px", background: mode === m ? "#D63000" : "transparent", color: mode === m ? "#fff" : "#6B7280", fontWeight: mode === m ? 700 : 500, fontSize: "14px", cursor: "pointer", transition: "all 0.15s" }}
              >
                {m === "signin" ? t("auth.signin") : t("auth.signup")}
              </button>
            ))}
          </div>

          {/* Google 로그인 */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px", border: "1.5px solid #E5E7EB", borderRadius: "12px", background: "#fff", fontSize: "15px", fontWeight: 600, color: "#1A1A2E", cursor: isLoading ? "not-allowed" : "pointer", marginBottom: "20px", opacity: isLoading ? 0.5 : 1, transition: "border-color 0.15s" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("auth.google")}
          </button>

          {/* 구분선 */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
            <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{t("auth.or")}</span>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
          </div>

          {/* 이메일/비밀번호 폼 */}
          <form onSubmit={mode === "signin" ? handleEmailSignIn : handleEmailSignUp}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
              {mode === "signup" && (
                <div>
                  <label style={labelStyle}>{t("auth.name")}</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} placeholder={t("auth.name.placeholder")} required disabled={isLoading} />
                </div>
              )}
              <div>
                <label style={labelStyle}>{t("auth.email")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="example@email.com" required disabled={isLoading} />
              </div>
              <div>
                <label style={labelStyle}>{t("auth.password")}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder={t("auth.password.placeholder")} required disabled={isLoading} />
              </div>
              {mode === "signup" && (
                <div>
                  <label style={labelStyle}>{t("auth.password.confirm")}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} placeholder={t("auth.password.confirm.placeholder")} required disabled={isLoading} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", height: "52px", background: isLoading ? "#E5E7EB" : "linear-gradient(135deg, #D63000, #FF5722)", color: isLoading ? "#9CA3AF" : "#fff", border: "none", borderRadius: "9999px", fontWeight: 700, fontSize: "16px", cursor: isLoading ? "not-allowed" : "pointer", transition: "all 0.15s" }}
            >
              {isLoading ? t("auth.loading") : mode === "signin" ? t("auth.signin") : t("auth.signup")}
            </button>
          </form>
        </div>

        {/* 약관 */}
        <p style={{ textAlign: "center", fontSize: "12px", color: "#9CA3AF", marginTop: "20px", lineHeight: 1.6 }}>
          {t("auth.terms")}{" "}
          <span style={{ color: "#D63000", cursor: "pointer" }}>{t("auth.terms.service")}</span>{" "}
          {t("auth.terms.and")}{" "}
          <span style={{ color: "#D63000", cursor: "pointer" }}>{t("auth.terms.privacy")}</span>.
        </p>
      </div>

      <style>{`@keyframes bounceIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
