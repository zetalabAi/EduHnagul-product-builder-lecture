"use client";

import { ChatSettings, Persona, ResponseStyle, CorrectionStrength, FormalityLevel } from "@/types";

interface SettingsPanelProps {
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
  onTranslateUser: () => void;
  onTranslateAssistant: () => void;
}

export default function SettingsPanel({
  settings,
  onSettingsChange,
  onTranslateUser,
  onTranslateAssistant,
}: SettingsPanelProps) {
  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 h-screen overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize your learning experience
          </p>
        </div>

        {/* Persona Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Persona
          </label>
          <select
            value={settings.persona}
            onChange={(e) =>
              onSettingsChange({ ...settings, persona: e.target.value as Persona })
            }
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-800 dark:text-gray-200"
          >
            <option value="same-sex-friend">Same-sex Friend</option>
            <option value="opposite-sex-friend">Opposite-sex Friend</option>
            <option value="boyfriend">Boyfriend</option>
            <option value="girlfriend">Girlfriend</option>
          </select>
        </div>

        {/* Response Style */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Response Style
          </label>
          <select
            value={settings.responseStyle}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                responseStyle: e.target.value as ResponseStyle,
              })
            }
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-800 dark:text-gray-200"
          >
            <option value="empathetic">Empathetic</option>
            <option value="balanced">Balanced</option>
            <option value="blunt">Blunt</option>
          </select>
        </div>

        {/* Correction Strength */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Correction Strength
          </label>
          <select
            value={settings.correctionStrength}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                correctionStrength: e.target.value as CorrectionStrength,
              })
            }
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-800 dark:text-gray-200"
          >
            <option value="minimal">Minimal</option>
            <option value="strict">Strict</option>
          </select>
        </div>

        {/* Formality Level */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Formality Level 🔥
          </label>
          <select
            value={settings.formalityLevel}
            onChange={(e) =>
              onSettingsChange({
                ...settings,
                formalityLevel: e.target.value as FormalityLevel,
              })
            }
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-800 dark:text-gray-200"
          >
            <option value="formal">📋 정중하게 (Formal)</option>
            <option value="polite">🙂 존댓말 (Polite)</option>
            <option value="casual">😊 친구처럼 (Casual)</option>
            <option value="intimate">🔥 편하게 (Intimate)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {settings.formalityLevel === "formal" && "Professional, respectful speech"}
            {settings.formalityLevel === "polite" && "Standard polite Korean"}
            {settings.formalityLevel === "casual" && "Friendly conversation"}
            {settings.formalityLevel === "intimate" && "Real slang & natural speech"}
          </p>
        </div>

        {/* Translation Buttons */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Translation
          </label>
          <div className="space-y-2">
            <button
              onClick={onTranslateUser}
              className="w-full px-4 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-100 rounded-lg font-medium transition-colors text-sm"
            >
              Translate Last User Message
            </button>
            <button
              onClick={onTranslateAssistant}
              className="w-full px-4 py-2 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-900 dark:text-green-100 rounded-lg font-medium transition-colors text-sm"
            >
              Translate Last AI Message
            </button>
          </div>
        </div>

        {/* Memory Card (Mock) */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            📝 Memory Card
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Your learning progress and preferences will be tracked here.
          </p>
          <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-500">
            <div>• Words learned: 0</div>
            <div>• Sessions: 0</div>
            <div>• Corrections: 0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
