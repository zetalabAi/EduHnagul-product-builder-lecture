"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase";

const LANGUAGES = [
  { code: "ar",    flag: "🇸🇦", name: "Arabic",     native: "العربية" },
  { code: "zh",    flag: "🇨🇳", name: "Chinese",    native: "中文" },
  { code: "en",    flag: "🇺🇸", name: "English",    native: "English" },
  { code: "fr",    flag: "🇫🇷", name: "French",     native: "Français" },
  { code: "de",    flag: "🇩🇪", name: "German",     native: "Deutsch" },
  { code: "id",    flag: "🇮🇩", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ja",    flag: "🇯🇵", name: "Japanese",   native: "日本語" },
  { code: "pt",    flag: "🇧🇷", name: "Portuguese", native: "Português" },
  { code: "ru",    flag: "🇷🇺", name: "Russian",    native: "Русский" },
  { code: "es",    flag: "🇪🇸", name: "Spanish",    native: "Español" },
  { code: "th",    flag: "🇹🇭", name: "Thai",       native: "ภาษาไทย" },
  { code: "vi",    flag: "🇻🇳", name: "Vietnamese", native: "Tiếng Việt" },
];

const SUBTITLE_MAP: Record<string, string> = {
  en: "Choose your language / 언어를 선택해주세요",
  ja: "言語を選択してください / 언어를 선택해주세요",
  zh: "请选择您的语言 / 언어를 선택해주세요",
  th: "เลือกภาษาของคุณ / 언어를 선택해주세요",
  vi: "Chọn ngôn ngữ của bạn / 언어를 선택해주세요",
  id: "Pilih bahasa Anda / 언어를 선택해주세요",
  es: "Elige tu idioma / 언어를 선택해주세요",
  fr: "Choisissez votre langue / 언어를 선택해주세요",
  de: "Wähle deine Sprache / 언어를 선택해주세요",
  pt: "Escolha seu idioma / 언어를 선택해주세요",
  ar: "اختر لغتك / 언어를 선택해주세요",
  ru: "Выберите язык / 언어를 선택해주세요",
};

const NEXT_BUTTON_MAP: Record<string, string> = {
  en: "Continue",
  ja: "次へ",
  zh: "下一步",
  th: "ต่อไป",
  vi: "Tiếp tục",
  id: "Lanjutkan",
  es: "Continuar",
  fr: "Continuer",
  de: "Weiter",
  pt: "Continuar",
  ar: "التالي",
  ru: "Продолжить",
};

export default function LanguageSelectPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const subtitle    = selected ? SUBTITLE_MAP[selected]    : "Choose your language / 언어를 선택해주세요";
  const nextBtnText = selected ? NEXT_BUTTON_MAP[selected] : "Continue";

  const handleNext = () => {
    if (!selected) return;
    localStorage.setItem("appLanguage", selected);
    // 이미 로그인된 사용자는 홈으로, 신규 사용자는 온보딩으로
    const user = auth.currentUser;
    router.push(user ? "/home" : "/onboarding");
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#fff",
        fontFamily: "Pretendard, Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // 하단 버튼 공간 확보
        paddingBottom: "120px",
      }}
    >
      {/* 상단 로고 */}
      <div style={{ padding: "48px 20px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px", animation: "bounceIn 0.5s both" }}>🐯</div>
        <div style={{ fontSize: "24px", fontWeight: 800, color: "#D63000", marginBottom: "8px" }}>Edu_Hangul</div>
        {/* 실시간 변경 서브타이틀 */}
        <div
          key={subtitle}
          style={{
            fontSize: "14px",
            color: "#6B7280",
            marginBottom: "32px",
            textAlign: "center",
            lineHeight: 1.6,
            transition: "opacity 0.2s",
            animation: "fadeIn 0.25s ease-out",
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* 언어 목록 — 2열 그리드 */}
      <div style={{ width: "100%", maxWidth: "440px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "0 20px" }}>
        {LANGUAGES.map((lang, i) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "16px 10px",
              borderRadius: "16px",
              border: `2px solid ${selected === lang.code ? "#D63000" : "#E5E7EB"}`,
              background: selected === lang.code ? "#FFF0EB" : "#fff",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
              animation: `fadeInUp 0.3s ${i * 0.04}s both`,
              position: "relative",
            }}
          >
            {/* 선택 체크 */}
            {selected === lang.code && (
              <div style={{
                position: "absolute", top: "8px", right: "8px",
                width: "18px", height: "18px", borderRadius: "50%",
                background: "#D63000", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "11px", color: "#fff",
              }}>✓</div>
            )}
            <span style={{ fontSize: "36px", lineHeight: 1 }}>{lang.flag}</span>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: selected === lang.code ? "#D63000" : "#1A1A2E" }}>
                {lang.native}
              </div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{lang.name}</div>
            </div>
          </button>
        ))}
      </div>

      {/* 하단 고정 버튼 */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #E5E7EB",
          padding: "16px 24px 32px",
          zIndex: 100,
        }}
      >
        <button
          onClick={handleNext}
          disabled={!selected}
          style={{
            width: "100%",
            height: "54px",
            borderRadius: "9999px",
            border: "none",
            background: selected ? "linear-gradient(135deg, #D63000, #FF5722)" : "#E5E7EB",
            color: selected ? "#fff" : "#9CA3AF",
            fontWeight: 700,
            fontSize: "17px",
            cursor: selected ? "pointer" : "not-allowed",
            transition: "background 0.2s, color 0.2s",
            fontFamily: "Pretendard, Inter, sans-serif",
          }}
        >
          {/* 선택 전: Continue / 선택 후: 해당 언어 텍스트 */}
          {nextBtnText}
        </button>
      </div>

      <style>{`
        @keyframes bounceIn {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
