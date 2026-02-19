"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useLanguage } from "@/hooks/useLanguage";

type UserData = {
  name: string;
  speechStyle: "formal" | "casual";
  selectedTutor: "jimin" | "minjun";
  mannerTemp: number;
  streakDays: number;
  freeSessionsLeft: number;
  isPremium: boolean;
};

const MANNER_STAGES = [
  { min: 0,   max: 29,  label: "Freezing ❄️", emoji: "😭" },
  { min: 30,  max: 79,  label: "Cold 🥶",      emoji: "😤" },
  { min: 80,  max: 99,  label: "Warm ☀️",      emoji: "😊" },
  { min: 100, max: 149, label: "Hot 🔥",        emoji: "😎" },
  { min: 150, max: 200, label: "Blazing 💥",    emoji: "🤩" },
];

const TUTOR_INFO = {
  jimin:  { name: "지민", emoji: "👩", badge: "K-drama 💕" },
  minjun: { name: "민준", emoji: "👨", badge: "K-pop 😎" },
};

const TIGER_QUOTES = [
  "오늘도 포기하지 마세요! 🐯",
  "작은 진전도 진전이에요 🌟",
  "꾸준함이 가장 강한 무기예요 💪",
  "오늘 배운 한 마디가 내일을 바꿔요 ✨",
  "실수해도 괜찮아요, 그게 배움이에요 🐯",
];

const NAV_KEYS = [
  { href: "/home",    icon: "🏠", key: "nav.home" },
  { href: "/courses", icon: "📚", key: "nav.courses" },
  { href: "/review",  icon: "🃏", key: "nav.review" },
  { href: "/friends", icon: "🏆", key: "nav.league" },
  { href: "/settings",icon: "👤", key: "nav.profile" },
];

