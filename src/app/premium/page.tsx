"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Plan = "monthly" | "yearly";

export default function PremiumPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [freeLeft, setFreeLeft] = useState(0);
  const [fromSession, setFromSession] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFromSession(params.get("from") === "session");

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/onboarding"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      setFreeLeft(snap.data()?.freeSessionsLeft ?? 0);
    });
    return () => unsub();
  }, [router]);

  const handleSubscribe = (plan: Plan) => {
    // Stripe checkout 연결 포인트
    router.push(`/pricing?plan=${plan}`);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FA", fontFamily: "Pretendard, sans-serif" }}>
      {/* 상단 */}
      <div style={{ background: "linear-gradient(135deg, #D63000, #FF5722)", padding: "40px 24px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center" }}>
        <div style={{ fontSize: "72px", animation: "bounceIn 0.6s both" }}>🐯</div>
        <div style={{ color: "#fff", fontSize: "24px", fontWeight: 800 }}>학원 정회원이 되어보세요!</div>
        {fromSession || freeLeft === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "10px 16px", color: "#fff", fontSize: "14px" }}>
            무료 체험 3세션을 모두 사용하셨어요 😊<br />
            <strong>계속 공부하려면 정회원이 되어주세요!</strong>
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "10px 16px", color: "#fff", fontSize: "14px" }}>
            무료 세션 <strong>{freeLeft}회</strong> 남았어요!<br />더 많이 공부하고 싶다면?
          </div>
        )}
      </div>

      <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* 플랜 카드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* 연간 플랜 (추천) */}
          <button
            onClick={() => setSelectedPlan("yearly")}
            style={{ width: "100%", background: "#fff", border: `2px solid ${selectedPlan === "yearly" ? "#D63000" : "#E5E7EB"}`, borderRadius: "16px", padding: "18px", textAlign: "left", cursor: "pointer", position: "relative", transition: "all 0.15s" }}
          >
            <div style={{ position: "absolute", top: "-10px", right: "16px", background: "linear-gradient(135deg, #D63000, #FF5722)", color: "#fff", borderRadius: "9999px", padding: "3px 12px", fontSize: "12px", fontWeight: 700 }}>
              ⭐ 추천
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "18px", color: "#1A1A2E" }}>연간 플랜</div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>33% 할인 적용</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#D63000" }}>$79.99</div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>/ 년 ($6.67/월)</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {["무제한 AI 세션", "모든 코스", "플래시카드 무제한"].map((f) => (
                  <span key={f} style={{ fontSize: "12px", color: "#D63000", background: "#FFF0EB", borderRadius: "9999px", padding: "2px 8px" }}>✓ {f}</span>
                ))}
              </div>
            </div>
          </button>

          {/* 월간 플랜 */}
          <button
            onClick={() => setSelectedPlan("monthly")}
            style={{ width: "100%", background: "#fff", border: `2px solid ${selectedPlan === "monthly" ? "#D63000" : "#E5E7EB"}`, borderRadius: "16px", padding: "18px", textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "18px", color: "#1A1A2E" }}>월간 플랜</div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>매달 자동 결제</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#1A1A2E" }}>$9.99</div>
                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>/ 월</div>
              </div>
            </div>
          </button>
        </div>

        {/* 기능 리스트 */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "18px" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#1A1A2E", marginBottom: "12px" }}>정회원 혜택</div>
          {[
            { icon: "🤖", text: "지민 & 민준 무제한 AI 세션" },
            { icon: "📚", text: "K-drama / K-pop 전체 코스" },
            { icon: "🃏", text: "플래시카드 무제한 생성" },
            { icon: "🌡️", text: "학습온도 더 빠르게 올리기" },
            { icon: "🎯", text: "맞춤형 학습 분석 리포트" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
              <span style={{ fontSize: "18px" }}>{f.icon}</span>
              <span style={{ fontSize: "14px", color: "#1A1A2E" }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* 구독 버튼 */}
        <button
          onClick={() => handleSubscribe(selectedPlan)}
          style={{ width: "100%", height: "56px", background: "linear-gradient(135deg, #D63000, #FF5722)", color: "#fff", border: "none", borderRadius: "9999px", fontWeight: 700, fontSize: "17px", cursor: "pointer" }}
        >
          7일 무료 체험 시작하기 →
        </button>

        <div style={{ textAlign: "center", fontSize: "12px", color: "#9CA3AF", lineHeight: 1.6 }}>
          7일 무료 체험 후 자동 결제 • 언제든 취소 가능
        </div>

        <button
          onClick={() => router.push("/home")}
          style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: "14px", cursor: "pointer", padding: "8px", textDecoration: "underline" }}
        >
          나중에 결정할게요
        </button>
      </div>

      <style>{`@keyframes bounceIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
