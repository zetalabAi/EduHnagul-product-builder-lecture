import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center max-w-3xl">
          {/* Logo/Title */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edu_Hangul
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4">
            Learn Korean Naturally
          </p>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Chat with AI tutors that adapt to your style. Practice conversations,
            get instant corrections, and build confidence in Korean.
          </p>

          {/* CTA Button */}
          <Link
            href="/app"
            className="inline-block px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out"
          >
            Start
          </Link>

          {/* Features highlight */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">
                Natural Conversations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Chat like you would with a real friend
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">
                Adaptive Learning
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                AI adjusts to your level and goals
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">
                Instant Feedback
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Get corrections that help you improve
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
