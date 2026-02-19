/**
 * Sync Indicator Component
 * Show synchronization status between original and user audio
 */

"use client";

interface SyncIndicatorProps {
  targetDelay: number; // ms
  actualDelay: number; // ms
}

export function SyncIndicator({ targetDelay, actualDelay }: SyncIndicatorProps) {
  const diff = Math.abs(targetDelay - actualDelay);

  const getStatus = () => {
    if (diff <= 100) return { color: "text-green-400 bg-green-900/30 border-green-500", label: "완벽한 동기화", icon: "✅" };
    if (diff <= 300) return { color: "text-yellow-400 bg-yellow-900/30 border-yellow-500", label: "약간 어긋남", icon: "⚠️" };
    return { color: "text-red-400 bg-red-900/30 border-red-500", label: "많이 어긋남", icon: "❌" };
  };

  const status = getStatus();
  const isFast = actualDelay < targetDelay;

  return (
    <div className={`${status.color} border-2 rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{status.icon}</span>
          <span className="font-bold">{status.label}</span>
        </div>
        <span className="text-sm opacity-80">
          {isFast ? "너무 빠름" : actualDelay > targetDelay ? "너무 느림" : "정확"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="opacity-70 mb-1">목표 딜레이</p>
          <p className="font-bold text-lg">{targetDelay}ms</p>
        </div>
        <div>
          <p className="opacity-70 mb-1">실제 딜레이</p>
          <p className="font-bold text-lg">{actualDelay}ms</p>
        </div>
      </div>

      {/* Visual Indicator */}
      <div className="mt-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
          <div
            className="absolute inset-y-0 bg-white/30"
            style={{
              left: `${Math.max(0, Math.min(100, (targetDelay / 2000) * 100))}%`,
              width: "2px",
            }}
          />
          <div
            className={`h-full transition-all duration-300 ${
              diff <= 100 ? "bg-green-500" : diff <= 300 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{
              width: `${Math.min(100, (actualDelay / 2000) * 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs opacity-60 mt-1">
          <span>0ms</span>
          <span>2000ms</span>
        </div>
      </div>
    </div>
  );
}
