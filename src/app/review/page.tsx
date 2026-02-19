"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type SpeechStyle = "formal" | "casual";
type Rating = "again" | "hard" | "good" | "easy";

const INTERVAL_MAP: Record<Rating, number> = {
  again: 1, hard: 3, good: 7, easy: 14,
};

const RATING_CONFIG: { id: Rating; label: string; color: string; bg: string }[] = [
  { id: "again", label: "다시",   color: "#EF4444", bg: "#FEE2E2" },
  { id: "hard",  label: "어려움", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "good",  label: "알겠음", color: "#10B981", bg: "#D1FAE5" },
  { id: "easy",  label: "쉬움",   color: "#3B82F6", bg: "#DBEAFE" },
];

const TIGER_CHEERS: Record<SpeechStyle, string> = {
  formal: "복습까지 완료하셨어요! 정말 대단해요 🐯",
  casual: "복습까지 했어? 완전 대단한데! 🐯",
};

type FlashCard = {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  interval: number;
  nextReview: any;
};

export default function ReviewPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [speechStyle, setSpeechStyle] = useState<SpeechStyle>("formal");
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rated, setRated] = useState<Rating[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/onboarding"); return; }
      setUid(user.uid);

      // 병렬로 유저 정보 + 카드 동시 로드
      const today = new Date();
      const [snap, allCards] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getDocs(collection(db, "flashcards", user.uid, "cards")).catch(() => null),
      ]);
      setSpeechStyle(snap.data()?.speechStyle ?? "formal");
      const due = (allCards?.docs ?? [])
        .map((d) => ({ id: d.id, ...(d.data() as Omit<FlashCard, "id">) }))
        .filter((c) => {
          if (!c.nextReview) return true;
          const next = c.nextReview.toDate ? c.nextReview.toDate() : new Date(c.nextReview);
          return next <= today;
        })
        .slice(0, 20); // 최대 20개

      // 카드가 없으면 샘플 추가
      if (due.length === 0) {
        setCards([
          { id: "s1", word: "배우다",    meaning: "to learn",    example: "한국어를 배우고 싶어요.", interval: 1, nextReview: null },
          { id: "s2", word: "연습하다",  meaning: "to practice", example: "매일 연습하면 늘어요.",  interval: 1, nextReview: null },
          { id: "s3", word: "재미있다",  meaning: "interesting", example: "한국어는 재미있어요.",   interval: 1, nextReview: null },
        ]);
      } else {
        setCards(due);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const current = cards[currentIdx];

  const handleRate = async (rating: Rating) => {
    if (!uid || !current) return;
    setRated((p) => [...p, rating]);

    // FSRS 간이 업데이트
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + INTERVAL_MAP[rating]);
    try {
      await updateDoc(doc(db, "flashcards", uid, "cards", current.id), {
        interval: INTERVAL_MAP[rating],
        nextReview: nextDate,
        lastRating: rating,
      });
    } catch { /* 샘플 카드는 업데이트 안 해도 됨 */ }

    setFlipped(false);
    if (currentIdx + 1 >= cards.length) {
      // 복습 완료 → 학습온도 +12°
      try {
        await updateDoc(doc(db, "users", uid), { mannerTemp: increment(12) });
      } catch {}
      setDone(true);
    } else {
      setTimeout(() => setCurrentIdx((p) => p + 1), 200);
    }
  };

  if (loading) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", fontFamily: "Pretendard, sans-serif" }}>
        <div style={{ fontSize: "48px", animation: "spin 1s linear infinite" }}>🐯</div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ minHeight: "100dvh", background: "#fff", fontFamily: "Pretendard, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "72px", animation: "bounceIn 0.6s both" }}>🎉</div>
        <div style={{ fontSize: "24px", fontWeight: 800, color: "#1A1A2E" }}>오늘 복습 완료!</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFF0EB", borderRadius: "9999px", padding: "8px 20px" }}>
          <span style={{ fontSize: "18px" }}>🌡️</span>
          <span style={{ color: "#D63000", fontWeight: 700 }}>+12° 획득!</span>
        </div>
        <div style={{ background: "#F8F9FA", borderRadius: "16px", padding: "16px 20px", display: "flex", gap: "10px", alignItems: "center", maxWidth: "360px" }}>
          <span style={{ fontSize: "32px" }}>🐯</span>
          <span style={{ fontSize: "14px", color: "#1A1A2E", lineHeight: 1.6 }}>{TIGER_CHEERS[speechStyle]}</span>
        </div>
        <div style={{ display: "flex", gap: "10px", flexDirection: "column", width: "100%", maxWidth: "320px" }}>
          <button onClick={() => router.push("/session")} style={{ height: "52px", background: "#D63000", color: "#fff", border: "none", borderRadius: "9999px", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}>
            또 배우러 가기
          </button>
          <button onClick={() => router.push("/home")} style={{ height: "52px", background: "#fff", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: "9999px", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
            홈으로
          </button>
        </div>
        <style>{`@keyframes bounceIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FA", fontFamily: "Pretendard, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => router.push("/home")} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6B7280" }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#1A1A2E" }}>오늘 복습할 카드: {cards.length}개</div>
          <div style={{ background: "#E5E7EB", borderRadius: "9999px", height: "4px", marginTop: "6px", overflow: "hidden" }}>
            <div style={{ width: `${((currentIdx) / cards.length) * 100}%`, height: "100%", background: "#D63000", transition: "width 0.4s" }} />
          </div>
        </div>
        <div style={{ fontSize: "13px", color: "#6B7280", fontWeight: 600 }}>{currentIdx + 1} / {cards.length}</div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        {current && (
          <>
            {/* 플래시카드 3D 플립 */}
            <div
              style={{ width: "100%", maxWidth: "380px", height: "260px", cursor: "pointer", perspective: "1000px" }}
              onClick={() => setFlipped((f) => !f)}
            >
              <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.4s", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                {/* 앞면 */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "#fff", borderRadius: "20px", border: "1px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <div style={{ fontSize: "36px", fontWeight: 800, color: "#1A1A2E" }}>{current.word}</div>
                  <button style={{ display: "flex", alignItems: "center", gap: "4px", background: "#FFF0EB", border: "none", borderRadius: "9999px", padding: "8px 16px", color: "#D63000", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                    🔊 발음 듣기
                  </button>
                  <div style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>탭해서 뒤집기</div>
                </div>
                {/* 뒷면 */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, #FFF0EB, #F5F3FF)", borderRadius: "20px", border: "1px solid #FFCCBC", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "24px" }}>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "#D63000" }}>{current.meaning}</div>
                  {current.example && (
                    <div style={{ fontSize: "14px", color: "#6B7280", textAlign: "center", lineHeight: 1.6, background: "rgba(255,255,255,0.6)", borderRadius: "12px", padding: "10px 14px" }}>
                      "{current.example}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 자기평가 버튼 (뒷면에서만) */}
            {flipped && (
              <div style={{ display: "flex", gap: "8px", marginTop: "24px", width: "100%", maxWidth: "380px", animation: "fadeIn 0.2s" }}>
                {RATING_CONFIG.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRate(r.id)}
                    style={{ flex: 1, height: "48px", background: r.bg, color: r.color, border: `1px solid ${r.color}30`, borderRadius: "12px", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "transform 0.1s" }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                    onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
            {!flipped && (
              <div style={{ marginTop: "20px", fontSize: "13px", color: "#9CA3AF" }}>
                카드를 탭해서 뜻을 확인하세요
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
