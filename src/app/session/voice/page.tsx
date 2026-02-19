"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "@/lib/firebase";
import { useLanguage } from "@/hooks/useLanguage";

type SpeechStyle = "formal" | "casual";
type Tutor = "jimin" | "minjun";
type VoiceState = "idle" | "ai_speaking" | "user_speaking" | "thinking" | "loading";

interface ConvCard {
  korean: string;
  id: string;
}

const TUTOR_INFO = {
  jimin:  { name: "지민", emoji: "👩", color: "#EC4899", bg: "#FDF2F8" },
  minjun: { name: "민준", emoji: "👨", color: "#D63000", bg: "#FFF0EB" },
};

// 이중언어 인트로: 모국어 인사 + 한국어 표현
const BILINGUAL_INTROS: Record<string, Record<Tutor, string>> = {
  en: {
    jimin:  "Hi! I'm Jimin 💕 Let's learn Korean together today! First, let's say hello:\n안녕하세요! (an-nyeong-ha-se-yo)\nThis means 'Hello' in polite Korean — try saying it!",
    minjun: "Hey! I'm Minjun 😎 Ready to learn some cool Korean? Start with:\n안녕하세요! (an-nyeong-ha-se-yo)\nThat's 'Hello' — you've got this!",
  },
  ja: {
    jimin:  "こんにちは！지민です 💕 一緒に韓国語を学びましょう！まずは挨拶から：\n안녕하세요！(an-nyeong-ha-se-yo)\n「こんにちは」という意味です！",
    minjun: "やあ！민준だよ 😎 韓国語を楽しく学ぼう！最初はここから：\n안녕하세요！(an-nyeong-ha-se-yo)\n「こんにちは」だよ！",
  },
  zh: {
    jimin:  "你好！我是지민 💕 今天一起学韩语吧！首先学打招呼：\n안녕하세요！(an-nyeong-ha-se-yo)\n这是「你好」的意思！",
    minjun: "嘿！我是민준 😎 一起学酷炫的韩语吧！先从这开始：\n안녕하세요！(an-nyeong-ha-se-yo)\n意思是「你好」！",
  },
  es: {
    jimin:  "¡Hola! Soy Jimin 💕 ¡Aprendamos coreano juntos! Primero, el saludo:\n안녕하세요! (an-nyeong-ha-se-yo)\n¡Significa 'Hola' en coreano formal!",
    minjun: "¡Hola! Soy Minjun 😎 ¡Vamos a aprender coreano! Empieza con:\n안녕하세요! (an-nyeong-ha-se-yo)\n¡Eso es 'Hola'!",
  },
  fr: {
    jimin:  "Bonjour! Je suis Jimin 💕 Apprenons le coréen ensemble! D'abord la salutation:\n안녕하세요! (an-nyeong-ha-se-yo)\nÇa veut dire 'Bonjour' en coréen poli!",
    minjun: "Salut! Je suis Minjun 😎 On apprend le coréen? Commençons:\n안녕하세요! (an-nyeong-ha-se-yo)\nC'est 'Bonjour'!",
  },
  de: {
    jimin:  "Hallo! Ich bin Jimin 💕 Lass uns zusammen Koreanisch lernen! Zuerst die Begrüßung:\n안녕하세요! (an-nyeong-ha-se-yo)\nDas bedeutet 'Hallo' auf Koreanisch!",
    minjun: "Hey! Ich bin Minjun 😎 Bereit für Koreanisch? Fangen wir an:\n안녕하세요! (an-nyeong-ha-se-yo)\nDas ist 'Hallo'!",
  },
  pt: {
    jimin:  "Olá! Eu sou a Jimin 💕 Vamos aprender coreano juntos! Primeiro, o cumprimento:\n안녕하세요! (an-nyeong-ha-se-yo)\nIsso significa 'Olá' em coreano educado!",
    minjun: "Oi! Sou o Minjun 😎 Pronto para aprender coreano? Começa aqui:\n안녕하세요! (an-nyeong-ha-se-yo)\nSignifica 'Olá'!",
  },
  th: {
    jimin:  "สวัสดี! ฉันชื่อจีมิน 💕 มาเรียนภาษาเกาหลีด้วยกันนะ! เริ่มจากการทักทาย:\n안녕하세요! (an-nyeong-ha-se-yo)\nหมายความว่า 'สวัสดี' ในภาษาเกาหลีแบบสุภาพ!",
    minjun: "เฮ้! ฉันมินจุน 😎 พร้อมเรียนเกาหลียัง? เริ่มเลย:\n안녕하세요! (an-nyeong-ha-se-yo)\nแปลว่า 'สวัสดี'!",
  },
  vi: {
    jimin:  "Xin chào! Mình là Jimin 💕 Cùng học tiếng Hàn nào! Đầu tiên, học cách chào hỏi:\n안녕하세요! (an-nyeong-ha-se-yo)\nNghĩa là 'Xin chào' theo kiểu lịch sự!",
    minjun: "Hey! Mình là Minjun 😎 Sẵn sàng học tiếng Hàn chưa? Bắt đầu thôi:\n안녕하세요! (an-nyeong-ha-se-yo)\nNghĩa là 'Xin chào'!",
  },
  id: {
    jimin:  "Halo! Aku Jimin 💕 Yuk belajar bahasa Korea bersama! Pertama, salam:\n안녕하세요! (an-nyeong-ha-se-yo)\nArtinya 'Halo' dalam bahasa Korea sopan!",
    minjun: "Hey! Aku Minjun 😎 Siap belajar Korea? Mulai dari sini:\n안녕하세요! (an-nyeong-ha-se-yo)\nArtinya 'Halo'!",
  },
  ar: {
    jimin:  "مرحبا! أنا جيمين 💕 لنتعلم الكورية معاً! أولاً، التحية:\n안녕하세요! (an-nyeong-ha-se-yo)\nتعني 'مرحبا' بالكورية الرسمية!",
    minjun: "هيي! أنا مينجون 😎 مستعد لتعلم الكورية؟ ابدأ من هنا:\n안녕하세요! (an-nyeong-ha-se-yo)\nتعني 'مرحبا'!",
  },
  ru: {
    jimin:  "Привет! Я Джимин 💕 Давай вместе учить корейский! Сначала приветствие:\n안녕하세요! (an-nyeong-ha-se-yo)\nЭто означает 'Здравствуйте' по-корейски!",
    minjun: "Эй! Я Минджун 😎 Готов учить корейский? Начнём:\n안녕하세요! (an-nyeong-ha-se-yo)\nЗначит 'Привет'!",
  },
};

