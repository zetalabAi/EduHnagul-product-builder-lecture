/**
 * Cultural Note Component
 * Collapsible cultural insight box
 */

"use client";

import { useState } from "react";

interface CulturalNoteProps {
  title: string;
  content: string;
  icon?: string;
}

export function CulturalNote({ title, content, icon = "💡" }: CulturalNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-purple-900/20 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-purple-400 font-semibold">{title}</h3>
        </div>
        <span className="text-purple-400 text-xl">
          {isExpanded ? "−" : "+"}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-purple-700/50">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}
