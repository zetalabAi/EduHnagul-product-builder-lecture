/**
 * Shadow Speaking Types
 * 동시통역 기법 기반 섀도잉 시스템
 */

export type ShadowCategory = "daily" | "business" | "casual" | "drama";
export type ShadowDifficulty = 1 | 2 | 3 | 4;

export interface ShadowSentence {
  text: string;
  startTime: number;
  endTime: number;
  speed: number;
  emphasis: number[];
  tone: string;
  romanization?: string;
  translation?: string;
}

export interface ShadowSettings {
  speed: number;
  delay: number;
  pause: boolean;
}

export interface ShadowContent {
  id: string;
  title: string;
  category: ShadowCategory;
  difficulty: ShadowDifficulty;
  duration: number;
  audioUrl: string;
  transcript: string;
  sentences: ShadowSentence[];
  learningPoints: string[];
  settings: {
    level1: ShadowSettings;
    level2: ShadowSettings;
    level3: ShadowSettings;
    level4: ShadowSettings;
  };
}

export interface ShadowProgress {
  contentId: string;
  attempts: number;
  bestScore: number;
  rhythmAccuracy: number;
  timingAccuracy: number;
  level: ShadowDifficulty;
  lastPracticed: Date | null;
}

export interface ShadowAnalysis {
  rhythmScore: number;
  timingScore: number;
  overallScore: number;
  emphasisMatches: number;
  totalEmphasis: number;
  syllableLengthAccuracy: number;
  tempoAccuracy: number;
  averageDelay: number;
}

export interface ShadowResult {
  scores: {
    rhythm: number;
    timing: number;
    overall: number;
  };
  feedback: string;
  xp: number;
}
