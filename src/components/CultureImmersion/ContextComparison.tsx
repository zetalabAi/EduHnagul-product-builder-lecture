/**
 * Context Comparison Component
 * Compare right vs wrong cultural approaches
 */

"use client";

import { useState } from "react";
import { MistakeWarning } from "./MistakeWarning";

interface Way {
  dialogue: string;
  explanation: string;
  tone?: string;
  warning?: string;
  awkwardness?: "low" | "medium" | "high" | "critical";
}

interface ContextComparisonProps {
  situation: string;
  characters: string[];
  wrongWay: Way;
  rightWay: Way;
  culturalNote?: string;
  alternatives?: string[];
}

export function ContextComparison({
  situation,
  characters,
  wrongWay,
  rightWay,
  culturalNote,
  alternatives,
}: ContextComparisonProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  return (
    <div className="space-y-6">
      {/* Situation Context */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-lg p-6 border border-orange-700">
        <h3 className="text-orange-400 font-bold text-lg mb-3">📍 상황</h3>
        <p className="text-white text-lg mb-3">{situation}</p>
        <div className="flex flex-wrap gap-2">
          {characters.map((char, index) => (
            <span
              key={index}
              className="bg-orange-700 text-white px-3 py-1 rounded-full text-sm"
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wrong Way */}
        <div className="bg-red-900/20 rounded-xl p-6 border-2 border-red-600">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-3xl">❌</span>
            <h4 className="text-red-400 font-bold text-xl">잘못된 방법</h4>
          </div>

          {/* Dialogue */}
          <div className="bg-white/50 rounded-lg p-4 mb-4">
            <p className="text-white text-lg mb-2">"{wrongWay.dialogue}"</p>
            {wrongWay.tone && (
              <span className="text-red-400 text-sm">톤: {wrongWay.tone}</span>
            )}
          </div>

          {/* Explanation */}
          <div className="mb-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              {wrongWay.explanation}
            </p>
          </div>

          {/* Warning */}
          {wrongWay.warning && wrongWay.awkwardness && (
            <MistakeWarning level={wrongWay.awkwardness} message={wrongWay.warning} />
          )}
        </div>

        {/* Right Way */}
        <div className="bg-green-900/20 rounded-xl p-6 border-2 border-green-600">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-3xl">✅</span>
            <h4 className="text-green-400 font-bold text-xl">올바른 방법</h4>
          </div>

          {/* Dialogue */}
          <div className="bg-white/50 rounded-lg p-4 mb-4">
            <p className="text-white text-lg mb-2">"{rightWay.dialogue}"</p>
            {rightWay.tone && (
              <span className="text-green-400 text-sm">톤: {rightWay.tone}</span>
            )}
          </div>

          {/* Explanation */}
          <div className="mb-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              {rightWay.explanation}
            </p>
          </div>

          {/* Positive Indicator */}
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
            <p className="text-green-400 text-sm">
              ✓ 문화적으로 적절한 표현입니다
            </p>
          </div>
        </div>
      </div>

      {/* Cultural Note */}
      {culturalNote && (
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-2xl">💡</span>
            <h4 className="text-purple-400 font-bold">문화 노트</h4>
          </div>
          <p className="text-gray-300 leading-relaxed">{culturalNote}</p>
        </div>
      )}

      {/* Alternatives */}
      {alternatives && alternatives.length > 0 && (
        <div>
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full bg-white hover:bg-gray-100 text-white py-3 px-4 rounded-lg flex items-center justify-between transition-colors"
          >
            <span className="font-medium">다른 표현 방법 보기</span>
            <span>{showAlternatives ? "▲" : "▼"}</span>
          </button>

          {showAlternatives && (
            <div className="mt-3 bg-white rounded-lg p-4 space-y-2">
              {alternatives.map((alt, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-3 border border-gray-700"
                >
                  <p className="text-white">"{alt}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
