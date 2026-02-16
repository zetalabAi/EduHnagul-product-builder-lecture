/**
 * Emotion Analyzer
 * 음성 톤 기반 감정 분석 시스템
 *
 * 목표: 사용자의 감정 상태를 파악하여 맞춤형 응답 제공
 * - 음성 특징 추출 (pitch, energy, tempo)
 * - 감정 분류 (stressed, excited, tired, positive, negative, neutral)
 */

export interface VoiceFeatures {
  pitch: number; // 음높이 (Hz, 평균)
  pitchVariation: number; // 음높이 변화 (표준편차)
  energy: number; // 에너지/음량 (0-1)
  tempo: number; // 말하기 속도 (words per minute)
  pauseFrequency: number; // 멈춤 빈도 (0-1)
}

export type EmotionType =
  | "stressed" // 스트레스/불안
  | "excited" // 흥분/열정
  | "tired" // 피곤/지침
  | "positive" // 긍정/즐거움
  | "negative" // 부정/좌절
  | "neutral"; // 중립

export interface EmotionResult {
  primary: EmotionType;
  confidence: number; // 0-1
  intensity: number; // 0-1 (감정 강도)
  features: VoiceFeatures;
  secondaryEmotions?: Array<{ emotion: EmotionType; confidence: number }>;
}

export class EmotionAnalyzer {
  /**
   * 음성 톤 분석
   * 음성 특징을 기반으로 감정 상태 판단
   */
  static analyzeVoiceTone(features: VoiceFeatures): EmotionResult {
    const emotions = this.calculateEmotionScores(features);

    // 가장 높은 점수의 감정 선택
    const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0][0] as EmotionType;
    const confidence = sorted[0][1];
    const intensity = this.calculateIntensity(features);

    // 2-3순위 감정 (점수 0.3 이상)
    const secondaryEmotions = sorted
      .slice(1, 3)
      .filter(([_, score]) => score >= 0.3)
      .map(([emotion, conf]) => ({
        emotion: emotion as EmotionType,
        confidence: conf,
      }));

