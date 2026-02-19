"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Tab = "kdrama" | "kpop" | "travel" | "business";

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  level: string;
  progress: number;
  requiredTemp: number;
  lessons: number;
  description: string;
};

const COURSES: Record<Tab, Course[]> = {
  kdrama: [
    { id: "d1", title: "사랑의 불시착 기초", thumbnail: "🛬", level: "초급", progress: 60, requiredTemp: 0,   lessons: 5,  description: "남주혁·손예진이 사용한 실제 대사를 배워보세요!" },
    { id: "d2", title: "이태원 클라쓰 표현", thumbnail: "🍷", level: "중급", progress: 20, requiredTemp: 50,  lessons: 6,  description: "청춘 드라마 속 열정적인 한국어 표현을 익혀요." },
    { id: "d3", title: "오징어게임 대사",     thumbnail: "🦑", level: "중급", progress: 0,  requiredTemp: 80,  lessons: 4,  description: "전 세계를 강타한 드라마의 핵심 표현을 배워요." },
    { id: "d4", title: "도깨비 감성 표현",    thumbnail: "🌹", level: "고급", progress: 0,  requiredTemp: 120, lessons: 8,  description: "아름다운 대사와 감성 표현을 마스터해보세요." },
  ],
  kpop: [
    { id: "k1", title: "BTS 기초 한국어",     thumbnail: "🎤", level: "초급", progress: 40, requiredTemp: 0,   lessons: 5,  description: "방탄소년단 가사로 배우는 기초 한국어!" },
    { id: "k2", title: "BLACKPINK 슬랭",      thumbnail: "🖤", level: "초급", progress: 0,  requiredTemp: 30,  lessons: 4,  description: "블랙핑크가 자주 쓰는 슬랭과 유행어를 익혀요." },
    { id: "k3", title: "NewJeans 가사 분석",   thumbnail: "🐰", level: "중급", progress: 0,  requiredTemp: 60,  lessons: 6,  description: "뉴진스의 감성적인 가사 속 표현을 배워요." },
    { id: "k4", title: "아이돌 팬덤 표현",     thumbnail: "✨", level: "고급", progress: 0,  requiredTemp: 100, lessons: 7,  description: "팬들이 실제로 사용하는 팬덤 언어를 마스터해요." },
  ],
  travel: [
    { id: "t1", title: "공항·교통 표현",       thumbnail: "✈️", level: "초급", progress: 0, requiredTemp: 0,  lessons: 4,  description: "한국 여행의 시작, 공항부터 대중교통까지!" },
    { id: "t2", title: "식당 주문하기",        thumbnail: "🍽️", level: "초급", progress: 0, requiredTemp: 20, lessons: 5,  description: "맛집에서 자신있게 주문할 수 있는 표현들." },
    { id: "t3", title: "쇼핑 표현",           thumbnail: "🛍️", level: "중급", progress: 0, requiredTemp: 50, lessons: 5,  description: "동대문·명동에서 흥정하고 쇼핑하는 법!" },
  ],
  business: [
    { id: "b1", title: "비즈니스 인사",        thumbnail: "🤝", level: "중급", progress: 0, requiredTemp: 0,   lessons: 4, description: "한국 비즈니스 문화와 격식체 인사법." },
    { id: "b2", title: "회의·발표 표현",       thumbnail: "📊", level: "중급", progress: 0, requiredTemp: 60,  lessons: 6, description: "업무 미팅에서 사용하는 전문적인 표현들." },
    { id: "b3", title: "이메일 작성법",        thumbnail: "📧", level: "고급", progress: 0, requiredTemp: 100, lessons: 5, description: "한국어 비즈니스 이메일 작성의 모든 것." },
  ],
};

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "kdrama",   icon: "🎬", label: "K-drama" },
  { id: "kpop",     icon: "🎵", label: "K-pop" },
  { id: "travel",   icon: "✈️", label: "여행" },
  { id: "business", icon: "💼", label: "비즈니스" },
];

const LEVEL_COLOR: Record<string, { bg: string; color: string }> = {
  초급: { bg: "#D1FAE5", color: "#065F46" },
  중급: { bg: "#DBEAFE", color: "#1E40AF" },
  고급: { bg: "#FEE2E2", color: "#991B1B" },
};

const FEATURED: Record<Tab, { title: string; subtitle: string; emoji: string; tutor: string }> = {
  kdrama:   { title: "K-drama 과외 시작",   subtitle: "지민 선생님과 드라마 대사 마스터", emoji: "🎬", tutor: "jimin" },
  kpop:     { title: "K-pop 과외 시작",     subtitle: "민준 선생님과 가사 완전 정복",     emoji: "🎵", tutor: "minjun" },
  travel:   { title: "여행 한국어 완성",     subtitle: "지민 선생님과 여행 필수 표현",     emoji: "✈️", tutor: "jimin" },
  business: { title: "비즈니스 한국어",     subtitle: "민준 선생님과 직장 언어 마스터",   emoji: "💼", tutor: "minjun" },
};

const NAV = [
  { href: "/home",    icon: "🏠", label: "홈" },
  { href: "/courses", icon: "📚", label: "코스" },
  { href: "/review",  icon: "🃏", label: "복습" },
  { href: "/friends", icon: "🏆", label: "리그" },
  { href: "/settings",icon: "👤", label: "프로필" },
];

