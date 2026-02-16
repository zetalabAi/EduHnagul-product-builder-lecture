"use client";

import { memo, useState } from "react";
import { LearningStyle, StyleQuestion } from "@/types/onboarding";

interface StyleQuizProps {
  onNext: (data: { learningStyle: LearningStyle }) => void;
}

const questions: StyleQuestion[] = [
  {
    id: 1,
    question: "새로운 단어를 배울 때 어떤 방법이 가장 좋나요?",
    options: [
      { style: "visual", text: "그림/이미지로 보기", icon: "👁️" },
      { style: "auditory", text: "소리내서 읽기", icon: "👂" },
      { style: "reading", text: "글로 쓰면서 익히기", icon: "📝" },
      { style: "kinesthetic", text: "게임/퀴즈로 연습", icon: "🎮" },
    ],
  },
  {
    id: 2,
    question: "설명을 들을 때 어떤 방식이 편한가요?",
    options: [
      { style: "visual", text: "다이어그램과 차트", icon: "📊" },
      { style: "auditory", text: "음성 설명", icon: "🔊" },
      { style: "reading", text: "글로 된 설명", icon: "📄" },
      { style: "kinesthetic", text: "직접 해보면서 배우기", icon: "🤚" },
    ],
  },
  {
    id: 3,
    question: "무언가를 기억할 때 가장 잘 떠오르는 것은?",
    options: [
      { style: "visual", text: "본 것 (이미지, 색상)", icon: "🎨" },
      { style: "auditory", text: "들은 것 (소리, 리듬)", icon: "🎵" },
      { style: "reading", text: "읽은 것 (텍스트, 글)", icon: "📖" },
      { style: "kinesthetic", text: "한 것 (경험, 행동)", icon: "✨" },
    ],
  },
];

/**
 * StyleQuiz Component - Step 4
 * VARK learning style assessment
 */
const StyleQuiz = memo(function StyleQuiz({ onNext }: StyleQuizProps) {
  const [answers, setAnswers] = useState<Record<number, LearningStyle>>({});

  const calculateStyle = (): LearningStyle => {
    const counts: Record<LearningStyle, number> = {
      visual: 0,
      auditory: 0,
      reading: 0,
      kinesthetic: 0,
    };

    Object.values(answers).forEach((style) => {
      counts[style]++;
    });

    const dominant = (
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0] as [
        LearningStyle,
        number
      ]
    )[0];

    return dominant;
  };

  const handleAnswer = (questionId: number, style: LearningStyle) => {
    setAnswers({ ...answers, [questionId]: style });
  };

  const handleNext = () => {
    if (Object.keys(answers).length < questions.length) {
      alert("모든 질문에 답해주세요.");
      return;
    }

    const learningStyle = calculateStyle();
    onNext({ learningStyle });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          학습 스타일 찾기
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          당신에게 가장 잘 맞는 학습 방법을 찾아드릴게요
        </p>
      </div>

      <div className="space-y-8 mb-8">
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {q.id}. {q.question}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.options.map((opt) => (
                <button
                  key={opt.style}
                  onClick={() => handleAnswer(q.id, opt.style)}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300
                    ${
                      answers[q.id] === opt.style
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary-300"
                    }
                  `}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleNext}
          disabled={Object.keys(answers).length < questions.length}
          className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>

      <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
        {Object.keys(answers).length} / {questions.length} 완료
      </div>
    </div>
  );
});

export default StyleQuiz;
