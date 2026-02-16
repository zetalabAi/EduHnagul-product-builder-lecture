/**
 * Mistake Warning Component
 * Display cultural mistake warnings with severity levels
 */

"use client";

interface MistakeWarningProps {
  level: "low" | "medium" | "high" | "critical";
  message: string;
}

const WARNING_CONFIG = {
  low: {
    icon: "⚡",
    bgColor: "bg-yellow-900/20",
    borderColor: "border-yellow-600",
    textColor: "text-yellow-400",
    label: "주의",
  },
  medium: {
    icon: "⚠️",
    bgColor: "bg-orange-900/20",
    borderColor: "border-orange-600",
    textColor: "text-orange-400",
    label: "경고",
  },
  high: {
    icon: "🚨",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-600",
    textColor: "text-red-400",
    label: "높음",
  },
  critical: {
    icon: "🔴",
    bgColor: "bg-red-900/40",
    borderColor: "border-red-500",
    textColor: "text-red-300",
    label: "심각",
  },
};

export function MistakeWarning({ level, message }: MistakeWarningProps) {
  const config = WARNING_CONFIG[level];

  return (
    <div
      className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-4`}
    >
      <div className="flex items-start space-x-3">
        <span className="text-3xl flex-shrink-0">{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`${config.textColor} font-bold text-sm uppercase`}>
              {config.label}
            </span>
          </div>
          <p className={`${config.textColor} leading-relaxed`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
