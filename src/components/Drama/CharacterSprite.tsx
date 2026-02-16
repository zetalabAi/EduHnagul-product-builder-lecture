/**
 * Character Sprite Component
 * Display character illustration with emotions
 */

"use client";

import { useEffect, useState } from "react";

interface CharacterSpriteProps {
  character: string;
  emotion?: "happy" | "sad" | "surprised" | "angry" | "neutral";
  imageUrl?: string;
  position?: "left" | "center" | "right";
  visible?: boolean;
}

const EMOTION_FILTERS = {
  happy: "brightness(1.2) saturate(1.3)",
  sad: "brightness(0.8) saturate(0.7)",
  surprised: "brightness(1.1) contrast(1.2)",
  angry: "hue-rotate(15deg) saturate(1.5)",
  neutral: "none",
};

const POSITION_STYLES = {
  left: "left-0 -translate-x-4",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0 translate-x-4",
};

export function CharacterSprite({
  character,
  emotion = "neutral",
  imageUrl,
  position = "center",
  visible = true,
}: CharacterSpriteProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`absolute bottom-0 ${POSITION_STYLES[position]} transition-all duration-500 ${
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className="relative">
        {/* Character Image */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={character}
            className="h-96 w-auto object-contain transition-all duration-300"
            style={{
              filter: EMOTION_FILTERS[emotion],
            }}
          />
        ) : (
          // Placeholder
          <div className="h-96 w-64 bg-gradient-to-t from-gray-800 to-gray-700 rounded-t-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">👤</div>
              <p className="text-white font-bold">{character}</p>
            </div>
          </div>
        )}

        {/* Character Name Tag */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-2 bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700">
          <p className="text-white font-medium whitespace-nowrap">{character}</p>
        </div>

        {/* Emotion Indicator */}
        {emotion !== "neutral" && (
          <div className="absolute top-4 right-4 animate-bounce">
            {emotion === "happy" && <span className="text-4xl">😊</span>}
            {emotion === "sad" && <span className="text-4xl">😢</span>}
            {emotion === "surprised" && <span className="text-4xl">😮</span>}
            {emotion === "angry" && <span className="text-4xl">😠</span>}
          </div>
        )}
      </div>
    </div>
  );
}
