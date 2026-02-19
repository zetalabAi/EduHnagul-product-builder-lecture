/**
 * Episode Play Page
 * Play drama episode with scene progression
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDramaPlay } from "@/hooks/useDramaPlay";
import { ScenePlayer } from "@/components/Drama/ScenePlayer";

export default function EpisodePlayPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const episodeId = params.episodeId as string;

  const {
    currentScene,
    totalScore,
    isLoading,
    handleChoice,
  } = useDramaPlay(episodeId, user?.uid || null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">로그인이 필요합니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">에피소드 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (currentScene) {
    return <ScenePlayer scene={currentScene} onChoiceSelect={handleChoice} score={totalScore} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">씬을 찾을 수 없습니다.</p>
    </div>
  );
}
