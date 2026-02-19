"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function SplashPage() {
  const router = useRouter();
  const [logoVisible, setLogoVisible] = useState(false);

  useEffect(() => {
    // 로고 등장 애니메이션
    setTimeout(() => setLogoVisible(true), 100);

    const startTime = Date.now();

    const unsub = onAuthStateChanged(auth, async (user) => {
      // 최소 600ms 애니메이션 보장 후 라우팅
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 600 - elapsed);

      setTimeout(async () => {
        if (!user) {
          const hasLang = localStorage.getItem("appLanguage");
          router.replace(hasLang ? "/onboarding" : "/language-select");
          return;
        }

        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          const data = snap.data();
          if (data?.onboardingComplete) {
            router.replace("/home");
          } else {
            const hasLang = localStorage.getItem("appLanguage");
            router.replace(hasLang ? "/onboarding" : "/language-select");
          }
        } catch {
          router.replace("/onboarding");
        }
      }, delay);
    });

    return () => unsub();
  }, [router]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
      }}
    >
      {/* 호랑이 로고 */}
      <div
        style={{
          transition: "transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.6s ease",
          transform: logoVisible ? "scale(1)" : "scale(0.8)",
          opacity: logoVisible ? 1 : 0,
          fontSize: "96px",
          lineHeight: 1,
        }}
      >
        🐯
      </div>

      {/* 앱 이름 */}
      <div
        style={{
          transition: "opacity 0.5s ease 0.2s",
          opacity: logoVisible ? 1 : 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#D63000",
            fontFamily: "Pretendard, sans-serif",
          }}
        >
          Edu_Hangul
        </div>
        <div
          style={{
            fontSize: "15px",
            color: "#6B7280",
            marginTop: "6px",
            fontFamily: "Pretendard, sans-serif",
          }}
        >
          한국어를 재미있게 배워요 🐯
        </div>
      </div>

      {/* 로딩 점 */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginTop: "24px",
          transition: "opacity 0.5s ease 0.4s",
          opacity: logoVisible ? 1 : 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#D63000",
              animation: `bounce 1.2s ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
