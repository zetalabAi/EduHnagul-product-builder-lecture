"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useLanguage } from "@/hooks/useLanguage";

const TUTOR_INFO = {
  jimin:  { name: "지민", emoji: "👩", color: "#EC4899", bg: "#FDF2F8", label: "K-drama 선생님" },
  minjun: { name: "민준", emoji: "👨", color: "#D63000", bg: "#FFF0EB", label: "K-pop 선생님" },
};

export default function SessionModePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useSearchParams();
  const tutor = (params.get("tutor") ?? "jimin") as "jimin" | "minjun";
  const [userName, setUserName] = useState("");
  const [speechStyle, setSpeechStyle] = useState<"formal" | "casual">("formal");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/onboarding"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      if (data) {
        setUserName(data.name ?? "학습자");
        setSpeechStyle(data.speechStyle ?? "formal");
      }
    });
    return () => unsub();
  }, [router]);

  const tutorInfo = TUTOR_INFO[tutor];
  const greeting = speechStyle === "casual"
    ? `${userName}아/야, 어떻게 대화할까?`
    : `${userName}님, 어떻게 대화할까요?`;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#F8F9FA", fontFamily: "Pretendard, sans-serif" }}>

      {/* 헤더 */}
      <header style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <button onClick={() => router.push("/home")} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6B7280", marginRight: "12px" }}>←</button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: tutorInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
            {tutorInfo.emoji}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A1A2E" }}>{tutorInfo.name}</div>
            <div style={{ fontSize: "11px", color: tutorInfo.color }}>{tutorInfo.label}</div>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: "16px" }}>

        {/* 튜터 아바타 */}
        <div style={{ fontSize: "80px", lineHeight: 1, animation: "float 3s ease-in-out infinite" }}>{tutorInfo.emoji}</div>

        {/* 인사 */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#1A1A2E" }}>어떻게 대화할까요?</div>
          {userName && (
            <div style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>{greeting}</div>
          )}
        </div>

        {/* 음성 대화 카드 */}
        <button
          onClick={() => {
            // 브라우저 Autoplay 정책 우회: 유저 클릭 시점에 silent audio로 unlock
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              ctx.resume();
            } catch {}
            router.push(`/session/voice?tutor=${tutor}`);
          }}
          style={{
            width: "100%",
            maxWidth: "380px",
            background: "#FFF0EB",
            border: "2px solid #D63000",
            borderRadius: "20px",
            padding: "24px 20px",
            textAlign: "left",
            cursor: "pointer",
            transition: "transform 0.15s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎙️</div>
          <div style={{ fontWeight: 800, fontSize: "18px", color: "#D63000", marginBottom: "4px" }}>{t("session.voice")}</div>
          <div style={{ fontSize: "14px", color: "#92400E", lineHeight: 1.5 }}>
            {t("session.voice.desc")}
          </div>
        </button>

        {/* 채팅 대화 카드 */}
        <button
          onClick={() => router.push(`/session/chat?tutor=${tutor}`)}
          style={{
            width: "100%",
            maxWidth: "380px",
            background: "#fff",
            border: "1.5px solid #E5E7EB",
            borderRadius: "20px",
            padding: "24px 20px",
            textAlign: "left",
            cursor: "pointer",
            transition: "transform 0.15s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>💬</div>
          <div style={{ fontWeight: 800, fontSize: "18px", color: "#1A1A2E", marginBottom: "4px" }}>{t("session.chat")}</div>
          <div style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.5 }}>
            {t("session.chat.desc")}
          </div>
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
