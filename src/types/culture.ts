/**
 * Cultural Immersion Types
 */

export type CultureCategory =
  | "social_hierarchy"
  | "indirect_communication"
  | "food_culture"
  | "dating"
  | "work_culture";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface ScenarioWay {
  dialogue: string;
  explanation: string;
  tone?: string;
  warning?: string;
  awkwardness?: "low" | "medium" | "high" | "critical";
}

export interface PracticeOption {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface PracticeExercise {
  type: "choice" | "fill_blank" | "order";
  question: string;
  options: PracticeOption[];
}

export interface RealWorldExample {
  drama: string;
  episode: number;
  scene: string;
  link: string;
  explanation: string;
}

export interface CulturalScenario {
  id: string;
  situation: string;
  characters: string[];
  rightWay: ScenarioWay;
  wrongWay: ScenarioWay;
  culturalNote?: string;
  alternatives?: string[];
  correctHonorifics?: string[];
  realWorldExample?: RealWorldExample;
  practiceExercise?: PracticeExercise;
}

export interface CommonMistake {
  mistake: string;
  why: string;
  fix: string;
}

export interface CulturalTopic {
  id: string;
  category: CultureCategory;
  title: string;
  difficulty: DifficultyLevel;
  estimatedTime: number;
  introduction: string;
  scenarios: CulturalScenario[];
  keyTakeaways: string[];
  commonMistakes: CommonMistake[];
}
