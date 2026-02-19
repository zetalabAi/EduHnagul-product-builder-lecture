"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase";

type SpeechStyle = "formal" | "casual";
type Tutor = "jimin" | "minjun";
type Message = { role: "user" | "ai"; text: string; id: string };

const TUTOR_INFO = {
  jimin: { name: "지민", emoji: "👩", color: "#EC4899", bg: "#FDF2F8" },
  minjun: { name: "민준", emoji: "👨", color: "#D63000", bg: "#FFF0EB" },
};

function buildSystemPrompt(tutor: Tutor, style: SpeechStyle, userName: string): string {
  const name = userName || "학습자";
  const prompts: Record<Tutor, Record<SpeechStyle, string>> = {
    jimin: {
      formal: `너는 지민이야. K-drama 전문 한국어 선생님으로 ${name}님에게 존댓말을 써줘. '~해볼까요?', '~하시면 돼요', '잘 하셨어요!' 같은 말투를 사용해줘. K-drama 표현을 활용해서 설명해줘. 응답은 간결하게 2-3문장으로 해줘.`,
      casual: `너는 지민이야. ${name}의 친한 친구처럼 반말을 써줘. '~해봐!', '~하면 돼~', '맞아맞아!' 같은 말투를 사용해줘. K-drama 표현을 자주 활용해줘. 응답은 짧고 자연스럽게 해줘.`,
    },
    minjun: {
      formal: `너는 민준이야. K-pop 전문 한국어 선생님으로 ${name}님에게 존댓말을 써줘. '~해볼까요?', '~하시면 됩니다', '잘 하셨어요!' 같은 말투를 사용해줘. K-pop 관련 표현을 활용해줘. 응답은 간결하게 해줘.`,
      casual: `너는 민준이야. ${name}의 편한 오빠/형처럼 반말을 써줘. '~해봐~', '~하면 되지!', '오 잘하는데?' 같은 말투를 사용해줘. K-pop 가사나 유행어도 섞어줘. 응답은 짧고 쿨하게 해줘.`,
    },
  };
  return prompts[tutor][style];
}

const STYLE_CHANGE_PATTERNS = {
  toCasual: ["반말로 얘기해줘", "반말로 해줘", "반말이 더 편해", "반말 해줘"],
  toFormal: ["존댓말로 해줘", "존댓말로 얘기해줘", "존댓말로 바꿔줘"],
};

