/**
 * Drama Mode Types
 * 드라마 기반 학습 시스템 타입 정의
 */

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface Character {
  id: string;
  name: string;
  role: string;
  personality: string;
  sprite: string;
}

export interface Choice {
  id: string;
  text: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  nextScene: string;
  note?: string;
}

export interface DialogueLine {
  character: string;
  text: string;
  audio?: string;
}

export interface Scene {
  id: string;
  background: string;
  narrator?: string;
  dialogue: DialogueLine[];
  userTurn: boolean;
  expectedResponses?: string[];
  hints?: string[];
  choices?: Choice[];
  nextScene?: string;
  branch?: string;
}

export interface EndingCondition {
  minScore?: number;
  minPronunciation?: number;
  minGrammar?: number;
  requiredChoices?: string[];
}

export interface EndingRewards {
  xp: number;
  badge?: string;
  unlocks?: string[];
}

export interface Ending {
  id: string;
  title: string;
  condition: EndingCondition;
  description: string;
  rewards: EndingRewards;
  image: string;
}

export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  difficulty: DifficultyLevel;
  description: string;
  thumbnail: string;
  learningGoals: string[];
  characters: Character[];
  scenes: Scene[];
  endings: Ending[];
}

export interface DramaProgress {
  episodeId: string;
  completed: boolean;
  bestEnding: string;
  choices: string[];
  pronunciationScore: number;
  grammarScore: number;
  totalScore: number;
  playCount: number;
  completedAt: Date | null;
}

export interface DramaState {
  currentScene: Scene | null;
  sceneHistory: string[];
  totalScore: number;
  pronunciationScore: number;
  grammarScore: number;
  choices: string[];
  isLoading: boolean;
  error: string | null;
}