// AI 응답에서 한국어 부분만 추출 (TTS용)
function extractKoreanForTTS(text: string): string {
  // 한글 문장/구 추출 (완성형 + 자모)
  const matches = text.match(/[\uAC00-\uD7A3\u3131-\u314E\u3161-\u3163][\uAC00-\uD7A3\u3131-\u314E\u3161-\u3163\s,.!?~]*[\uAC00-\uD7A3\u3131-\u314E\u3161-\u3163!?~]/g);
  if (!matches || matches.length === 0) return text; // 한국어 없으면 전체 반환
  return matches.map((m) => m.trim()).filter((m) => m.length > 1).join(" ");
}

export default function VoiceSessionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tutorParam = (params.get("tutor") ?? "jimin") as Tutor;
  const { t } = useLanguage();

  const [uid, setUid]               = useState<string | null>(null);
  const [userName, setUserName]     = useState("");
  const [tutor]                     = useState<Tutor>(tutorParam);
  const [speechStyle, setSpeechStyle] = useState<SpeechStyle>("formal");
  const [nativeLang, setNativeLang] = useState<string>("en");
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>("loading");
  const [card, setCard]             = useState<ConvCard | null>(null);
  const [showCard, setShowCard]     = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showCC, setShowCC]         = useState(true);
  const [ccText, setCCText]         = useState("");
  const [timer, setTimer]           = useState(600);
  const [msgCount, setMsgCount]     = useState(0);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [initError, setInitError]   = useState("");

  const [started, setStarted] = useState(false); // 탭하여 시작 후 true

  const messagesRef    = useRef<{ role: string; content: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const cardTimerRef   = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef  = useRef("");
  const audioRef       = useRef<HTMLAudioElement | null>(null);

  // ── Play base64 audio via HTMLAudioElement (Blob URL) ─
  const playBase64Audio = useCallback(
    (base64: string, mimeType: string): Promise<void> =>
      new Promise((resolve) => {
        try {
          // 이전 오디오 중단
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
          }

          const binary = atob(base64);
          const bytes  = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob   = new Blob([bytes], { type: mimeType });
          const url    = URL.createObjectURL(blob);

          const audio  = new Audio(url);
          audio.volume = 1.0;
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            setVoiceState("idle");
            resolve();
          };
          audio.onerror = () => {
            console.error("Audio playback error");
            URL.revokeObjectURL(url);
            setVoiceState("idle");
            resolve();
          };
          audio.play().catch((e) => {
            console.error("audio.play() blocked:", e);
            // Ghost audio 방지: 차단된 Audio 객체를 완전히 정리
            audio.pause();
            audio.src = "";
            URL.revokeObjectURL(url);
            audioRef.current = null;
            setVoiceState("idle");
            resolve();
          });
        } catch (e) {
          console.error("playBase64Audio error:", e);
          setVoiceState("idle");
          resolve();
        }
      }),
    []
  );

  // ── Stop audio ────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  // ── Auth + Firestore user ─────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/onboarding"); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data();
        if (data) {
          setUserName(data.name ?? "학습자");
          setSpeechStyle(data.speechStyle ?? "formal");
          // nativeLanguage: Firestore에 없으면 localStorage fallback
          const lang = data.nativeLanguage
            || (typeof window !== "undefined" && localStorage.getItem("appLanguage"))
            || "en";
          setNativeLang(lang);
        }
      } catch (e) {
        console.error("Failed to load user:", e);
        const lang = typeof window !== "undefined" ? (localStorage.getItem("appLanguage") || "en") : "en";
        setNativeLang(lang);
      }
    });
    return () => unsub();
  }, [router]);

  // ── Create session when uid + speechStyle ready ───
  useEffect(() => {
    if (!uid || !speechStyle) return;
    if (sessionId) return; // already created

    const createSess = httpsCallable(functions, "createSession");
    createSess({
      persona: "same-sex-friend",
      responseStyle: "empathetic",
      correctionStrength: "minimal",
      formalityLevel: speechStyle === "formal" ? "formal" : "casual",
      isVoiceSession: true,
    })
      .then((res: any) => {
        const sid = res.data?.sessionId;
        if (!sid) throw new Error("No sessionId returned");
        setSessionId(sid);

        // 인트로 텍스트는 messages에만 저장 (카드+음성은 handleStart에서 동시 출력)
        const intro = (BILINGUAL_INTROS[nativeLang] ?? BILINGUAL_INTROS["en"])[tutor];
        messagesRef.current.push({ role: "assistant", content: intro });
        setVoiceState("idle");
      })
      .catch((e) => {
        console.error("createSession failed:", e);
        setInitError("세션 시작 실패. 뒤로 가서 다시 시도해주세요.");
        setVoiceState("idle");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, speechStyle, tutor]);

  // ── Timer countdown ───────────────────────────────
  useEffect(() => {
    if (voiceState === "loading" || timer <= 0) return;
    const t = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [voiceState, timer]);

  // ── Conversation card ──────────────────────────────
  const showConvCard = (korean: string) => {
    if (cardTimerRef.current) clearTimeout(cardTimerRef.current);
    setCard({ korean, id: Date.now().toString() });
    setShowCard(true);
    setShowTranslation(false);
    cardTimerRef.current = setTimeout(() => setShowCard(false), 8000);
  };
  const dismissCard = () => {
    if (cardTimerRef.current) clearTimeout(cardTimerRef.current);
    setShowCard(false);
  };

  // ── Send text to AI ───────────────────────────────
  const sendToAI = useCallback(
    async (userText: string) => {
      if (!sessionId || !userText.trim()) { setVoiceState("idle"); return; }
      setVoiceState("thinking");
      setCCText("");

      messagesRef.current.push({ role: "user", content: userText });
      setMsgCount((p) => p + 1);

      try {
        // Step 1: AI text via textChat (uses real Firestore session)
        const callTextChat = httpsCallable(functions, "textChat");
        const textRes = await callTextChat({
          sessionId,
          userMessage: userText,
          nativeLanguage: nativeLang,
        }) as any;

        const aiText: string = textRes.data?.aiMessage ?? t("session.error");
        messagesRef.current.push({ role: "assistant", content: aiText });

        // Step 2: 한국어 부분만 추출해서 TTS 요청 (전체 텍스트는 카드에 표시)
        const koreanOnly = extractKoreanForTTS(aiText);
        const callTTS = httpsCallable(functions, "synthesizeSpeech");
        const ttsRes = await callTTS({
          text: koreanOnly,
          tutor,
          speechStyle,
        }) as any;

        const audioContent = ttsRes.data?.audioContent;
        const mimeType     = ttsRes.data?.mimeType ?? "audio/wav";

        // TTS 준비 완료 → 전체 텍스트 카드(이중언어) + 한국어 음성 동시 출력
        showConvCard(aiText);
        if (showCC) setCCText(aiText);
        setVoiceState("ai_speaking");

        if (audioContent) {
          await playBase64Audio(audioContent, mimeType);
        } else {
          console.warn("TTS returned no audioContent");
          setVoiceState("idle");
        }
      } catch (e: any) {
        console.error("sendToAI error:", e);
        showConvCard(t("session.error"));
        setVoiceState("idle");
      }
    },
    [sessionId, tutor, speechStyle, showCC, nativeLang, playBase64Audio, t]
  );

  // ── Speech recognition ────────────────────────────
  const initRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = "ko-KR";
    r.continuous = false;
    r.interimResults = true;

    r.onresult = (e: any) => {
      const interim = Array.from(e.results as any[])
        .map((res: any) => res[0].transcript).join("");
      transcriptRef.current = interim;
      if (showCC) setCCText(interim);
    };

    r.onend = () => {
      setIsPointerDown(false);
      const final = transcriptRef.current;
      transcriptRef.current = "";
      if (final.trim()) sendToAI(final);
      else setVoiceState("idle");
    };

    r.onerror = (e: any) => {
      console.error("SpeechRecognition error:", e.error);
      setVoiceState("idle");
      setIsPointerDown(false);
      transcriptRef.current = "";
    };

    return r;
  }, [showCC, sendToAI]);

  // ── 탭하여 시작: 사용자 제스처로 인트로 TTS 재생 ──────
  const handleStart = useCallback(async () => {
    if (started) return;
    setStarted(true);

    // 사용자 모국어에 맞는 이중언어 인트로 선택
    const intro = (BILINGUAL_INTROS[nativeLang] ?? BILINGUAL_INTROS["en"])[tutor];
    messagesRef.current.push({ role: "assistant", content: intro });

    try {
      // 한국어 부분만 TTS 요청 → 카드+음성 동시 출력
      const koreanOnly = extractKoreanForTTS(intro);
      const callTTS = httpsCallable(functions, "synthesizeSpeech");
      const res = await callTTS({ text: koreanOnly, tutor, speechStyle }) as any;
      const ac = res.data?.audioContent;
      const mt = res.data?.mimeType ?? "audio/wav";

      showConvCard(intro);
      if (showCC) setCCText(intro);
      setVoiceState("ai_speaking");

      if (ac) await playBase64Audio(ac, mt);
      else setVoiceState("idle");
    } catch {
      showConvCard(intro);
      if (showCC) setCCText(intro);
      setVoiceState("idle");
    }
  }, [started, tutor, speechStyle, showCC, nativeLang, playBase64Audio]);

  // ── PTT: Pointer Down ─────────────────────────────
  const handleMicDown = useCallback(() => {
    if (!started) return;
    if (voiceState === "thinking" || voiceState === "loading") return;

    // Stop AI audio if playing
    stopAudio();

    setVoiceState("user_speaking");
    setIsPointerDown(true);
    transcriptRef.current = "";
    dismissCard();

    const r = initRecognition();
    if (!r) { setVoiceState("idle"); return; }
    recognitionRef.current = r;
    try { r.start(); } catch { setVoiceState("idle"); }
  }, [started, voiceState, stopAudio, initRecognition]);

  // ── PTT: Pointer Up ───────────────────────────────
  const handleMicUp = useCallback(() => {
    if (!isPointerDown) return;
    setIsPointerDown(false);
    try { recognitionRef.current?.stop(); } catch {}
  }, [isPointerDown]);

  const handleEndSession = () => {
    stopAudio();
    recognitionRef.current?.stop();
    router.push(`/session/summary?tutor=${tutor}&count=${msgCount}&sessionId=${sessionId ?? ""}`);
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const tutorInfo = TUTOR_INFO[tutor];

  // ── Render ─────────────────────────────────────────
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#fff", fontFamily: "Pretendard, sans-serif", overflow: "hidden", position: "relative" }}>

      {/* ── 헤더 ── */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #E5E7EB", background: "#fff", flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#6B7280" }}>←</button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: tutorInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
            {tutorInfo.emoji}
          </div>
          <span style={{ fontWeight: 700, fontSize: "14px", color: "#1A1A2E" }}>{tutorInfo.name}</span>
          <span style={{ fontSize: "12px", color: tutorInfo.color, background: tutorInfo.bg, padding: "2px 8px", borderRadius: "9999px" }}>
            {speechStyle === "formal" ? "존댓말" : "반말"}
          </span>
        </div>
        <button
          onClick={() => setShowCC((p) => !p)}
          style={{ background: showCC ? "#D63000" : "#F3F4F6", border: "none", color: showCC ? "#fff" : "#6B7280", borderRadius: "8px", padding: "4px 10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
        >CC</button>
      </header>

      {/* ── 중앙 아바타 영역 ── */}
      <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: "20px 0" }}>

        {/* ── 탭하여 시작 오버레이 (세션 준비 완료 후, 아직 시작 전) ── */}
        {!started && voiceState === "idle" && !initError && (
          <div
            onClick={handleStart}
            style={{
              position: "absolute", inset: 0, zIndex: 30,
              background: "rgba(255,255,255,0.96)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "16px", cursor: "pointer",
            }}
          >
            <div style={{ fontSize: "80px", animation: "float 3s ease-in-out infinite" }}>
              {tutorInfo.emoji}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1A1A2E" }}>
              탭하여 대화 시작
            </div>
            <div style={{ fontSize: "14px", color: "#9CA3AF" }}>
              {tutorInfo.name} 선생님이 인사할 거예요
            </div>
            <div style={{
              marginTop: "8px",
              width: "64px", height: "64px", borderRadius: "50%",
              background: "linear-gradient(135deg, #D63000, #FF5722)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px", animation: "pulse 1.5s ease-in-out infinite",
              boxShadow: "0 4px 20px rgba(214,48,0,0.4)",
            }}>
              👆
            </div>
          </div>
        )}

        {/* 초기화 에러 */}
        {initError && (
          <div style={{ position: "absolute", top: 12, left: "5%", width: "90%", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "12px", padding: "12px 16px", zIndex: 20, color: "#DC2626", fontSize: "14px", textAlign: "center" }}>
            {initError}
          </div>
        )}

        {/* 대화 카드 */}
        {showCard && card && (
          <div style={{ position: "absolute", top: "12px", left: "5%", width: "90%", background: "#fff", borderRadius: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.14)", padding: "18px 16px 14px", zIndex: 20, animation: "slideUp 0.35s ease-out" }}>
            <button onClick={dismissCard} style={{ position: "absolute", top: "12px", right: "14px", background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#9CA3AF" }}>✕</button>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#1A1A2E", lineHeight: 1.5, marginBottom: "6px", paddingRight: "24px" }}>
              {card.korean}
            </div>
            {showTranslation && (
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "8px" }}>(번역 기능 준비 중)</div>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button
                onClick={async () => {
                  const callTTS = httpsCallable(functions, "synthesizeSpeech");
                  try {
                    const res = await callTTS({ text: card.korean, tutor, speechStyle }) as any;
                    const ac = res.data?.audioContent;
                    const mt = res.data?.mimeType ?? "audio/wav";
                    if (ac) await playBase64Audio(ac, mt);
                  } catch(e) { console.error("Card TTS error:", e); }
                }}
                style={{ display: "flex", alignItems: "center", gap: "4px", background: "#FFF0EB", border: "none", borderRadius: "9999px", padding: "6px 12px", fontSize: "13px", color: "#D63000", fontWeight: 600, cursor: "pointer" }}
              >
                🔊 {t("session.replay")}
              </button>
              <button
                onClick={() => setShowTranslation((p) => !p)}
                style={{ display: "flex", alignItems: "center", gap: "4px", background: "#F3F4F6", border: "none", borderRadius: "9999px", padding: "6px 12px", fontSize: "13px", color: "#6B7280", fontWeight: 600, cursor: "pointer" }}
              >
                🔀 {t("session.translate")}
              </button>
            </div>
          </div>
        )}

        {/* Ripple rings (AI speaking) */}
        {voiceState === "ai_speaking" && (
          <>
            <div style={{ position: "absolute", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(214,48,0,0.12)", animation: "ripple 1.5s ease-out infinite" }} />
            <div style={{ position: "absolute", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(214,48,0,0.08)", animation: "ripple 1.5s ease-out 0.5s infinite" }} />
            <div style={{ position: "absolute", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(214,48,0,0.05)", animation: "ripple 1.5s ease-out 1s infinite" }} />
          </>
        )}

        {/* 아바타 */}
        <div style={{
          width: "140px", height: "140px", borderRadius: "50%",
          background: tutorInfo.bg, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "72px",
          border: `3px solid ${
            voiceState === "ai_speaking" ? "#D63000"
            : voiceState === "user_speaking" ? "#EF4444"
            : voiceState === "thinking" ? "#F59E0B"
            : voiceState === "loading" ? "#E5E7EB"
            : "#E5E7EB"
          }`,
          transition: "border-color 0.3s",
          animation: (voiceState === "idle") ? "float 3s ease-in-out infinite"
            : voiceState === "thinking" ? "pulse 1.2s ease-in-out infinite"
            : voiceState === "loading" ? "pulse 1.2s ease-in-out infinite"
            : "none",
          position: "relative", zIndex: 5,
        }}>
          {tutorInfo.emoji}
        </div>

        {/* 상태 표시 */}
        <div style={{ marginTop: "20px", minHeight: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          {voiceState === "loading" && (
            <div style={{ fontSize: "13px", color: "#9CA3AF" }}>세션 준비 중...</div>
          )}
          {voiceState === "idle" && (
            <div style={{ fontSize: "13px", color: "#9CA3AF" }}>{t("session.voice.hint")}</div>
          )}
          {voiceState === "user_speaking" && (
            <>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#EF4444" }}>{t("session.voice.listening")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "24px" }}>
                {[0,1,2,3,4,5,6,7].map((i) => (
                  <div key={i} style={{ width: "4px", background: "#EF4444", borderRadius: "2px", animation: `wave ${0.4 + (i % 3) * 0.15}s ${i * 0.07}s ease-in-out infinite alternate`, minHeight: "4px" }} />
                ))}
              </div>
            </>
          )}
          {voiceState === "ai_speaking" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#D63000" }}>{tutorInfo.name}이(가) 말하는 중</div>
              <div style={{ display: "flex", gap: "3px" }}>
                {[0,1,2,3,4].map((i) => (
                  <div key={i} style={{ width: "4px", background: "#D63000", borderRadius: "2px", animation: `waveBar 0.7s ${i * 0.12}s ease-in-out infinite alternate`, minHeight: "4px" }} />
                ))}
              </div>
            </div>
          )}
          {voiceState === "thinking" && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "13px", color: "#F59E0B", fontWeight: 600 }}>{t("session.voice.thinking")}</span>
              {[0,1,2].map((i) => (
                <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F59E0B", animation: `dotBounce 0.9s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          )}
        </div>

        {/* CC 자막 */}
        {showCC && ccText && (
          <div style={{ position: "absolute", bottom: "8px", left: "8%", width: "84%", background: "rgba(0,0,0,0.7)", borderRadius: "10px", padding: "8px 12px", textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: "14px", lineHeight: 1.4 }}>{ccText}</div>
          </div>
        )}
      </div>

      {/* ── 하단 컨트롤 ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "8px 24px 32px", borderTop: "1px solid #E5E7EB" }}>
        {/* 타이머 */}
        <div style={{ fontSize: "14px", color: timer < 60 ? "#EF4444" : "#9CA3AF", fontWeight: 500 }}>
          ⏱️ {formatTimer(timer)}
        </div>

        {/* 버튼 행 */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {/* 채팅 전환 */}
          <button
            onClick={() => router.push(`/session/chat?tutor=${tutor}`)}
            style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#F3F4F6", border: "none", fontSize: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >💬</button>

          {/* ★ Push-to-Talk 마이크 */}
          <button
            onPointerDown={handleMicDown}
            onPointerUp={handleMicUp}
            onPointerLeave={handleMicUp}
            disabled={!started || voiceState === "thinking" || voiceState === "loading"}
            style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: !started
                ? "#E5E7EB"
                : isPointerDown
                ? "#B32700"
                : (voiceState === "thinking" || voiceState === "loading")
                ? "#E5E7EB"
                : voiceState === "ai_speaking"
                ? "#6B7280"
                : "linear-gradient(135deg, #D63000, #FF5722)",
              border: "none", fontSize: "32px",
              cursor: (!started || voiceState === "thinking" || voiceState === "loading") ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isPointerDown ? "0 2px 8px rgba(179,39,0,0.4)"
                : (!started || voiceState === "ai_speaking" || voiceState === "thinking" || voiceState === "loading")
                ? "none"
                : "0 4px 20px rgba(214,48,0,0.4)",
              transform: isPointerDown ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.1s, background 0.2s, box-shadow 0.2s",
              touchAction: "none",
            }}
          >
            {isPointerDown ? "⏹" : voiceState === "loading" ? "⏳" : "🎙️"}
          </button>

          {/* 세션 종료 */}
          <button
            onClick={handleEndSession}
            style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#F3F4F6", border: "none", fontSize: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >✅</button>
        </div>

        {/* 세션 종료 버튼 */}
        <button
          onClick={handleEndSession}
          style={{ width: "80%", height: "48px", background: "#fff", border: "1.5px solid #E5E7EB", color: "#6B7280", borderRadius: "9999px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
        >
          {t("session.end")}
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(0.97); }
        }
        @keyframes ripple {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes wave {
          from { height: 4px; }
          to   { height: 22px; }
        }
        @keyframes waveBar {
          from { height: 4px; }
          to   { height: 20px; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%           { transform: scale(1);   opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
