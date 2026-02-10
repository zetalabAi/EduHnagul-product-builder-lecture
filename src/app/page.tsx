"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-900 bg-opacity-80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">🇰🇷 Edu_Hangul</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <a
                  href="/chat"
                  className="hidden md:inline-block text-gray-300 hover:text-white transition"
                >
                  💬 텍스트
                </a>
                <a
                  href="/voice"
                  className="hidden md:inline-block text-gray-300 hover:text-white transition"
                >
                  🎤 음성
                </a>
                <a
                  href="/pricing"
                  className="hidden md:inline-block text-gray-300 hover:text-white transition"
                >
                  💰 요금제
                </a>
                <a
                  href="/settings"
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
                >
                  👤 프로필
                </a>
              </>
            ) : (
              <>
                <a
                  href="/auth/signin"
                  className="text-gray-300 hover:text-white transition"
                >
                  로그인
                </a>
                <a
                  href="/auth/signin"
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition"
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            한국어를 드라마처럼 배우세요
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            AI와 실시간 대화로 배우는 진짜 한국어
            <br />
            <span className="text-gray-400 text-lg">
              교과서가 아닌, 실제 대화 수준의 자연스러운 표현
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <>
                <a
                  href="/voice"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-blue-500/50"
                >
                  🎤 음성 대화 시작하기
                </a>
                <a
                  href="/chat"
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-purple-500/50"
                >
                  💬 텍스트 대화 시작하기
                </a>
              </>
            ) : (
              <>
                <a
                  href="/auth/signin"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-blue-500/50"
                >
                  무료로 시작하기
                </a>
                <a
                  href="/pricing"
                  className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 px-8 py-4 rounded-xl font-bold text-lg transition"
                >
                  요금제 보기
                </a>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500">
            ✨ 회원가입하면 주 15분 무료 | 광고 제거 $4.9/월부터
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-900 bg-opacity-50 rounded-3xl mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          ✨ 주요 기능
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition">
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-xl font-bold mb-2">음성 대화</h3>
            <p className="text-gray-400">
              실시간 음성 인식으로 말하면서 배우세요. 감정 표현이 가능한 고품질 TTS로 응답합니다.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">텍스트 채팅</h3>
            <p className="text-gray-400">
              키보드로 편하게 대화하세요. 데스크톱에서 타이핑하면서 문법과 표현을 연습할 수 있어요.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">Claude AI</h3>
            <p className="text-gray-400">
              최신 Claude Sonnet 3.5로 자연스럽고 정확한 대화. 드라마처럼 실제 쓰는 한국어를 배워요.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-bold mb-2">대화 도우미</h3>
            <p className="text-gray-400">
              막힐 때 AI가 상황에 맞는 한국어 문장 3개를 제안해줍니다. 자연스러운 표현을 배우세요.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">학습 분석</h3>
            <p className="text-gray-400">
              대화 시간, 점유율, 말하기 레벨 확인. Pro 사용자는 발음/어휘/문법 상세 분석까지!
            </p>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          지금 바로 시작하세요!
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          무료로 주 15분 음성 대화 + 텍스트 채팅 제공
        </p>
        {!user && (
          <a
            href="/auth/signin"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-12 py-4 rounded-xl font-bold text-xl transition shadow-lg shadow-blue-500/50"
          >
            무료 회원가입
          </a>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 bg-opacity-80 border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400">
                © 2024 Edu_Hangul. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="/pricing" className="text-gray-400 hover:text-white transition">
                요금제
              </a>
              <a href="/settings" className="text-gray-400 hover:text-white transition">
                프로필
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav (for logged in users) */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 md:hidden z-50 pb-safe">
          <div className="flex justify-around py-3">
            <a
              href="/"
              className="flex flex-col items-center text-gray-400 hover:text-white transition"
            >
              <span className="text-2xl mb-1">🏠</span>
              <span className="text-xs">홈</span>
            </a>
            <a
              href="/voice"
              className="flex flex-col items-center text-gray-400 hover:text-white transition"
            >
              <span className="text-2xl mb-1">🎤</span>
              <span className="text-xs">음성</span>
            </a>
            <a
              href="/chat"
              className="flex flex-col items-center text-gray-400 hover:text-white transition"
            >
              <span className="text-2xl mb-1">💬</span>
              <span className="text-xs">채팅</span>
            </a>
            <a
              href="/pricing"
              className="flex flex-col items-center text-gray-400 hover:text-white transition"
            >
              <span className="text-2xl mb-1">💰</span>
              <span className="text-xs">요금</span>
            </a>
            <a
              href="/settings"
              className="flex flex-col items-center text-gray-400 hover:text-white transition"
            >
              <span className="text-2xl mb-1">👤</span>
              <span className="text-xs">프로필</span>
            </a>
          </div>
        </nav>
      )}
    </div>
  );
}
