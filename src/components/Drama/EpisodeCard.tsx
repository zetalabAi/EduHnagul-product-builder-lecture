/**
 * Episode Card Component
 * Display drama episode with thumbnail and progress
 */

"use client";

import { useRouter } from "next/navigation";

interface Episode {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  thumbnail?: string;
  completed?: boolean;
  bestScore?: number;
  bestEnding?: string;
}

interface EpisodeCardProps {
  episode: Episode;
}

const DIFFICULTY_COLORS = {
  beginner: "bg-green-600",
  intermediate: "bg-yellow-600",
  advanced: "bg-red-600",
};

const DIFFICULTY_LABELS = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const router = useRouter();

  const handleStart = () => {
    router.push(`/drama/${episode.id}`);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all hover:shadow-xl group">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-purple-900 to-blue-900 overflow-hidden">
        {episode.thumbnail ? (
          <img
            src={episode.thumbnail}
            alt={episode.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🎭</span>
          </div>
        )}

        {/* Difficulty Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`${DIFFICULTY_COLORS[episode.difficulty]} text-white text-xs px-3 py-1 rounded-full font-medium`}
          >
            {DIFFICULTY_LABELS[episode.difficulty]}
          </span>
        </div>

        {/* Completed Badge */}
        {episode.completed && (
          <div className="absolute top-3 right-3">
            <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
              ✓ 완료
            </span>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
          ⏱️ {episode.estimatedMinutes}분
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-bold text-lg mb-2">{episode.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {episode.description}
        </p>

        {/* Progress Info */}
        {episode.completed && (
          <div className="mb-4 space-y-1">
            {episode.bestScore !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">최고 점수</span>
                <span className="text-yellow-400 font-bold">{episode.bestScore}점</span>
              </div>
            )}
            {episode.bestEnding && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">달성한 엔딩</span>
                <span className="text-purple-400 font-medium">{episode.bestEnding}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition-all transform group-hover:scale-105"
        >
          {episode.completed ? "🔄 다시하기" : "▶️ 시작하기"}
        </button>
      </div>
    </div>
  );
}
