"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";

type SpeechStyle = "formal" | "casual";
type Tutor = "jimin" | "minjun";

const NAV = [
  { href: "/home",    icon: "🏠", label: "홈" },
  { href: "/courses", icon: "📚", label: "코스" },
  { href: "/review",  icon: "🃏", label: "복습" },
  { href: "/friends", icon: "🏆", label: "리그" },
  { href: "/settings",icon: "👤", label: "프로필" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [speechStyle, setSpeechStyleState] = useState<SpeechStyle>("formal");
  const [tutor, setTutorState] = useState<Tutor>("jimin");
  const [isPremium, setIsPremium] = useState(false);
  const [mannerTemp, setMannerTemp] = useState(36.5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/onboarding"); return; }
      setUid(user.uid);
      setEmail(user.email ?? "");
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      if (data) {
        setName(data.name ?? "");
        setSpeechStyleState(data.speechStyle ?? "formal");
        setTutorState(data.selectedTutor ?? "jimin");
        setIsPremium(data.isPremium ?? false);
        setMannerTemp(data.mannerTemp ?? 36.5);
      }
    });
    return () => unsub();
  }, [router]);

  const updateField = async (field: string, value: any) => {
    if (!uid) return;
    setSaving(true);
    await updateDoc(doc(db, "users", uid), { [field]: value });
    setSaving(false);
    toast.success("저장됐어요!");
  };

  const setSpeechStyle = async (s: SpeechStyle) => {
    setSpeechStyleState(s);
    await updateField("speechStyle", s);
  };

  const setTutor = async (t: Tutor) => {
    setTutorState(t);
    await updateField("selectedTutor", t);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/onboarding");
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FA", fontFamily: "Pretendard, sans-serif", paddingBottom: "80px" }}>
      {/* 헤더 */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "16px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ fontWeight: 800, fontSize: "20px", color: "#1A1A2E" }}>👤 프로필 & 설정</div>
      </header>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* 프로필 카드 */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #D63000, #FF5722)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
            🐯
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "18px", color: "#1A1A2E" }}>{name || "학습자"}</div>
            <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>{email}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
              <div style={{ background: "#FFF0EB", color: "#D63000", borderRadius: "9999px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>
                🌡️ {mannerTemp.toFixed(1)}° 학습온도
              </div>
              {isPremium && (
                <div style={{ background: "linear-gradient(135deg, #F59E0B, #EF4444)", color: "#fff", borderRadius: "9999px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>
                  ⭐ 프리미엄
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 학습 설정 */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6", fontWeight: 700, fontSize: "14px", color: "#6B7280" }}>
            학습 설정
          </div>

          {/* 말투 설정 ← 핵심 */}
          <div style={{ padding: "18px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#1A1A2E", marginBottom: "4px" }}>말투 설정</div>
            <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "14px" }}>
              현재: <strong style={{ color: "#D63000" }}>{speechStyle === "formal" ? "존댓말로 대화 중이에요" : "반말로 대화 중이에요"}</strong>
            </div>
            {/* 슬라이드 토글 */}
            <div style={{ background: "#F3F4F6", borderRadius: "12px", padding: "4px", display: "flex" }}>
              <button
                onClick={() => setSpeechStyle("formal")}
                style={{ flex: 1, height: "40px", border: "none", borderRadius: "9px", background: speechStyle === "formal" ? "#fff" : "transparent", color: speechStyle === "formal" ? "#D63000" : "#6B7280", fontWeight: speechStyle === "formal" ? 700 : 500, fontSize: "14px", cursor: "pointer", boxShadow: speechStyle === "formal" ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}
              >
                존댓말
              </button>
              <button
                onClick={() => setSpeechStyle("casual")}
                style={{ flex: 1, height: "40px", border: "none", borderRadius: "9px", background: speechStyle === "casual" ? "#fff" : "transparent", color: speechStyle === "casual" ? "#D63000" : "#6B7280", fontWeight: speechStyle === "casual" ? 700 : 500, fontSize: "14px", cursor: "pointer", boxShadow: speechStyle === "casual" ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}
              >
                반말
              </button>
            </div>
            <div style={{ marginTop: "10px", background: "#FFF0EB", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#D63000" }}>
              {speechStyle === "formal"
                ? "💬 다음 세션부터 존댓말로 대화해요"
                : "💬 다음 세션부터 반말로 대화해요"}
            </div>
          </div>

          {/* 선생님 변경 */}
          <div style={{ padding: "18px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#1A1A2E", marginBottom: "12px" }}>선생님 변경</div>
            <div style={{ display: "flex", gap: "10px" }}>
              {([
                { id: "jimin" as Tutor, emoji: "👩", name: "지민", desc: "K-drama 전문", color: "#EC4899" },
                { id: "minjun" as Tutor, emoji: "👨", name: "민준", desc: "K-pop 전문", color: "#D63000" },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTutor(t.id)}
                  style={{ flex: 1, border: `2px solid ${tutor === t.id ? t.color : "#E5E7EB"}`, borderRadius: "14px", padding: "14px 10px", background: tutor === t.id ? `${t.color}10` : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", transition: "all 0.15s" }}
                >
                  <span style={{ fontSize: "28px" }}>{t.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "#1A1A2E" }}>{t.name}</span>
                  <span style={{ fontSize: "11px", color: "#6B7280" }}>{t.desc}</span>
                  {tutor === t.id && <span style={{ fontSize: "10px", color: t.color, fontWeight: 700 }}>현재 선택</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 언어 설정 */}
          <div style={{ padding: "18px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#1A1A2E", marginBottom: "4px" }}>앱 언어</div>
            <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>
              현재: <strong style={{ color: "#D63000" }}>{typeof window !== "undefined" ? (localStorage.getItem("appLanguage")?.toUpperCase() ?? "EN") : "EN"}</strong>
            </div>
            <button
              onClick={() => router.push("/language-select")}
              style={{ width: "100%", height: "44px", border: "1px solid #E5E7EB", borderRadius: "12px", background: "#F8F9FA", color: "#1A1A2E", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}
            >
              <span>🌐 언어 변경</span>
              <span style={{ color: "#9CA3AF" }}>→</span>
            </button>
          </div>

          {/* 알림 설정 */}
          <div style={{ padding: "18px" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#1A1A2E", marginBottom: "12px" }}>알림 설정</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#1A1A2E" }}>매일 학습 리마인더</div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>오전 9시</div>
              </div>
              <div style={{ width: "44px", height: "24px", borderRadius: "9999px", background: "#D63000", position: "relative", cursor: "pointer" }}>
                <div style={{ position: "absolute", right: "2px", top: "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff" }} />
              </div>
            </div>
          </div>
        </div>

        {/* 계정 */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6", fontWeight: 700, fontSize: "14px", color: "#6B7280" }}>
            계정
          </div>
          {!isPremium && (
            <button
              onClick={() => router.push("/premium")}
              style={{ width: "100%", padding: "16px 18px", background: "linear-gradient(135deg, #D63000, #FF5722)", color: "#fff", border: "none", textAlign: "left", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
            >
              ⭐ 프리미엄 업그레이드
              <span style={{ marginLeft: "auto", opacity: 0.8, fontSize: "13px" }}>→</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{ width: "100%", padding: "16px 18px", background: "#fff", color: "#EF4444", border: "none", borderTop: "1px solid #F3F4F6", textAlign: "left", fontSize: "15px", cursor: "pointer", fontWeight: 600 }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 하단 탭 */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #E5E7EB", display: "flex", height: "64px", zIndex: 100 }}>
        {NAV.map((n) => (
          <a key={n.href} href={n.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", textDecoration: "none" }}>
            <span style={{ fontSize: "22px" }}>{n.icon}</span>
            <span style={{ fontSize: "10px", fontWeight: 600, color: n.href === "/settings" ? "#D63000" : "#9CA3AF" }}>{n.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
