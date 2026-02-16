/**
 * Dialogue Box Component
 * Display character dialogue with audio playback
 */

"use client";

import { useState, useRef } from "react";

interface DialogueBoxProps {
  speaker: string;
  text: string;
  audioUrl?: string;
  onNext?: () => void;
  autoPlay?: boolean;
}

export function DialogueBox({
  speaker,
  text,
  audioUrl,
  onNext,
  autoPlay = false,
}: DialogueBoxProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (autoPlay && onNext) {
      setTimeout(onNext, 500);
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-2xl">
      {/* Speaker Name */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="text-blue-400 font-bold text-lg">{speaker}</h3>
        </div>

        {/* Audio Button */}
        {audioUrl && (
          <button
            onClick={handlePlayAudio}
            className="text-2xl hover:scale-110 transition-transform"
          >
            {isPlaying ? "⏸️" : "🔊"}
          </button>
        )}
      </div>

      {/* Dialogue Text */}
      <p className="text-white text-lg leading-relaxed mb-4">{text}</p>

      {/* Continue Button */}
      {onNext && !autoPlay && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="text-gray-400 hover:text-white text-sm transition-colors flex items-center space-x-1"
          >
            <span>계속</span>
            <span>▶️</span>
          </button>
        </div>
      )}

      {/* Hidden Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}
    </div>
  );
}