function getStage(temp: number) {
  return MANNER_STAGES.find((s) => temp >= s.min && temp <= s.max) ?? MANNER_STAGES[0];
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [userData, setUserData]       = useState<UserData | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [uid, setUid]                 = useState<string | null>(null);
  const [quote]                       = useState(() => TIGER_QUOTES[Math.floor(Math.random() * TIGER_QUOTES.length)]);
  const [missionOpen, setMissionOpen] = useState(false);
  const [doneCount]                   = useState(0); // future: track completed missions

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.replace("/onboarding"); return; }
      setUid(user.uid);
      setIsAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) setUserData(snap.data() as UserData);
    });
    return () => unsub();
  }, [uid]);

  if (isAuthLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100dvh", background: "#fff" }}>
        <div style={{ fontSize: "48px", animation: "spin 1s linear infinite" }}>🐯</div>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  const temp         = userData?.mannerTemp ?? 36.5;
  const stage        = getStage(temp);
  const streak       = userData?.streakDays ?? 0;
  const name         = userData?.name ?? t("common.learner");
  const casual       = userData?.speechStyle === "casual";
  const tutor        = userData?.selectedTutor ?? "jimin";
  const free         = userData?.freeSessionsLeft ?? 3;
  const tutorInfo    = TUTOR_INFO[tutor];

  const greet        = casual
    ? t("home.greet.casual").replace("{name}", name)
    : t("home.greet.formal").replace("{name}", name);
  const nextStageMin = MANNER_STAGES.find((s) => s.min > temp)?.min ?? 200;
  const fillPct      = Math.min((temp / 200) * 100, 100);

  const MISSIONS = [
    { emoji: "🎙️", label: t("home.mission.session"),   reward: "+35°", href: `/session?tutor=${tutor}` },
    { emoji: "🃏", label: t("home.mission.flashcard"),  reward: "+12°", href: "/review" },
    { emoji: "🎯", label: t("home.mission.voice"),      reward: "+20°", href: `/session/voice?tutor=${tutor}` },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FA", fontFamily: "Pretendard, sans-serif", paddingBottom: "80px" }}>

      {/* ── 헤더 ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "14px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>🐯</span>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A2E" }}>{greet}</div>
              {streak > 0 && (
                <div style={{ fontSize: "11px", color: "#F59E0B", fontWeight: 600 }}>{t("home.streak.active").replace("{n}", String(streak))}</div>
              )}
            </div>
          </div>
          {/* 나의 튜터 뱃지 */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFF0EB", borderRadius: "9999px", padding: "6px 12px", fontSize: "13px", fontWeight: 600, color: "#D63000" }}>
            <span>{tutorInfo.emoji}</span>
            <span>{tutorInfo.name}</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "16px 16px 24px" }}>

        {/* 1. 학습온도 카드 */}
        <div
          className="animate-fade-in"
          style={{ background: "linear-gradient(135deg, #D63000, #FF5722)", borderRadius: "20px", padding: "20px", color: "#fff", marginBottom: "14px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "13px", opacity: 0.85, marginBottom: "4px" }}>{t("home.temp.label")}</div>
              <div style={{ fontSize: "40px", fontWeight: 800, lineHeight: 1 }}>{temp.toFixed(1)}°</div>
              <div style={{ fontSize: "14px", opacity: 0.9, marginTop: "4px" }}>{stage.label}</div>
            </div>
            <div style={{ fontSize: "56px", lineHeight: 1 }}>{stage.emoji}</div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "9999px", height: "8px", overflow: "hidden" }}>
              <div style={{ width: `${fillPct}%`, height: "100%", background: "#fff", borderRadius: "9999px", transition: "width 1s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "12px", opacity: 0.8 }}>
              <span>{temp.toFixed(1)}°</span>
              <span>{t("home.temp.next").replace("{n}", (nextStageMin - temp).toFixed(1))}</span>
              <span>200°</span>
            </div>
          </div>
        </div>

        {/* 2. AI 세션 시작 버튼 (크게) */}
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px", animationDelay: "0.06s" }}>
          <Link href={`/session?tutor=${tutor}`} style={{ textDecoration: "none" }}>
            <button
              style={{
                width: "100%",
                height: "64px",
                background: "linear-gradient(135deg, #D63000, #FF5722)",
                color: "#fff",
                border: "none",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 4px 16px rgba(214,48,0,0.35)",
              }}
            >
              <span style={{ fontSize: "20px" }}>{tutorInfo.emoji}</span>
              <span>{t("home.cta.voice")}</span>
              <span style={{ fontSize: "14px", opacity: 0.85, background: "rgba(255,255,255,0.2)", borderRadius: "9999px", padding: "2px 10px" }}>+35°</span>
            </button>
          </Link>

          <Link href="/courses" style={{ textDecoration: "none" }}>
            <button
              style={{
                width: "100%",
                height: "58px",
                background: "#fff",
                color: "#D63000",
                border: "2px solid #D63000",
                borderRadius: "9999px",
                fontWeight: 600,
                fontSize: "17px",
                cursor: "pointer",
              }}
            >
              📚 {t("home.cta.roleplay")}
            </button>
          </Link>
        </div>

        {/* 3. 오늘의 미션 아코디언 */}
        <div className="animate-fade-in" style={{ marginBottom: "14px", animationDelay: "0.1s" }}>
          {/* 아코디언 헤더 */}
          <button
            onClick={() => setMissionOpen((p) => !p)}
            style={{
              width: "100%",
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: missionOpen ? "16px 16px 0 0" : "16px",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "border-radius 0.3s",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1A1A2E" }}>⚡ {t("home.mission")}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{t("home.mission.done").replace("{done}", String(doneCount))}</span>
              <span
                style={{
                  display: "inline-block",
                  color: "#6B7280",
                  fontSize: "14px",
                  transform: missionOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                ∨
              </span>
            </div>
          </button>

          {/* 아코디언 내용 */}
          <div
            style={{
              maxHeight: missionOpen ? "300px" : "0",
              overflow: "hidden",
              transition: "max-height 0.3s ease-in-out",
              background: "#fff",
              border: missionOpen ? "1px solid #E5E7EB" : "none",
              borderTop: "none",
              borderRadius: "0 0 16px 16px",
            }}
          >
            {MISSIONS.map((m, i) => (
              <Link href={m.href} key={i} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderTop: "1px solid #F3F4F6",
                    transition: "background 0.1s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: "2px solid #E5E7EB", flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", color: "#1A1A2E" }}>{m.emoji} {m.label}</span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#D63000", background: "#FFF0EB", padding: "3px 10px", borderRadius: "9999px", whiteSpace: "nowrap" }}>
                    {m.reward}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 4. 원장님 한마디 */}
        <div className="animate-fade-in" style={{ background: "#FFF7ED", borderRadius: "16px", padding: "16px", border: "1px solid #FED7AA", display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", animationDelay: "0.15s" }}>
          <span style={{ fontSize: "32px" }}>🐯</span>
          <div style={{ fontSize: "14px", color: "#92400E", lineHeight: 1.5 }}>{quote}</div>
        </div>

        {/* 5. 연속 스트릭 */}
        {streak > 0 && (
          <div className="animate-fade-in" style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", animationDelay: "0.2s" }}>
            <span style={{ fontSize: "26px" }}>🔥</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A1A2E" }}>{t("home.streak.active").replace("{n}", String(streak))}</div>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>{t("home.streak.reminder")}</div>
            </div>
          </div>
        )}

        {/* 6. 무료 세션 카운터 */}
        {!userData?.isPremium && (
          <div className="animate-fade-in" style={{ background: "#FFF0EB", borderRadius: "16px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", animationDelay: "0.25s" }}>
            <div style={{ fontSize: "14px", color: "#D63000" }}>
              🎁 <strong>{free}</strong> {t("home.free_sessions")}
            </div>
            <Link href="/premium" style={{ textDecoration: "none", background: "#D63000", color: "#fff", borderRadius: "9999px", padding: "6px 14px", fontSize: "13px", fontWeight: 600 }}>
              {t("common.upgrade")}
            </Link>
          </div>
        )}
      </main>

      {/* 하단 탭 바 */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #E5E7EB", display: "flex", height: "64px", zIndex: 100 }}>
        {NAV_KEYS.map((n) => {
          const active = typeof window !== "undefined" && window.location.pathname === n.href;
          return (
            <Link key={n.href} href={n.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", textDecoration: "none" }}>
              <span style={{ fontSize: "22px" }}>{n.icon}</span>
              <span style={{ fontSize: "10px", fontWeight: 600, color: active ? "#D63000" : "#9CA3AF" }}>{t(n.key)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