    return {
      primary,
      confidence,
      intensity,
      features,
      secondaryEmotions: secondaryEmotions.length > 0 ? secondaryEmotions : undefined,
    };
  }

  /**
   * 텍스트 기반 감정 분석 (폴백)
   * 음성이 없을 때 텍스트만으로 감정 추정
   */
  static analyzeText(text: string): EmotionResult {
    const lowerText = text.toLowerCase();

    // 키워드 기반 감정 점수
    const scores = {
      stressed: this.countKeywords(lowerText, [
        "어려워",
        "모르겠어",
        "힘들어",
        "복잡해",
        "어떡해",
      ]),
      excited: this.countKeywords(lowerText, [
        "좋아",
        "재밌어",
        "신나",
        "최고",
        "짱",
        "ㅋㅋ",
        "ㅎㅎ",
      ]),
      tired: this.countKeywords(lowerText, [
        "피곤",
        "지쳐",
        "졸려",
        "쉬고",
        "그만",
      ]),
      positive: this.countKeywords(lowerText, [
        "감사",
        "고마워",
        "괜찮아",
        "이해",
        "알겠어",
      ]),
      negative: this.countKeywords(lowerText, [
        "안돼",
        "싫어",
        "못하겠어",
        "포기",
        "그만",
      ]),
      neutral: 0.5, // 기본값
    };

    // 정규화
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const normalized: Record<EmotionType, number> = {} as any;

    Object.entries(scores).forEach(([emotion, score]) => {
      normalized[emotion as EmotionType] = total > 0 ? score / total : 0.16;
    });

    const sorted = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0][0] as EmotionType;

    return {
      primary,
      confidence: sorted[0][1],
      intensity: 0.5, // 텍스트만으로는 강도 측정 어려움
      features: {
        pitch: 0,
        pitchVariation: 0,
        energy: 0,
        tempo: 0,
        pauseFrequency: 0,
      },
    };
  }

  /**
   * 감정 점수 계산
   * 음성 특징을 기반으로 각 감정별 점수 계산
   */
  private static calculateEmotionScores(
    features: VoiceFeatures
  ): Record<EmotionType, number> {
    const scores: Record<EmotionType, number> = {
      stressed: 0,
      excited: 0,
      tired: 0,
      positive: 0,
      negative: 0,
      neutral: 0.5, // 기본값
    };

    // Stressed (스트레스/불안)
    // - 높은 pitch + 높은 variation + 빠른 tempo + 낮은 pause
    if (features.pitch > 250) scores.stressed += 0.3;
    if (features.pitchVariation > 50) scores.stressed += 0.3;
    if (features.tempo > 150) scores.stressed += 0.2;
    if (features.pauseFrequency < 0.3) scores.stressed += 0.2;

    // Excited (흥분/열정)
    // - 높은 pitch + 높은 energy + 빠른 tempo + 높은 variation
    if (features.pitch > 220) scores.excited += 0.2;
    if (features.energy > 0.7) scores.excited += 0.3;
    if (features.tempo > 140) scores.excited += 0.3;
    if (features.pitchVariation > 40) scores.excited += 0.2;

    // Tired (피곤/지침)
    // - 낮은 pitch + 낮은 energy + 느린 tempo + 높은 pause
    if (features.pitch < 180) scores.tired += 0.3;
    if (features.energy < 0.4) scores.tired += 0.3;
    if (features.tempo < 100) scores.tired += 0.2;
    if (features.pauseFrequency > 0.6) scores.tired += 0.2;

    // Positive (긍정/즐거움)
    // - 중간-높은 pitch + 높은 energy + 낮은 pause
    if (features.pitch > 200 && features.pitch < 240) scores.positive += 0.3;
    if (features.energy > 0.6) scores.positive += 0.3;
    if (features.pauseFrequency < 0.4) scores.positive += 0.2;
    if (features.pitchVariation > 30 && features.pitchVariation < 50)
      scores.positive += 0.2;

    // Negative (부정/좌절)
    // - 낮은 pitch + 낮은 energy + 느린 tempo
    if (features.pitch < 200) scores.negative += 0.3;
    if (features.energy < 0.5) scores.negative += 0.2;
    if (features.tempo < 110) scores.negative += 0.2;
    if (features.pitchVariation < 30) scores.negative += 0.3;

    // Neutral (중립)
    // - 모든 값이 중간 범위
    const isPitchNeutral =
      features.pitch >= 190 && features.pitch <= 210;
    const isEnergyNeutral =
      features.energy >= 0.4 && features.energy <= 0.6;
    const isTempoNeutral =
      features.tempo >= 110 && features.tempo <= 130;

    if (isPitchNeutral) scores.neutral += 0.3;
    if (isEnergyNeutral) scores.neutral += 0.3;
    if (isTempoNeutral) scores.neutral += 0.4;

    // 정규화 (합이 1이 되도록)
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    Object.keys(scores).forEach((emotion) => {
      scores[emotion as EmotionType] /= total;
    });

    return scores;
  }

  /**
   * 감정 강도 계산
   * 음성 특징의 편차로 감정 강도 측정
   */
  private static calculateIntensity(features: VoiceFeatures): number {
    // 각 특징이 중립값에서 얼마나 벗어났는지 계산
    const pitchDeviation = Math.abs(features.pitch - 200) / 100;
    const energyDeviation = Math.abs(features.energy - 0.5) / 0.5;
    const tempoDeviation = Math.abs(features.tempo - 120) / 60;
    const variationDeviation = Math.abs(features.pitchVariation - 35) / 35;

    const avgDeviation =
      (pitchDeviation + energyDeviation + tempoDeviation + variationDeviation) / 4;

    // 0-1 범위로 정규화
    return Math.min(1, avgDeviation);
  }

  /**
   * 키워드 카운트 (텍스트 분석용)
   */
  private static countKeywords(text: string, keywords: string[]): number {
    let count = 0;
    keywords.forEach((keyword) => {
      if (text.includes(keyword)) count++;
    });
    return count;
  }

  /**
   * 음성 특징 추출 (Web Audio API용 헬퍼)
   * 실제로는 클라이언트에서 추출하여 전달받지만, 참고용 로직
   */
  static extractVoiceFeaturesFromAudioData(
    audioData: Float32Array,
    sampleRate: number
  ): VoiceFeatures {
    // 이 함수는 예시입니다. 실제로는 클라이언트에서 처리합니다.

    // 1. Pitch 추출 (자기상관 함수 사용)
    const pitch = this.estimatePitch(audioData, sampleRate);

    // 2. Energy 계산 (RMS)
    const energy = this.calculateRMS(audioData);

    // 3. Tempo/속도는 음성 길이와 단어 수로 계산
    // (실제로는 음성 인식 결과 필요)
    const tempo = 120; // 기본값

    // 4. Pitch variation (표준편차)
    const pitchVariation = 35; // 기본값

    // 5. Pause frequency (무음 구간 비율)
    const pauseFrequency = this.detectPauseFrequency(audioData);

    return {
      pitch,
      pitchVariation,
      energy,
      tempo,
      pauseFrequency,
    };
  }

  /**
   * Pitch 추정 (자기상관 함수)
   */
  private static estimatePitch(
    audioData: Float32Array,
    sampleRate: number
  ): number {
    // 간단한 자기상관 함수 기반 pitch 추정
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

    return bestPeriod > 0 ? sampleRate / bestPeriod : 200; // 기본 200 Hz
  }

  /**
   * RMS (Root Mean Square) 계산 - 에너지 측정
   */
  private static calculateRMS(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  /**
   * 무음 구간 빈도 감지
   */
  private static detectPauseFrequency(audioData: Float32Array): number {
    const threshold = 0.01; // 무음 기준
    let silentSamples = 0;

    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) < threshold) {
        silentSamples++;
      }
    }

    return silentSamples / audioData.length;
  }

  /**
   * 감정 라벨 한글 변환
   */
  static getEmotionLabel(emotion: EmotionType): string {
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
  static getEmotionEmoji(emotion: EmotionType): string {
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
}
