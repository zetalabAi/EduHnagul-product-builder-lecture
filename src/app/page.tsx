"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-primary-600 text-lg font-medium">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192x192.png"
              alt="Edu_Hangul"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Edu_Hangul
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <a
                  href="/chat"
                  className="hidden md:inline-block text-gray-600 hover:text-primary-600 transition font-medium"
                >
                  💬 텍스트
                </a>
                <a
                  href="/voice"
                  className="hidden md:inline-block text-gray-600 hover:text-primary-600 transition font-medium"
                >
                  🎤 음성
                </a>
                <a
                  href="/pricing"
                  className="hidden md:inline-block text-gray-600 hover:text-primary-600 transition font-medium"
                >
                  💰 요금제
                </a>
                <a
                  href="/settings"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition font-medium shadow-md"
                >
                  👤 프로필
                </a>
              </>
            ) : (
              <>
                <a
                  href="/auth/signin"
                  className="text-gray-600 hover:text-primary-600 transition font-medium"
                >
                  로그인
                </a>
                <a
                  href="/auth/signin"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold transition shadow-md"
                >
                  시작하기
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            AI와 함께하는
            <br />
            <span className="bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 bg-clip-text text-transparent">
              자연스러운 한국어 학습
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            K-드라마처럼 자연스럽게, AI 선생님과 실시간 대화하며 배우세요
            <br />
            <span className="text-gray-500 text-lg">
              교과서가 아닌, 실제 대화 수준의 한국어
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <>
                <a
                  href="/voice"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  🎤 음성 대화 시작
                </a>
                <a
                  href="/chat"
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 text-primary-600 border-2 border-primary-500 px-8 py-4 rounded-xl font-bold text-lg transition shadow-md"
                >
                  💬 텍스트 채팅 시작
                </a>
              </>
            ) : (
              <>
                <a
                  href="/auth/signin"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-10 py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  무료로 시작하기
                </a>
                <a
                  href="/pricing"
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-10 py-4 rounded-xl font-bold text-lg transition"
                >
                  요금제 보기
                </a>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500">
            ✨ 무료 체험: 주 15분 음성 대화 | 프리미엄 $4.9/월부터
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900">
          ✨ 주요 기능
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 - 실시간 피드백 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              실시간 피드백
            </h3>
            <p className="text-gray-600 text-center">
              AI가 발음, 문법, 표현을 즉시 교정해드려요
            </p>
          </div>

          {/* Feature 2 - 맞춤형 학습 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💖</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              맞춤형 학습
            </h3>
            <p className="text-gray-600 text-center">
              연인, 친구, 선생님 등 원하는 페르소나 선택
            </p>
          </div>

          {/* Feature 3 - 학습 성과 추적 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              학습 성과 추적
            </h3>
            <p className="text-gray-600 text-center">
              대화 기록과 실력 향상을 한눈에 확인
            </p>
          </div>

          {/* Feature 4 - 음성 대화 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎤</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              음성 대화
            </h3>
            <p className="text-gray-600 text-center">
              실시간 음성 인식으로 말하면서 배우세요
            </p>
          </div>

          {/* Feature 5 - Claude AI */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              Claude AI
            </h3>
            <p className="text-gray-600 text-center">
              최신 Claude 4로 자연스럽고 정확한 대화
            </p>
          </div>

          {/* Feature 6 - 대화 도우미 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💡</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
              대화 도우미
            </h3>
            <p className="text-gray-600 text-center">
              막힐 때 AI가 자연스러운 문장을 제안해줘요
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            지금 바로 시작하세요!
          </h2>
          <p className="text-xl text-white/90 mb-8">
            무료로 주 15분 음성 대화 + 무제한 텍스트 채팅
          </p>
          {!user && (
            <a
              href="/auth/signin"
              className="inline-block bg-white hover:bg-gray-100 text-primary-600 px-12 py-4 rounded-xl font-bold text-xl transition shadow-lg transform hover:scale-105"
            >
              무료 회원가입
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600">
                © 2026 Edu_Hangul. All rights reserved.
              </p>
            </div>
            <div className="flex gap-6">
              <a href="/pricing" className="text-gray-600 hover:text-primary-600 transition">
                요금제
              </a>
              <a href="/settings" className="text-gray-600 hover:text-primary-600 transition">
                프로필
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav (for logged in users) */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 pb-safe shadow-lg">
          <div className="flex justify-around py-3">
            <a
              href="/"
              className="flex flex-col items-center text-primary-500 transition"
            >
              <span className="text-2xl mb-1">🏠</span>
              <span className="text-xs font-medium">홈</span>
            </a>
            <a
              href="/voice"
              className="flex flex-col items-center text-gray-500 hover:text-primary-500 transition"
            >
              <span className="text-2xl mb-1">🎤</span>
              <span className="text-xs font-medium">음성</span>
            </a>
            <a
              href="/chat"
              className="flex flex-col items-center text-gray-500 hover:text-primary-500 transition"
            >
              <span className="text-2xl mb-1">💬</span>
              <span className="text-xs font-medium">채팅</span>
            </a>
            <a
              href="/pricing"
              className="flex flex-col items-center text-gray-500 hover:text-primary-500 transition"
            >
              <span className="text-2xl mb-1">💰</span>
              <span className="text-xs font-medium">요금</span>
            </a>
            <a
              href="/settings"
              className="flex flex-col items-center text-gray-500 hover:text-primary-500 transition"
            >
              <span className="text-2xl mb-1">👤</span>
              <span className="text-xs font-medium">프로필</span>
            </a>
          </div>
        </nav>
      )}
    </div>
  );
}
