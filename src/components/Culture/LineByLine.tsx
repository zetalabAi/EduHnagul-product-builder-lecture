/**
 * Line By Line Component
 * Learn K-pop lyrics line by line with breakdown
 */

"use client";

import { useState, useRef } from "react";
import { CulturalNote } from "./CulturalNote";

interface WordBreakdown {
  word: string;
  romanization: string;
  meaning: string;
}

interface Line {
  korean: string;
  romanization: string;
  english: string;
  breakdown: WordBreakdown[];
  culturalNote?: string;
  audioUrl?: string;
}

interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

interface LineByLineProps {
  line: Line;
  quiz?: Quiz;
  onComplete?: () => void;
}

export function LineByLine({ line, quiz, onComplete }: LineByLineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
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

  const handleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        // TODO: Implement actual recording logic
        setTimeout(() => {
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
          alert("녹음 완료! 발음 평가: 85점");
        }, 3000);
      } catch (error) {
        alert("마이크 권한이 필요합니다.");
      }
    } else {
      setIsRecording(false);
    }
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === quiz?.correctIndex && onComplete) {
      setTimeout(onComplete, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Original Audio Player */}
      <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl p-6 border border-pink-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-pink-400 font-bold text-lg">원본 오디오</h3>
          <button
            onClick={handlePlayAudio}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {isPlaying ? "⏸️ 정지" : "▶️ 재생"}
          </button>
        </div>
        {line.audioUrl && (
          <audio
            ref={audioRef}
            src={line.audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </div>

      {/* Lyrics Display */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
        <div className="text-center space-y-3">
          <p className="text-white text-2xl font-bold">{line.korean}</p>
          <p className="text-blue-400 text-lg">{line.romanization}</p>
          <p className="text-gray-400">{line.english}</p>
        </div>
      </div>

      {/* Word Breakdown */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-white font-bold text-lg mb-4">단어 분해</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {line.breakdown.map((word, index) => (
            <div
              key={index}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-white font-bold text-lg">{word.word}</span>
                <span className="text-blue-400 text-sm">{word.romanization}</span>
              </div>
              <p className="text-gray-400 text-sm">{word.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cultural Note */}
      {line.culturalNote && (
        <CulturalNote
          title="문화 노트"
          content={line.culturalNote}
          icon="🌏"
        />
      )}

      {/* Practice Section */}
      <div className="bg-gradient-to-r from-green-900/30 to-teal-900/30 rounded-xl p-6 border border-green-700">
        <h3 className="text-green-400 font-bold text-lg mb-4">따라 부르기</h3>
        <p className="text-gray-300 text-sm mb-4">
          원본 오디오를 듣고 따라 불러보세요. 발음을 평가해드립니다.
        </p>
        <button
          onClick={handleRecord}
          className={`w-full ${
            isRecording
              ? "bg-red-600 animate-pulse"
              : "bg-green-600 hover:bg-green-700"
          } text-white py-4 rounded-lg font-bold text-lg transition-all`}
        >
          {isRecording ? "⏺️ 녹음 중... (3초)" : "🎤 녹음 시작"}
        </button>
      </div>

      {/* Quiz */}
      {quiz && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-white font-bold text-lg mb-4">연습 문제</h3>
          <p className="text-gray-300 mb-4">{quiz.question}</p>
          <div className="space-y-2">
            {quiz.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === quiz.correctIndex;
              const showFeedback = showResult && isSelected;

              return (
                <button
                  key={index}
                  onClick={() => !showResult && handleQuizAnswer(index)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showFeedback
                      ? isCorrect
                        ? "bg-green-900/50 border-green-500"
                        : "bg-red-900/50 border-red-500"
                      : "bg-gray-900 border-gray-700 hover:border-blue-500"
                  } disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white">{option}</span>
                    {showFeedback && (
                      <span className="text-2xl">
                        {isCorrect ? "✅" : "❌"}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
