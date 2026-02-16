/**
 * K-pop Learning Page
 * Learn K-pop songs line by line or karaoke mode
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LineByLine } from "@/components/Culture/LineByLine";
import { KaraokeMode } from "@/components/Culture/KaraokeMode";

type TabType = "lineByLine" | "karaoke";

export default function KpopLearningPage() {
  const params = useParams();
  const { user } = useAuth();
  const songId = params.songId as string;

  const [activeTab, setActiveTab] = useState<TabType>("lineByLine");
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [songData, setSongData] = useState<any>(null);

  useEffect(() => {
    // Mock data - replace with actual API call
    setSongData({
      title: "Dynamite",
      artist: "BTS",
      lines: [
        {
          korean: "'Cause I, I, I'm in the stars tonight",
          romanization: "Cause I, I, I'm in the stars tonight",
          english: "왜냐하면 나는 오늘 밤 별들 속에 있으니까",
          breakdown: [
            { word: "stars", romanization: "stars", meaning: "별들" },
            { word: "tonight", romanization: "tonight", meaning: "오늘 밤" },
          ],
          culturalNote: "이 노래는 BTS의 첫 전곡 영어 싱글입니다.",
        },
      ],
      lyrics: [
        { time: 0, korean: "'Cause I, I, I'm in the stars tonight", romanization: "Cause I, I, I'm in the stars tonight", duration: 3 },
      ],
    });
  }, [songId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">로그인이 필요합니다.</p>
      </div>
    );
  }

  if (!songData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {activeTab === "lineByLine" ? (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{songData.title}</h1>
            <p className="text-gray-400">{songData.artist}</p>
          </div>

          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab("lineByLine")}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium"
            >
              📖 한 줄씩 배우기
            </button>
            <button
              onClick={() => setActiveTab("karaoke")}
              className="flex-1 bg-gray-800 text-gray-400 hover:text-white py-3 rounded-lg font-medium transition-colors"
            >
              🎤 노래방 모드
            </button>
          </div>

          <LineByLine
            line={songData.lines[currentLineIndex]}
            onComplete={() => setCurrentLineIndex((i) => i + 1)}
          />
        </div>
      ) : (
        <KaraokeMode
          songTitle={songData.title}
          artist={songData.artist}
          audioUrl="/audio/sample.mp3"
          lyrics={songData.lyrics}
          onComplete={(score) => alert(`점수: ${score}점`)}
        />
      )}
    </div>
  );
}
