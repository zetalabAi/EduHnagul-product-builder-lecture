/**
 * Waveform Visualizer Component
 * Visualize original and user audio waveforms
 */

"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  originalAudioData?: number[]; // Amplitude data
  userAudioData?: number[]; // Amplitude data
  currentPosition: number; // 0-1
  delayMs: number;
}

export function WaveformVisualizer({
  originalAudioData = [],
  userAudioData = [],
  currentPosition,
  delayMs,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw original waveform (top half, blue)
    drawWaveform(
      ctx,
      originalAudioData,
      rect.width,
      rect.height / 2,
      0,
      "rgba(59, 130, 246, 0.8)"
    );

    // Draw user waveform (bottom half, green, with delay offset)
    const delayOffset = (delayMs / 1000) * 100; // pixels per second
    drawWaveform(
      ctx,
      userAudioData,
      rect.width,
      rect.height / 2,
      rect.height / 2,
      "rgba(34, 197, 94, 0.8)",
      delayOffset
    );

    // Draw current position line
    const lineX = currentPosition * rect.width;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineX, 0);
    ctx.lineTo(lineX, rect.height);
    ctx.stroke();

  }, [originalAudioData, userAudioData, currentPosition, delayMs]);

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    data: number[],
    width: number,
    height: number,
    offsetY: number,
    color: string,
    offsetX: number = 0
  ) => {
    if (data.length === 0) {
      // Draw placeholder
      ctx.fillStyle = "rgba(100, 100, 100, 0.2)";
      ctx.fillRect(0, offsetY + height / 4, width, height / 2);
      return;
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const barWidth = width / data.length;
    const centerY = offsetY + height / 2;

    ctx.beginPath();
    data.forEach((amplitude, index) => {
      const x = index * barWidth + offsetX;
      const barHeight = amplitude * (height / 2);

      ctx.moveTo(x, centerY - barHeight / 2);
      ctx.lineTo(x, centerY + barHeight / 2);
    });
    ctx.stroke();
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">파형 비교</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-400">원본</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-400">내 음성 (딜레이: {delayMs}ms)</span>
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full rounded"
        style={{ height: "200px" }}
      />

      <p className="text-gray-500 text-xs mt-2 text-center">
        빨간 선: 현재 재생 위치
      </p>
    </div>
  );
}
