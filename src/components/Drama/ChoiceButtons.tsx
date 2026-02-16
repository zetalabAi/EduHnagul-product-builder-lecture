/**
 * Choice Buttons Component
 * Display dialogue choices with difficulty indicators
 */

"use client";

interface Choice {
  id: string;
  text: string;
  difficulty?: "easy" | "medium" | "hard";
  points?: number;
  correctness?: number;
}

interface ChoiceButtonsProps {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
}

const DIFFICULTY_COLORS = {
  easy: "from-green-600 to-green-700",
  medium: "from-yellow-600 to-yellow-700",
  hard: "from-red-600 to-red-700",
};

const DIFFICULTY_LABELS = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

export function ChoiceButtons({ choices, onSelect, disabled = false }: ChoiceButtonsProps) {
  return (
    <div className="space-y-3">
      {choices.map((choice, index) => (
        <button
          key={choice.id}
          onClick={() => onSelect(choice.id)}
          disabled={disabled}
          className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-left p-4 rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Choice Number */}
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <p className="text-white text-base leading-relaxed group-hover:text-blue-400 transition-colors">
                  {choice.text}
                </p>
              </div>
            </div>

            {/* Difficulty Badge */}
            {choice.difficulty && (
              <div className="ml-3 flex-shrink-0">
                <span
                  className={`bg-gradient-to-r ${DIFFICULTY_COLORS[choice.difficulty]} text-white text-xs px-2 py-1 rounded-full`}
                >
                  {DIFFICULTY_LABELS[choice.difficulty]}
                </span>
              </div>
            )}
          </div>

          {/* Points Preview */}
          {choice.points !== undefined && (
            <div className="mt-2 text-yellow-400 text-sm flex items-center space-x-1">
              <span>⭐</span>
              <span>+{choice.points} 점</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
