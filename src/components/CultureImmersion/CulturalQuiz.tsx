/**
 * Cultural Quiz Component
 * Test cultural knowledge with interactive quiz
 */

"use client";

import { useState } from "react";

interface QuizOption {
  text: string;
  correct: boolean;
  feedback: string;
}

interface Quiz {
  question: string;
  options: QuizOption[];
}

interface CulturalQuizProps {
  quizzes: Quiz[];
  onComplete?: (score: number) => void;
}

export function CulturalQuiz({ quizzes, onComplete }: CulturalQuizProps) {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQuiz = quizzes[currentQuizIndex];
  const isLastQuiz = currentQuizIndex === quizzes.length - 1;

  const handleSelectOption = (index: number) => {
    if (showFeedback) return;

    setSelectedOption(index);
    setShowFeedback(true);

    if (currentQuiz.options[index].correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuiz) {
      setCompleted(true);
      if (onComplete) {
        onComplete((score / quizzes.length) * 100);
      }
    } else {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    const percentage = (score / quizzes.length) * 100;

    return (
      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-8 border border-purple-700 text-center">
        <div className="text-6xl mb-4">
          {percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : "📚"}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">퀴즈 완료!</h3>
        <p className="text-gray-300 mb-6">
          {quizzes.length}문제 중 {score}문제 정답
        </p>
        <div className="text-5xl font-bold text-purple-400 mb-6">
          {Math.round(percentage)}점
        </div>
        <div className="space-y-3">
          {percentage >= 80 && (
            <p className="text-green-400">훌륭합니다! 문화적 이해도가 높습니다!</p>
          )}
          {percentage >= 60 && percentage < 80 && (
            <p className="text-yellow-400">좋아요! 조금만 더 연습하면 완벽해요!</p>
          )}
          {percentage < 60 && (
            <p className="text-orange-400">다시 한번 학습해보세요!</p>
          )}
        </div>
        <button
          onClick={handleRetry}
          className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold transition-colors"
        >
          다시 풀기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg">문화 퀴즈</h3>
        <span className="text-gray-400 text-sm">
          {currentQuizIndex + 1} / {quizzes.length}
        </span>
      </div>

      <div className="h-2 bg-gray-700 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{
            width: `${((currentQuizIndex + 1) / quizzes.length) * 100}%`,
          }}
        />
      </div>

      {/* Question */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <p className="text-white text-lg leading-relaxed">{currentQuiz.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentQuiz.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const showCorrect = showFeedback && option.correct;
          const showWrong = showFeedback && isSelected && !option.correct;

          return (
            <button
              key={index}
              onClick={() => handleSelectOption(index)}
              disabled={showFeedback}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                showCorrect
                  ? "bg-green-900/50 border-green-500"
                  : showWrong
                  ? "bg-red-900/50 border-red-500"
                  : isSelected
                  ? "bg-blue-900/50 border-blue-500"
                  : "bg-gray-900 border-gray-700 hover:border-gray-600"
              } disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white">{option.text}</span>
                {showFeedback && (
                  <span className="text-2xl">
                    {option.correct ? "✅" : isSelected ? "❌" : ""}
                  </span>
                )}
              </div>

              {showFeedback && isSelected && (
                <p
                  className={`mt-2 text-sm ${
                    option.correct ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {option.feedback}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      {showFeedback && (
        <button
          onClick={handleNext}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-colors"
        >
          {isLastQuiz ? "결과 보기" : "다음 문제"}
        </button>
      )}
    </div>
  );
}
