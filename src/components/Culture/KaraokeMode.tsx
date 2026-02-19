/**
 * Karaoke Mode Component
 * Sing along with K-pop songs with real-time lyrics
 */

"use client";

import { useState, useRef, useEffect } from "react";

interface LyricLine {
  time: number; // seconds
  korean: string;
  romanization: string;
  duration: number;
}

interface KaraokeModeProps {
  songTitle: string;
  artist: string;
  backgroundUrl?: string;
  audioUrl: string;
  lyrics: LyricLine[];
  onComplete?: (score: number) => void;
}

export function KaraokeMode({
  songTitle,
  artist,
  backgroundUrl,
  audioUrl,
  lyrics,
  onComplete,
}: KaraokeModeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [lineScores, setLineScores] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const currentLineIndex = lyrics.findIndex(
    (line, index) =>
      currentTime >= line.time &&
      (index === lyrics.length - 1 || currentTime < lyrics[index + 1].time)
  );

  const currentLine = lyrics[currentLineIndex];
  const nextLine = lyrics[currentLineIndex + 1];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("timeupdate", updateTime);
    return () => audio.removeEventListener("timeupdate", updateTime);
  }, []);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      stopRecording();
    } else {
      audio.play();
      setIsPlaying(true);
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        // TODO: Send to backend for analysis
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSongEnd = () => {
    setIsPlaying(false);
    stopRecording();

    // Calculate average score
    const avgScore = lineScores.length > 0
      ? Math.round(lineScores.reduce((a, b) => a + b, 0) / lineScores.length)
      : 0;

    if (onComplete) {
      onComplete(avgScore);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-yellow-400";
    if (score >= 80) return "text-green-400";
    if (score >= 70) return "text-blue-400";
    return "text-gray-400";
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950">
      {/* Background */}
      <div className="absolute inset-0">
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt="Background"
            className="w-full h-full object-cover opacity-30 blur-sm"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-pink-950 via-purple-950 to-gray-950" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-black/70 to-transparent">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              {songTitle}
            </h1>
            <p className="text-gray-400 mt-1">{artist}</p>
          </div>
        </div>

        {/* Lyrics Display */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
          {/* Current Line */}
          {currentLine && (
            <div className="text-center space-y-4 animate-fadeIn">
              <p className="text-white text-5xl font-bold drop-shadow-lg">
                {currentLine.korean}
              </p>
              <p className="text-blue-400 text-3xl drop-shadow-lg">
                {currentLine.romanization}
              </p>
            </div>
          )}

          {/* Next Line Preview */}
          {nextLine && (
            <div className="text-center space-y-2 opacity-50">
              <p className="text-white text-2xl">{nextLine.korean}</p>
              <p className="text-blue-400 text-xl">{nextLine.romanization}</p>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="flex items-center space-x-2 animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-400 font-medium">녹음 중</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-gradient-to-t from-black/70 to-transparent">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                style={{
                  width: `${(currentTime / (audioRef.current?.duration || 1)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-gray-400 text-sm mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(audioRef.current?.duration || 0)}</span>
            </div>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-4 rounded-lg font-bold text-xl transition-all transform hover:scale-105"
          >
            {isPlaying ? "⏸️ 일시정지" : "▶️ 시작"}
          </button>

          {/* Score Display */}
          {lineScores.length > 0 && (
            <div className="mt-4 bg-white/80 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">현재 평균 점수</span>
                <span className={`text-2xl font-bold ${getScoreColor(
                  Math.round(lineScores.reduce((a, b) => a + b, 0) / lineScores.length)
                )}`}>
                  {Math.round(lineScores.reduce((a, b) => a + b, 0) / lineScores.length)}점
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleSongEnd}
        className="hidden"
      />
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
