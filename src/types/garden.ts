/**
 * Garden Types
 * Mistake Garden gamification types
 */

export type PlantStage = "🌱" | "🌿" | "🌺" | "🌸";

export type PlantCategory = "pronunciation" | "grammar" | "vocabulary";

export interface ErrorHistoryItem {
  timestamp: Date;
  context: string;
  corrected: boolean;
}

export interface Plant {
  id: string;
  item: string;
  category: PlantCategory;
  plantedAt: Date;
  lastPracticed: Date | null;
  practiceCount: number;
  stage: PlantStage;
  masteryLevel: number;
  errorHistory: ErrorHistoryItem[];
}

export interface GardenStats {
  totalPlants: number;
  bloomed: number;
  budding: number;
  sprouting: number;
  seeds: number;
  avgMastery: number;
  categories: {
    pronunciation: number;
    grammar: number;
    vocabulary: number;
  };
}

export interface WaterResult {
  success: boolean;
  stage: PlantStage;
  masteryLevel: number;
  bloomed: boolean;
  practiceCount: number;
}