export default function CoursesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("kdrama");
  const [mannerTemp, setMannerTemp] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/onboarding"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      setMannerTemp(snap.data()?.mannerTemp ?? 0);
    });
    return () => unsub();
  }, [router]);

  const courses = COURSES[tab];
  const featured = FEATURED[tab];

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FA", fontFamily: "Pretendard, sans-serif", paddingBottom: "80px" }}>

      {/* 헤더 */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <div style={{ fontWeight: 800, fontSize: "20px", color: "#1A1A2E", marginBottom: "14px" }}>📚 코스</div>
          {/* 카테고리 탭 (스크롤) */}
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "14px", scrollbarWidth: "none" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flexShrink: 0,
                  height: "36px",
                  padding: "0 16px",
                  border: "none",
                  borderRadius: "9999px",
                  background: tab === t.id ? "#D63000" : "#F3F4F6",
                  color: tab === t.id ? "#fff" : "#6B7280",
                  fontWeight: tab === t.id ? 700 : 500,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "16px" }}>

        {/* ── 커스텀 레슨 배너 (Tenmin 스타일) ── */}
        <div
          onClick={() => router.push(`/session?tutor=${featured.tutor}`)}
          style={{
            background: "linear-gradient(135deg, #D63000, #FF5722)",
            borderRadius: "20px",
            padding: "20px",
            marginBottom: "16px",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* 배경 장식 */}
          <div style={{ position: "absolute", right: "-20px", top: "-20px", fontSize: "100px", opacity: 0.12, lineHeight: 1 }}>
            {featured.emoji}
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              AI 튜터 추천 레슨
            </div>
            <div style={{ color: "#fff", fontSize: "20px", fontWeight: 800, marginBottom: "4px" }}>{featured.title}</div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", marginBottom: "16px" }}>{featured.subtitle}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fff", borderRadius: "9999px", padding: "8px 16px" }}>
              <span style={{ fontSize: "14px" }}>{featured.tutor === "jimin" ? "👩" : "👨"}</span>
              <span style={{ fontWeight: 700, fontSize: "14px", color: "#D63000" }}>바로 시작하기 →</span>
            </div>
          </div>
        </div>

        {/* ── 코스 그리드 ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {courses.map((c) => {
            const locked = mannerTemp < c.requiredTemp;
            const lv = LEVEL_COLOR[c.level];
            return (
              <div
                key={c.id}
                onClick={() => !locked && setSelectedCourse(c)}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  border: "1px solid #E5E7EB",
                  overflow: "hidden",
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: locked ? 0.6 : 1,
                  transition: "transform 0.15s",
                }}
                onMouseDown={(e) => !locked && (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {/* 썸네일 */}
                <div style={{ height: "90px", background: "linear-gradient(135deg, #FFF0EB, #FFF7F3)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <span style={{ fontSize: "40px" }}>{c.thumbnail}</span>
                  {locked && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                      🔒
                    </div>
                  )}
                </div>
                <div style={{ padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: lv.color, background: lv.bg, borderRadius: "9999px", padding: "2px 8px" }}>
                      {c.level}
                    </span>
                    <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{c.lessons}강</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#1A1A2E", lineHeight: 1.3, marginBottom: "8px" }}>{c.title}</div>
                  {c.progress > 0 && (
                    <>
                      <div style={{ background: "#F3F4F6", borderRadius: "9999px", height: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${c.progress}%`, height: "100%", background: "#D63000", borderRadius: "9999px" }} />
                      </div>
                      <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>{c.progress}% 완료</div>
                    </>
                  )}
                  {locked && (
                    <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>🌡️ {c.requiredTemp}° 필요</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── 코스 상세 바텀시트 ── */}
      {selectedCourse && (
        <>
          <div
            onClick={() => setSelectedCourse(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#fff",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 48px",
              zIndex: 201,
              animation: "slideUp 0.3s ease-out",
              maxWidth: "480px",
              margin: "0 auto",
            }}
          >
            {/* 핸들 */}
            <div style={{ width: "40px", height: "4px", background: "#E5E7EB", borderRadius: "9999px", margin: "0 auto 20px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, #FFF0EB, #FFF7F3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
                {selectedCourse.thumbnail}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "18px", color: "#1A1A2E" }}>{selectedCourse.title}</div>
                <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: LEVEL_COLOR[selectedCourse.level].color, background: LEVEL_COLOR[selectedCourse.level].bg, borderRadius: "9999px", padding: "2px 8px" }}>
                    {selectedCourse.level}
                  </span>
                  <span style={{ fontSize: "12px", color: "#9CA3AF", padding: "2px 4px" }}>{selectedCourse.lessons}개 강의</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6, marginBottom: "20px" }}>
              {selectedCourse.description}
            </p>
            <button
              onClick={() => { setSelectedCourse(null); router.push(`/session?tutor=jimin`); }}
              style={{ width: "100%", height: "52px", background: "linear-gradient(135deg, #D63000, #FF5722)", color: "#fff", border: "none", borderRadius: "9999px", fontWeight: 700, fontSize: "16px", cursor: "pointer" }}
            >
              👩 지민과 이 코스 시작하기
            </button>
            <button
              onClick={() => setSelectedCourse(null)}
              style={{ width: "100%", marginTop: "10px", background: "none", border: "none", color: "#9CA3AF", fontSize: "14px", cursor: "pointer", padding: "8px" }}
            >
              닫기
            </button>
          </div>
        </>
      )}

      {/* 하단 탭 */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #E5E7EB", display: "flex", height: "64px", zIndex: 100 }}>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", textDecoration: "none" }}>
            <span style={{ fontSize: "22px" }}>{n.icon}</span>
            <span style={{ fontSize: "10px", fontWeight: 600, color: n.href === "/courses" ? "#D63000" : "#9CA3AF" }}>{n.label}</span>
          </Link>
        ))}
      </nav>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
