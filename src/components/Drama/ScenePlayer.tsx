/**
 * Scene Player Component
 * Main drama scene player with dialogue and choices
 */

"use client";

import { useState, useEffect } from "react";
import { DialogueBox } from "./DialogueBox";
import { ChoiceButtons } from "./ChoiceButtons";
import { CharacterSprite } from "./CharacterSprite";

interface Scene {
  id: string;
  background?: string;
  dialogue: {
    character: string;
    text: string;
    emotion?: "happy" | "sad" | "surprised" | "angry" | "neutral";
    audioUrl?: string;
  }[];
  choices?: {
    id: string;
    text: string;
    difficulty?: "easy" | "medium" | "hard";
    points?: number;
    nextScene?: string;
  }[];
}

interface ScenePlayerProps {
  scene: Scene;
  onChoiceSelect: (choiceId: string) => void;
  score: number;
}

export function ScenePlayer({ scene, onChoiceSelect, score }: ScenePlayerProps) {
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const currentDialogue = scene.dialogue[currentDialogueIndex];
  const isLastDialogue = currentDialogueIndex === scene.dialogue.length - 1;

  useEffect(() => {
    // Reset when scene changes
    setCurrentDialogueIndex(0);
    setShowChoices(false);
  }, [scene.id]);

  const handleNext = () => {
    if (isLastDialogue) {
      if (scene.choices && scene.choices.length > 0) {
        setShowChoices(true);
      } else {
        // No choices, scene ends
        onChoiceSelect("continue");
      }
    } else {
      setCurrentDialogueIndex(currentDialogueIndex + 1);
    }
  };

  const handleChoiceSelect = (choiceId: string) => {
    onChoiceSelect(choiceId);
    setShowChoices(false);
    setCurrentDialogueIndex(0);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-950">
      {/* Background */}
      <div className="absolute inset-0">
        {scene.background ? (
          <img
            src={scene.background}
            alt="Background"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-blue-950 via-purple-950 to-gray-950" />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Character Sprite */}
      <CharacterSprite
        character={currentDialogue.character}
        emotion={currentDialogue.emotion}
        position="center"
        visible={true}
      />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="text-white hover:text-gray-300 text-2xl"
            >
              ⬅️
            </button>
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-white font-bold">점수: {score}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`${
              isAutoPlay ? "bg-blue-600" : "bg-gray-100"
            } text-white px-4 py-2 rounded-lg transition-colors`}
          >
            {isAutoPlay ? "⏸️ 자동" : "▶️ 수동"}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-20 left-4 right-4">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{
              width: `${((currentDialogueIndex + 1) / scene.dialogue.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Dialogue Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        {!showChoices ? (
          <DialogueBox
            speaker={currentDialogue.character}
            text={currentDialogue.text}
            audioUrl={currentDialogue.audioUrl}
            onNext={handleNext}
            autoPlay={isAutoPlay}
          />
        ) : (
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-bold text-lg mb-2">어떻게 대답하시겠습니까?</h3>
              <p className="text-gray-400 text-sm">선택지를 선택하세요</p>
            </div>
            {scene.choices && (
              <ChoiceButtons
                choices={scene.choices}
                onSelect={handleChoiceSelect}
              />
            )}
          </div>
        )}
      </div>

      {/* Skip Button */}
      {!showChoices && (
        <button
          onClick={handleNext}
          className="absolute right-6 bottom-32 bg-white/80 hover:bg-gray-100 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ⏭️ 스킵
        </button>
      )}
    </div>
  );
}
