/**
 * useEmotionDetection Hook
 * 음성 톤 기반 감정 감지 시스템 클라이언트 훅
 *
 * Web Audio API를 사용하여 음성 특징 추출 및 감정 분석
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

export type EmotionType =
  | "stressed"
  | "excited"
  | "tired"
  | "positive"
  | "negative"
  | "neutral";

export interface VoiceFeatures {
  pitch: number;
  pitchVariation: number;
  energy: number;
  tempo: number;
  pauseFrequency: number;
}

export interface EmotionResult {
  primary: EmotionType;
  confidence: number;
  intensity: number;
  features: VoiceFeatures;
}

export interface EmotionStyle {
  tone: string;
  encouragement?: string;
  difficultyAdjustment: number;
  responseLength: "short" | "medium" | "long";
  includeHumor: boolean;
  includeEmoji: boolean;
}

export interface EmotionDetectionState {
  currentEmotion: EmotionType;
  emotionConfidence: number;
  emotionIntensity: number;
  style: EmotionStyle | null;
  suggestions: string[];
  isAnalyzing: boolean;
  error: string | null;
  emotionHistory: Array<{ emotion: EmotionType; timestamp: Date }>;
}

export interface UseEmotionDetectionReturn {
  state: EmotionDetectionState;
  analyzeEmotion: (
    voiceFeatures?: VoiceFeatures,
    text?: string
  ) => Promise<void>;
  extractVoiceFeatures: (audioBlob: Blob) => Promise<VoiceFeatures>;
  resetState: () => void;
  getEmotionLabel: (emotion: EmotionType) => string;
  getEmotionEmoji: (emotion: EmotionType) => string;
}

/**
 * 감정 감지 Hook
 */
export function useEmotionDetection(
  userId: string | null,
  sessionId: string | null
): UseEmotionDetectionReturn {
  const [state, setState] = useState<EmotionDetectionState>({
    currentEmotion: "neutral",
    emotionConfidence: 0,
    emotionIntensity: 0,
    style: null,
    suggestions: [],
    isAnalyzing: false,
    error: null,
    emotionHistory: [],
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  // Audio Context 초기화
  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * 감정 분석 실행
   */
  const analyzeEmotion = useCallback(
    async (voiceFeatures?: VoiceFeatures, text?: string) => {
      if (!userId || !sessionId) {
        console.warn("User ID or Session ID is missing");
        return;
      }

      if (!voiceFeatures && !text) {
        console.warn("Either voice features or text is required");
        return;
      }

      setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

      try {
        const functions = getFunctions();
        const analyzeEmotionFn = httpsCallable(functions, "analyzeEmotion");

        const result = await analyzeEmotionFn({
          userId,
          sessionId,
          voiceFeatures,
          text,
        });

        const response = result.data as any;

        setState((prev) => ({
          ...prev,
          currentEmotion: response.emotion.primary,
          emotionConfidence: response.emotion.confidence,
          emotionIntensity: response.emotion.intensity,
          style: response.style,
          suggestions: response.suggestions,
          emotionHistory: [
            ...prev.emotionHistory,
            {
              emotion: response.emotion.primary,
              timestamp: new Date(),
            },
          ],
          isAnalyzing: false,
        }));

        // 감정 전환 감지
        if (
          state.emotionHistory.length > 0 &&
          state.currentEmotion !== response.emotion.primary
        ) {
          console.log(
            `감정 전환: ${state.currentEmotion} → ${response.emotion.primary}`
          );
        }
      } catch (error: any) {
        console.error("Emotion analysis error:", error);
        setState((prev) => ({
          ...prev,
          error: error.message || "감정 분석 중 오류가 발생했습니다.",
          isAnalyzing: false,
        }));
      }
    },
    [userId, sessionId, state.currentEmotion, state.emotionHistory]
  );

  /**
   * 음성 특징 추출 (Web Audio API)
   */
  const extractVoiceFeatures = useCallback(
    async (audioBlob: Blob): Promise<VoiceFeatures> => {
      if (!audioContextRef.current) {
        throw new Error("AudioContext not initialized");
      }

      const audioContext = audioContextRef.current;

      // Blob을 ArrayBuffer로 변환
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // 채널 데이터 추출
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      // 1. Pitch 추정
      const pitch = estimatePitch(channelData, sampleRate);

      // 2. Pitch Variation (간단 버전)
      const pitchVariation = 35; // 기본값 (실제로는 더 복잡한 계산 필요)

      // 3. Energy (RMS)
      const energy = calculateRMS(channelData);

      // 4. Tempo (임시, 음성 인식 결과 필요)
      const tempo = 120; // 기본값

      // 5. Pause Frequency
      const pauseFrequency = detectPauseFrequency(channelData);

      return {
        pitch,
        pitchVariation,
        energy,
        tempo,
        pauseFrequency,
      };
    },
    []
  );

  /**
   * 상태 초기화
   */
  const resetState = useCallback(() => {
    setState({
      currentEmotion: "neutral",
      emotionConfidence: 0,
      emotionIntensity: 0,
      style: null,
      suggestions: [],
      isAnalyzing: false,
      error: null,
      emotionHistory: [],
    });
  }, []);

  return {
    state,
    analyzeEmotion,
    extractVoiceFeatures,
    resetState,
    getEmotionLabel,
    getEmotionEmoji,
  };
}

/**
 * Pitch 추정 (자기상관 함수)
 */
function estimatePitch(audioData: Float32Array, sampleRate: number): number {
  const minFreq = 80; // 80 Hz
  const maxFreq = 400; // 400 Hz
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);

  let bestPeriod = 0;
  let bestCorrelation = 0;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let correlation = 0;
    for (let i = 0; i < audioData.length - period; i++) {
      correlation += audioData[i] * audioData[i + period];
    }

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  return bestPeriod > 0 ? sampleRate / bestPeriod : 200;
}

/**
 * RMS (Root Mean Square) 계산
 */
function calculateRMS(audioData: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  const rms = Math.sqrt(sum / audioData.length);
  return Math.min(1, rms * 10); // 0-1 범위로 정규화
}

/**
 * 무음 구간 빈도 감지
 */
function detectPauseFrequency(audioData: Float32Array): number {
  const threshold = 0.01;
  let silentSamples = 0;

  for (let i = 0; i < audioData.length; i++) {
    if (Math.abs(audioData[i]) < threshold) {
      silentSamples++;
    }
  }

  return silentSamples / audioData.length;
}

/**
 * 감정 라벨 반환
 */
function getEmotionLabel(emotion: EmotionType): string {
  const labels: Record<EmotionType, string> = {
    stressed: "스트레스/불안",
    excited: "흥분/열정",
    tired: "피곤/지침",
    positive: "긍정/즐거움",
    negative: "부정/좌절",
    neutral: "중립/평온",
  };
  return labels[emotion];
}

/**
 * 감정 이모지 반환
 */
function getEmotionEmoji(emotion: EmotionType): string {
  const emojis: Record<EmotionType, string> = {
    stressed: "😰",
    excited: "🤩",
    tired: "😴",
    positive: "😊",
    negative: "😔",
    neutral: "😐",
  };
  return emojis[emotion];
}