export default function SessionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tutorParam = (params.get("tutor") ?? "jimin") as Tutor;

  const [uid, setUid] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [tutor, setTutor] = useState<Tutor>(tutorParam);
  const [speechStyle, setSpeechStyle] = useState<SpeechStyle>("formal");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [timer, setTimer] = useState(600); // 10분
  const [wordPeek, setWordPeek] = useState<{ word: string; x: number; y: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth + 유저 설정 로드
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/onboarding"); return; }
      setUid(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      if (data) {
        setUserName(data.name ?? "");
        setSpeechStyle(data.speechStyle ?? "formal");
        setTutor(tutorParam);
      }
    });
    return () => unsub();
  }, [router, tutorParam]);

  // 타이머
  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  // 스크롤 아래로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 오프닝 메시지
  useEffect(() => {
    if (!userName) return;
    const intros: Record<Tutor, Record<SpeechStyle, string>> = {
      jimin: {
        formal: `안녕하세요, ${userName}님! 저는 지민이에요 💕 오늘 어떤 한국어 표현을 배워볼까요?`,
        casual:  `안녕, ${userName}아/야! 나 지민이야 💕 오늘 뭐 배워볼까?`,
      },
      minjun: {
        formal: `안녕하세요, ${userName}님! 저는 민준이에요 😎 오늘 어떤 K-pop 표현을 배워볼까요?`,
        casual:  `야 ${userName}! 나 민준이야 😎 오늘 뭐 해볼래?`,
      },
    };
    setMessages([{ role: "ai", text: intros[tutor][speechStyle], id: "intro" }]);
  }, [userName, tutor, speechStyle]);

  // 말투 전환 감지
  const detectStyleChange = (text: string): SpeechStyle | null => {
    if (STYLE_CHANGE_PATTERNS.toCasual.some((p) => text.includes(p))) return "casual";
    if (STYLE_CHANGE_PATTERNS.toFormal.some((p) => text.includes(p))) return "formal";
    return null;
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isSending || !uid) return;
    const userText = input.trim();
    setInput("");
    setIsSending(true);

    // 말투 전환 체크
    const newStyle = detectStyleChange(userText);
    let currentStyle = speechStyle;
    if (newStyle && newStyle !== speechStyle) {
      setSpeechStyle(newStyle);
      currentStyle = newStyle;
      await updateDoc(doc(db, "users", uid), { speechStyle: newStyle });
    }

    const userMsg: Message = { role: "user", text: userText, id: Date.now().toString() };
    setMessages((p) => [...p, userMsg]);

    try {
      const callTextChat = httpsCallable(functions, "textChat");
      const history = messages.slice(-8).map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      }));

      const res = await callTextChat({
        message: userText,
        systemPrompt: buildSystemPrompt(tutor, currentStyle, userName),
        history,
        userId: uid,
      }) as any;

      const aiText = res.data?.response ?? "잠시 후 다시 시도해주세요.";
      const aiMsg: Message = { role: "ai", text: aiText, id: (Date.now() + 1).toString() };
      setMessages((p) => [...p, aiMsg]);

      // 세션 어휘 자동 수집 (간이)
      await addDoc(collection(db, "sessionVocab", uid, sessionId), {
        userText,
        aiResponse: aiText,
        timestamp: serverTimestamp(),
        tutor,
        speechStyle: currentStyle,
      });

    } catch {
      setMessages((p) => [...p, { role: "ai", text: "네트워크 오류가 발생했어요. 다시 시도해주세요.", id: "err" }]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [input, isSending, uid, speechStyle, messages, tutor, userName, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleWordTap = (word: string, e: React.MouseEvent) => {
    setWordPeek({ word, x: e.clientX, y: e.clientY });
    setTimeout(() => setWordPeek(null), 2500);
  };

  const tutorInfo = TUTOR_INFO[tutor];

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Pretendard, sans-serif" }}>

      {/* 헤더 */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #E5E7EB", background: "#fff" }}>
        <button onClick={() => router.push("/home")} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6B7280" }}>←</button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: tutorInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            {tutorInfo.emoji}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#1A1A2E" }}>{tutorInfo.name}</div>
            <div style={{ fontSize: "11px", color: tutorInfo.color }}>{speechStyle === "formal" ? "존댓말" : "반말"} 모드</div>
          </div>
        </div>
        <div style={{ background: timer < 60 ? "#FEE2E2" : "#FFF0EB", color: timer < 60 ? "#EF4444" : "#D63000", borderRadius: "9999px", padding: "4px 12px", fontSize: "13px", fontWeight: 700 }}>
          ⏱ {formatTimer(timer)}
        </div>
      </header>

      {/* 메시지 목록 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexDirection: m.role === "ai" ? "row" : "row-reverse" }}>
            {m.role === "ai" && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: tutorInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                {tutorInfo.emoji}
              </div>
            )}
            <div
              style={{
                maxWidth: "75%",
                padding: "12px 14px",
                borderRadius: m.role === "ai" ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                background: m.role === "ai" ? "#F3F4F6" : "#D63000",
                color: m.role === "ai" ? "#1A1A2E" : "#fff",
                fontSize: "15px",
                lineHeight: 1.6,
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={(e) => {
                const sel = window.getSelection()?.toString();
                if (sel) handleWordTap(sel, e);
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isSending && (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: tutorInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
              {tutorInfo.emoji}
            </div>
            <div style={{ padding: "12px 16px", background: "#F3F4F6", borderRadius: "4px 18px 18px 18px" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0,1,2].map((i) => (
                  <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9CA3AF", animation: `bounce 1s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Word Peek 팝업 */}
      {wordPeek && (
        <div style={{ position: "fixed", left: wordPeek.x - 80, top: wordPeek.y - 60, background: "#1A1A2E", color: "#fff", padding: "8px 14px", borderRadius: "10px", fontSize: "14px", zIndex: 999, pointerEvents: "none" }}>
          🔍 "{wordPeek.word}"
        </div>
      )}

      {/* 세션 종료 버튼 */}
      <div style={{ padding: "4px 16px 0", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => router.push(`/session/summary?tutor=${tutor}&count=${messages.filter(m=>m.role==="user").length}&sessionId=${sessionId}`)}
          style={{ background: "none", border: "1px solid #E5E7EB", color: "#6B7280", borderRadius: "9999px", padding: "4px 14px", fontSize: "13px", cursor: "pointer" }}
        >
          세션 종료
        </button>
      </div>

      {/* 입력창 */}
      <div style={{ padding: "10px 16px 24px", borderTop: "1px solid #E5E7EB", display: "flex", gap: "10px", alignItems: "flex-end" }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={speechStyle === "formal" ? "메시지를 입력하세요..." : "메시지 써봐~"}
          style={{ flex: 1, background: "#F3F4F6", border: "none", borderRadius: "9999px", padding: "12px 18px", fontSize: "15px", color: "#1A1A2E", outline: "none" }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isSending}
          style={{ width: "44px", height: "44px", borderRadius: "50%", background: input.trim() && !isSending ? "#D63000" : "#E5E7EB", color: "#fff", border: "none", fontSize: "18px", cursor: input.trim() && !isSending ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
        >
          →
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
