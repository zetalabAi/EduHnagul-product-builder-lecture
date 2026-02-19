"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useLanguage } from "@/hooks/useLanguage";

type Goal = "kdrama" | "kpop" | "travel" | "business" | "food" | "webtoon" | "game" | "friends";
type SpeechStyle = "formal" | "casual";
type Tutor = "jimin" | "minjun";

const GOALS: { id: Goal; emoji: string }[] = [
  { id: "kdrama",   emoji: "🎬" },
  { id: "kpop",     emoji: "🎵" },
  { id: "travel",   emoji: "✈️" },
  { id: "business", emoji: "💼" },
  { id: "food",     emoji: "🍜" },
  { id: "webtoon",  emoji: "📖" },
  { id: "game",     emoji: "🎮" },
  { id: "friends",  emoji: "💬" },
];

const TUTOR_PREVIEW = {
  jimin: {
    formal: "오늘 어떤 드라마 표현을 배워볼까요?",
    casual:  "오늘 뭐 배워볼까? 😊",
  },
  minjun: {
    formal: "오늘 어떤 K-pop 표현을 배워볼까요?",
    casual:  "오늘 뭐 해볼래? 😎",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [name, setName] = useState("");
  const [speechStyle, setSpeechStyle] = useState<SpeechStyle>("formal");
  const [selectedTutor, setSelectedTutor] = useState<Tutor>("jimin");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        if (!name) setName(user.displayName?.split(" ")[0] || "");
      }
    });
    return () => unsub();
  }, []);

  const transition = (next: number) => {
    setFading(true);
    setTimeout(() => { setStep(next); setFading(false); }, 260);
  };

  const toggleGoal = (g: Goal) =>
    setSelectedGoals((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]);

  const handleComplete = async () => {
    if (!uid) { router.push("/auth/signin?redirect=/onboarding"); return; }
    await setDoc(doc(db, "users", uid), {
      name: name || "학습자",
      goals: selectedGoals,
      selectedTutor,
      speechStyle,
      onboardingComplete: true,
      mannerTemp: 36.5,
      streakDays: 0,
      freeSessionsLeft: 3,
      isPremium: false,
      createdAt: serverTimestamp(),
    }, { merge: true });
    router.replace("/home");
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#fff", display: "flex", flexDirection: "column", fontFamily: "Pretendard, sans-serif" }}>
      {/* 진행 바 */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[0,1,2,3].map((i) => (
            <div key={i} style={{ flex: 1, height: "4px", borderRadius: "9999px", background: i <= step ? "#D63000" : "#E5E7EB", transition: "background 0.3s" }} />
          ))}
        </div>
        {step > 0 && (
          <button onClick={() => transition(step - 1)} style={{ marginTop: "12px", color: "#6B7280", fontSize: "14px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {t("common.back")}
          </button>
        )}
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, padding: "24px 20px", opacity: fading ? 0 : 1, transform: fading ? "translateX(16px)" : "translateX(0)", transition: "opacity 0.25s, transform 0.25s", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── STEP 0: 원장님 등장 ── */}
        {step === 0 && <>
          <div style={{ fontSize: "96px", textAlign: "center", animation: "bounceIn 0.6s both" }}>🐯</div>
          <div style={{ background: "#F8F9FA", borderRadius: "16px", padding: "20px", fontSize: "16px", color: "#1A1A2E", lineHeight: 1.7 }}>
            <strong style={{ color: "#D63000" }}>{t("onboarding.intro.greeting")}</strong><br />
            {t("onboarding.intro.desc")}
          </div>
          <p style={{ textAlign: "center", color: "#6B7280", fontSize: "14px", margin: 0 }}>
            {t("onboarding.intro.tagline")}
          </p>
        </>}

        {/* ── STEP 1: 목표 선택 ── */}
        {step === 1 && <>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px" }}>🐯</div>
            <div style={{ background: "#F8F9FA", borderRadius: "16px", padding: "14px 18px", fontSize: "15px", color: "#1A1A2E", marginTop: "10px" }}>
              {t("onboarding.title")}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {GOALS.map((g) => {
              const sel = selectedGoals.includes(g.id);
              return (
                <button key={g.id} onClick={() => toggleGoal(g.id)} style={{ padding: "14px 12px", borderRadius: "16px", border: `2px solid ${sel ? "#D63000" : "#E5E7EB"}`, background: sel ? "#FFF0EB" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "all 0.15s" }}>
                  <span style={{ fontSize: "26px" }}>{g.emoji}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: sel ? "#D63000" : "#1A1A2E", textAlign: "center", lineHeight: 1.3 }}>{t(`goal.${g.id}`)}</span>
                </button>
              );
            })}
          </div>
        </>}

        {/* ── STEP 2: 이름 입력 ── */}
        {step === 2 && <>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px" }}>🐯</div>
            <div style={{ background: "#F8F9FA", borderRadius: "16px", padding: "14px 18px", fontSize: "15px", color: "#1A1A2E", marginTop: "10px", lineHeight: 1.7 }}>
              {t("onboarding.name.prompt")}<br />{t("onboarding.name.sub")}
            </div>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("onboarding.name.placeholder")}
            style={{ width: "100%", background: "#F3F4F6", border: "none", borderRadius: "12px", padding: "16px", fontSize: "16px", color: "#1A1A2E", outline: "none", boxSizing: "border-box" }}
          />
          {name && (
            <div style={{ background: "#FFF0EB", borderRadius: "12px", padding: "14px", fontSize: "15px", color: "#D63000", textAlign: "center" }}>
              {t("onboarding.name.greet").replace("{name}", name)}
            </div>
          )}
        </>}

        {/* ── STEP 3: 말투 + 선생님 선택 ── */}
        {step === 3 && <>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px" }}>🐯</div>
            <div style={{ background: "#F8F9FA", borderRadius: "16px", padding: "14px 18px", fontSize: "15px", color: "#1A1A2E", marginTop: "10px" }}>
              {t("onboarding.style.prompt")}
            </div>
          </div>

          {/* 말투 토글 */}
          <div style={{ display: "flex", gap: "10px" }}>
            {(["formal", "casual"] as SpeechStyle[]).map((s) => (
              <button key={s} onClick={() => setSpeechStyle(s)} style={{ flex: 1, height: "48px", borderRadius: "9999px", border: `2px solid ${speechStyle === s ? "#D63000" : "#E5E7EB"}`, background: speechStyle === s ? "#D63000" : "#fff", color: speechStyle === s ? "#fff" : "#6B7280", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: "all 0.15s" }}>
                {s === "formal" ? t("onboarding.style.formal") : t("onboarding.style.casual")}
              </button>
            ))}
          </div>

          {/* 선생님 선택 */}
          <div style={{ background: "#F8F9FA", borderRadius: "16px", padding: "14px 18px", fontSize: "15px", color: "#1A1A2E", textAlign: "center" }}>
            {t("onboarding.tutor.prompt")}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {([
              { id: "jimin" as Tutor, emoji: "👩", name: "지민", desc: t("onboarding.tutor.jimin.desc"), color: "#EC4899", bg: "#FDF2F8", border: "#EC4899" },
              { id: "minjun" as Tutor, emoji: "👨", name: "민준", desc: t("onboarding.tutor.minjun.desc"), color: "#D63000", bg: "#FFF0EB", border: "#D63000" },
            ]).map((t) => {
              const sel = selectedTutor === t.id;
              return (
                <button key={t.id} onClick={() => setSelectedTutor(t.id)} style={{ flex: 1, borderRadius: "16px", border: `2px solid ${sel ? t.border : "#E5E7EB"}`, background: sel ? t.bg : "#fff", padding: "16px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "all 0.15s" }}>
                  <span style={{ fontSize: "36px" }}>{t.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "#1A1A2E" }}>{t.name}</span>
                  <span style={{ fontSize: "11px", color: "#6B7280", lineHeight: 1.4, textAlign: "center" }}>{t.desc}</span>
                  <div style={{ fontSize: "11px", color: t.color, background: t.bg, borderRadius: "8px", padding: "6px 8px", lineHeight: 1.4, textAlign: "center", marginTop: "2px" }}>
                    "{TUTOR_PREVIEW[t.id][speechStyle]}"
                  </div>
                </button>
              );
            })}
          </div>
        </>}
      </div>

      {/* 하단 버튼 */}
      <div style={{ padding: "0 20px 36px" }}>
        {step < 3 ? (
          <button
            onClick={() => transition(step + 1)}
            disabled={step === 1 && selectedGoals.length === 0}
            style={{ width: "100%", height: "52px", background: (step === 1 && selectedGoals.length === 0) ? "#E5E7EB" : "#D63000", color: (step === 1 && selectedGoals.length === 0) ? "#9CA3AF" : "#fff", border: "none", borderRadius: "9999px", fontWeight: 700, fontSize: "16px", cursor: (step === 1 && selectedGoals.length === 0) ? "not-allowed" : "pointer", transition: "all 0.15s" }}
          >
            {step === 0 ? t("onboarding.start") : t("onboarding.next")}
          </button>
        ) : (
          <button onClick={handleComplete} style={{ width: "100%", height: "52px", background: "linear-gradient(135deg, #D63000, #FF5722)", color: "#fff", border: "none", borderRadius: "9999px", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}>
            {t("onboarding.enroll")}
          </button>
        )}
        {step === 0 && (
          <button onClick={() => router.push("/auth/signin")} style={{ width: "100%", marginTop: "12px", background: "none", border: "none", color: "#9CA3AF", fontSize: "14px", cursor: "pointer", padding: "8px" }}>
            {t("onboarding.already_account")}
          </button>
        )}
      </div>

      <style>{`@keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}
