"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function DramaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/signin");
      } else {
        setUser(currentUser);
        loadEpisodes();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadEpisodes = async () => {
    try {
      const functions = getFunctions();
      const getAllEpisodesFn = httpsCallable(functions, "getAllEpisodes");
      const result = await getAllEpisodesFn({});
      const data = result.data as any;
      setEpisodes(data.episodes);
    } catch (error) {
      console.error("Failed to load episodes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          🎭 Drama Mode
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-12">
          드라마 주인공이 되어 한국어를 배워보세요!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodes.map((ep) => (
            <div
              key={ep.id}
              onClick={() => router.push(`/drama/${ep.id}`)}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="text-3xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                S{ep.season}E{ep.episode}: {ep.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {ep.description}
              </p>
              <div className="flex gap-2 flex-wrap">
                {ep.learningGoals.slice(0, 2).map((goal: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
