/**
 * Progress Tracker Component
 * Track shadow speaking progress
 */

"use client";

interface ProgressTrackerProps {
  currentTime: number;
  totalTime: number;
  completedSentences: number;
  totalSentences: number;
  averageAccuracy: number;
}

export function ProgressTracker({
  currentTime,
  totalTime,
  completedSentences,
  totalSentences,
  averageAccuracy,
}: ProgressTrackerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = (currentTime / totalTime) * 100;
  const sentencePercent = (completedSentences / totalSentences) * 100;

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-400";
    if (accuracy >= 70) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
      {/* Time Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">진행 시간</span>
          <span className="text-white font-medium">
            {formatTime(currentTime)} / {formatTime(totalTime)}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Sentence Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">완료 문장</span>
          <span className="text-white font-medium">
            {completedSentences} / {totalSentences}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${Math.min(100, sentencePercent)}%` }}
          />
        </div>
      </div>

      {/* Average Accuracy */}
      <div className="bg-gray-900 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">평균 정확도</span>
          <span className={`text-2xl font-bold ${getAccuracyColor(averageAccuracy)}`}>
            {Math.round(averageAccuracy)}%
          </span>
        </div>
      </div>
    </div>
  );
}
