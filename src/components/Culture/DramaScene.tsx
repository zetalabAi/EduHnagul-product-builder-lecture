/**
 * Drama Scene Component
 * Learn from K-drama scenes with cultural context
 */

"use client";

import { useState } from "react";
import { CulturalNote } from "./CulturalNote";

interface DialogueLine {
  character: string;
  korean: string;
  romanization: string;
  english: string;
  tone: string;
  culturalNote?: string;
}

interface DramaSceneProps {
  drama: string;
  episode: number;
  scene: string;
  videoUrl?: string;
  dialogues: DialogueLine[];
  culturalInsights: string[];
}

type ModeType = "watch" | "roleplay";

export function DramaScene({
  drama,
  episode,
  scene,
  videoUrl,
  dialogues,
  culturalInsights,
}: DramaSceneProps) {
  const [mode, setMode] = useState<ModeType>("watch");
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [userRole, setUserRole] = useState(0); // Which character user plays

  const currentDialogue = dialogues[currentDialogueIndex];
  const isUserTurn = mode === "roleplay" && currentDialogueIndex % 2 === userRole;

  const handleNext = () => {
    if (currentDialogueIndex < dialogues.length - 1) {
      setCurrentDialogueIndex(currentDialogueIndex + 1);
    } else {
      setCurrentDialogueIndex(0);
    }
  };

  const handleRecord = async () => {
    // TODO: Implement voice recording and analysis
    alert("녹음 기능 구현 예정");
    handleNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-xl p-6 border border-red-700">
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-3xl">📺</span>
          <div>
            <h2 className="text-red-400 font-bold text-xl">{drama}</h2>
            <p className="text-gray-400 text-sm">
              에피소드 {episode} · {scene}
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-2">
        <button
          onClick={() => setMode("watch")}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            mode === "watch"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-400 hover:text-white"
          }`}
        >
          👁️ 보기 모드
        </button>
        <button
          onClick={() => setMode("roleplay")}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            mode === "roleplay"
              ? "bg-purple-600 text-white"
              : "bg-white text-gray-400 hover:text-white"
          }`}
        >
          🎭 역할극 모드
        </button>
      </div>

      {/* Video Player (Watch Mode) */}
      {mode === "watch" && videoUrl && (
        <div className="bg-black rounded-xl overflow-hidden">
          <video
            controls
            className="w-full aspect-video"
            src={videoUrl}
          >
            동영상을 재생할 수 없습니다.
          </video>
        </div>
      )}

      {/* Dialogue Display */}
      <div className="bg-white rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">대사 ({currentDialogueIndex + 1}/{dialogues.length})</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentDialogueIndex(Math.max(0, currentDialogueIndex - 1))}
              disabled={currentDialogueIndex === 0}
              className="text-gray-400 hover:text-white disabled:opacity-30"
            >
              ⬅️
            </button>
            <button
              onClick={() => setCurrentDialogueIndex(Math.min(dialogues.length - 1, currentDialogueIndex + 1))}
              disabled={currentDialogueIndex === dialogues.length - 1}
              className="text-gray-400 hover:text-white disabled:opacity-30"
            >
              ➡️
            </button>
          </div>
        </div>

        <div className={`space-y-4 ${isUserTurn ? "bg-blue-900/20 p-4 rounded-lg border-2 border-blue-500" : ""}`}>
          {/* Character & Tone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👤</span>
              <span className="text-white font-bold">{currentDialogue.character}</span>
            </div>
            <span className="bg-purple-700 text-white px-3 py-1 rounded-full text-xs">
              {currentDialogue.tone}
            </span>
          </div>

          {/* Korean Text */}
          <p className="text-white text-2xl font-medium">{currentDialogue.korean}</p>

          {/* Romanization */}
          <p className="text-blue-400 text-lg">{currentDialogue.romanization}</p>

          {/* English Translation */}
          <p className="text-gray-400">{currentDialogue.english}</p>

          {/* Cultural Note */}
          {currentDialogue.culturalNote && (
            <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
              <p className="text-purple-400 text-sm">{currentDialogue.culturalNote}</p>
            </div>
          )}
        </div>

        {/* Roleplay Controls */}
        {mode === "roleplay" && isUserTurn && (
          <div className="mt-4 space-y-3">
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3">
              <p className="text-blue-400 font-medium text-center">
                🎤 당신의 차례입니다! 위 대사를 따라 말해보세요.
              </p>
            </div>
            <button
              onClick={handleRecord}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors"
            >
              🎤 녹음하기
            </button>
          </div>
        )}

        {/* Watch Mode Continue */}
        {mode === "watch" && (
          <button
            onClick={handleNext}
            className="w-full mt-4 bg-gray-100 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
          >
            다음 대사 ▶️
          </button>
        )}
      </div>

      {/* Cultural Insights */}
      <div className="space-y-3">
        <h3 className="text-white font-bold text-lg">문화 인사이트</h3>
        {culturalInsights.map((insight, index) => (
          <CulturalNote
            key={index}
            title={`인사이트 ${index + 1}`}
            content={insight}
            icon="🎬"
          />
        ))}
      </div>
    </div>
  );
}
