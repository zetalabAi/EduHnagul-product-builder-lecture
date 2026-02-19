"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, updateDoc, increment,
  collection, getDocs, addDoc, serverTimestamp
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Tutor = "jimin" | "minjun";
type SpeechStyle = "formal" | "casual";

const TUTOR_OUTRO: Record<Tutor, Record<SpeechStyle, string>> = {
  jimin: {
    formal: "오늘도 정말 잘 하셨어요! 내일도 기다릴게요 💕",
    casual: "오늘도 잘했어! 내일도 와줘~ 💕",
  },
  minjun: {
    formal: "오늘 정말 잘 하셨어요! 내일 또 봬요 😎",
    casual: "오 진짜 잘하는데? 내일도 보자~",
  },
};

const TUTOR_INFO = {
  jimin: { name: "지민", emoji: "👩" },
  minjun: { name: "민준", emoji: "👨" },
};

const XP_GAINED = 35; // 학습온도 +35°

export default function SessionSummaryPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tutor = (params.get("tutor") ?? "jimin") as Tutor;
  const messageCount = Number(params.get("count") ?? 0);
  const sessionId = params.get("sessionId") ?? "";

  const [uid, setUid] = useState<string | null>(null);
  const [speechStyle, setSpeechStyle] = useState<SpeechStyle>("formal");
  const [mannerTemp, setMannerTemp] = useState(36.5);
  const [vocabList, setVocabList] = useState<{ word: string; meaning: string }[]>([]);
  const [saved, setSaved] = useState(false);
  const [tempFill, setTempFill] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/onboarding"); return; }
      setUid(user.uid);

      // 유저 데이터 로드
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      if (data) {
        setSpeechStyle(data.speechStyle ?? "formal");
        const newTemp = Math.min((data.mannerTemp ?? 36.5) + XP_GAINED, 200);
        setMannerTemp(newTemp);

        // 학습온도 업데이트
        await updateDoc(doc(db, "users", user.uid), {
          mannerTemp: newTemp,
          totalSessions: increment(1),
          freeSessionsLeft: increment(-1),
        });
      }

      // 세션 어휘 → 플래시카드 저장
      if (sessionId) {
        try {
          const vocabSnap = await getDocs(collection(db, "sessionVocab", user.uid, sessionId));
          const items = vocabSnap.docs.map((d) => d.data());

          // 간이 어휘 추출 (실제로는 AI 파싱)
          const mockVocab = [
            { word: "배우다", meaning: "to learn", example: "한국어를 배우고 싶어요." },
            { word: "연습하다", meaning: "to practice", example: "매일 연습하면 늘어요." },
          ];

          for (const v of mockVocab) {
            await addDoc(collection(db, "flashcards", user.uid, "cards"), {
              ...v, nextReview: new Date(), interval: 1, createdAt: serverTimestamp(),
            });
          }
          setVocabList(mockVocab);
          setSaved(true);
        } catch { setSaved(true); }
      }
    });
    return () => unsub();
  }, [router, sessionId]);

  // 온도계 채우기 애니메이션
  useEffect(() => {
    const t = setTimeout(() => setTempFill(Math.min((mannerTemp / 200) * 100, 100)), 500);
    return () => clearTimeout(t);
  }, [mannerTemp]);

  const tutorInfo = TUTOR_INFO[tutor];
  const outro = TUTOR_OUTRO[tutor][speechStyle];
  const sessionMin = Math.ceil(messageCount * 0.5); // 대화 수 기반 시간 추정

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FA", fontFamily: "Pretendard, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* 결과 카드 */}
      <div style={{ background: "linear-gradient(135deg, #D63000, #FF5722)", padding: "40px 24px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <div style={{ fontSize: "56px", animation: "bounceIn 0.6s both" }}>🎉</div>
        <div style={{ color: "#fff", fontSize: "26px", fontWeight: 800 }}>세션 완료!</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "9999px", padding: "8px 16px" }}>
          <span style={{ fontSize: "22px" }}>{tutorInfo.emoji}</span>
          <span style={{ color: "#fff", fontSize: "14px", lineHeight: 1.5 }}>{outro}</span>
        </div>

        {/* 통계 3개 */}
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          {[
            { icon: "⏱️", label: "학습 시간", value: `${sessionMin}분` },
            { icon: "💬", label: "대화 횟수", value: `${messageCount}회` },
            { icon: "📚", label: "새 단어",   value: `${vocabList.length}개` },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: "14px", padding: "12px 16px", textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "22px" }}>{s.icon}</div>
              <div style={{ color: "#fff", fontSize: "18px", fontWeight: 800, marginTop: "2px" }}>{s.value}</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "11px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: "20px 16px 32px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* 학습온도 획득 */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#1A1A2E" }}>🌡️ 학습온도</div>
            <div style={{ background: "#FFF0EB", color: "#D63000", borderRadius: "9999px", padding: "4px 12px", fontSize: "14px", fontWeight: 700 }}>
              +{XP_GAINED}° 획득!
            </div>
          </div>
          <div style={{ background: "#F3F4F6", borderRadius: "9999px", height: "10px", overflow: "hidden" }}>
            <div style={{ width: `${tempFill}%`, height: "100%", background: "linear-gradient(90deg, #D63000, #FF5722)", borderRadius: "9999px", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
          </div>
          <div style={{ textAlign: "right", marginTop: "6px", fontSize: "13px", color: "#6B7280" }}>
            현재 {mannerTemp.toFixed(1)}° / 200°
          </div>
        </div>

        {/* 오늘 배운 단어 */}
        {vocabList.length > 0 && (
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontWeight: 700, fontSize: "16px", color: "#1A1A2E" }}>📚 오늘 배운 단어</div>
              {saved && (
                <div style={{ background: "#D1FAE5", color: "#065F46", borderRadius: "9999px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>
                  플래시카드 저장됨 ✅
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {vocabList.map((v, i) => (
                <div key={i} style={{ background: "#F8F9FA", borderRadius: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "16px", color: "#1A1A2E" }}>{v.word}</span>
                    <span style={{ color: "#6B7280", fontSize: "13px", marginLeft: "10px" }}>{v.meaning}</span>
                  </div>
                  <span style={{ fontSize: "18px" }}>🔊</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
          <Link href="/review" style={{ textDecoration: "none" }}>
            <button style={{ width: "100%", height: "52px", background: "linear-gradient(135deg, #D63000, #FF5722)", color: "#fff", border: "none", borderRadius: "9999px", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}>
              🃏 지금 복습하기
            </button>
          </Link>
          <Link href="/home" style={{ textDecoration: "none" }}>
            <button style={{ width: "100%", height: "52px", background: "#fff", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: "9999px", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
              홈으로
            </button>
          </Link>
        </div>
      </div>

      <style>{`@keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}
