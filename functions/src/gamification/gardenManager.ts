import * as admin from "firebase-admin";
import { XPManager } from "./xpManager";

// Lazy initialization
function getDb() {
  return admin.firestore();
}

/**
 * Error Data for Planting Seeds
 */
export interface ErrorData {
  item: string; // The mistake item (e.g., "ㅓ", "존댓말")
  category: "pronunciation" | "grammar" | "vocabulary";
  context: string; // The sentence/context where the error occurred
}

/**
 * Plant Growth Stage
 */
export type PlantStage = "🌱" | "🌿" | "🌺" | "🌸";

/**
 * Plant Data
 */
export interface PlantData {
  item: string;
  category: string;
  plantedAt: admin.firestore.Timestamp;
  lastPracticed: admin.firestore.Timestamp | null;
  practiceCount: number;
  stage: PlantStage;
  masteryLevel: number;
  errorHistory: Array<{
    timestamp: admin.firestore.Timestamp;
    context: string;
    corrected: boolean;
  }>;
}

/**
 * Garden Manager
 * Manage the Mistake Garden gamification system
 */
export class GardenManager {
  /**
   * Plant a seed when user makes a mistake
   */
  static async plantSeed(
    userId: string,
    errorData: ErrorData
  ): Promise<{ newSeed: boolean; plantId: string }> {
    const gardenRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("mistakeGarden");

    // Check if plant already exists for this mistake
    const existingPlantSnapshot = await gardenRef
      .where("item", "==", errorData.item)
      .where("category", "==", errorData.category)
      .limit(1)
      .get();

    if (!existingPlantSnapshot.empty) {
      // Plant already exists - just add to error history
      const plantDoc = existingPlantSnapshot.docs[0];
      await plantDoc.ref.update({
        errorHistory: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.Timestamp.now(),
          context: errorData.context,
          corrected: false,
        }),
      });

      return { newSeed: false, plantId: plantDoc.id };
    }

    // Plant new seed
    const newPlant = await gardenRef.add({
      item: errorData.item,
      category: errorData.category,
      plantedAt: admin.firestore.Timestamp.now(),
      lastPracticed: null,
      practiceCount: 0,
      stage: "🌱",
      masteryLevel: 0,
      errorHistory: [
        {
          timestamp: admin.firestore.Timestamp.now(),
          context: errorData.context,
          corrected: false,
        },
      ],
    });

    // Grant XP for identifying a mistake (learning opportunity!)
    await XPManager.grantXP(userId, 10, "실수 발견 (씨앗)");

    console.log(
      `User ${userId} planted new seed: ${errorData.item} (${errorData.category})`
    );

    return { newSeed: true, plantId: newPlant.id };
  }

  /**
   * Water a plant (practice)
   */
  static async waterPlant(
    userId: string,
    plantId: string,
    success: boolean
  ): Promise<{
    stage: PlantStage;
    masteryLevel: number;
    bloomed: boolean;
    practiceCount: number;
  }> {
    const plantRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("mistakeGarden")
      .doc(plantId);

    return getDb().runTransaction(async (transaction) => {
      const plantDoc = await transaction.get(plantRef);

      if (!plantDoc.exists) {
        throw new Error("Plant not found");
      }

      const plant = plantDoc.data() as PlantData;

      // If successful practice, grow the plant
      if (success) {
        const newPracticeCount = plant.practiceCount + 1;
        const newMastery = Math.min(1, newPracticeCount / 10);
        const newStage = this.calculateStage(newPracticeCount);
        const previousStage = plant.stage;

        transaction.update(plantRef, {
          practiceCount: newPracticeCount,
          masteryLevel: newMastery,
          stage: newStage,
          lastPracticed: admin.firestore.Timestamp.now(),
        });

        // Grant practice XP
        const practiceXP = 15;
        await XPManager.grantXP(userId, practiceXP, "식물 물주기 (연습)");

        // Check if plant bloomed (reached mastery)
        const bloomed = newStage === "🌸" && previousStage !== "🌸";

        if (bloomed) {
          await this.celebrateBloom(userId, plant.item, transaction);
        }

        console.log(
          `User ${userId} watered plant ${plantId}: ${previousStage} → ${newStage} (${newPracticeCount}/10)`
        );

        return {
          stage: newStage,
          masteryLevel: newMastery,
          bloomed,
          practiceCount: newPracticeCount,
        };
      } else {
        // Failed practice - add to error history but don't grow
        transaction.update(plantRef, {
          errorHistory: admin.firestore.FieldValue.arrayUnion({
            timestamp: admin.firestore.Timestamp.now(),
            corrected: false,
          }),
        });

        return {
          stage: plant.stage,
          masteryLevel: plant.masteryLevel,
          bloomed: false,
          practiceCount: plant.practiceCount,
        };
      }
    });
  }

  /**
   * Calculate growth stage based on practice count
   */
  private static calculateStage(practiceCount: number): PlantStage {
    if (practiceCount <= 2) return "🌱"; // Seed
    if (practiceCount <= 5) return "🌿"; // Sprout
    if (practiceCount <= 8) return "🌺"; // Bud
    return "🌸"; // Bloom - Mastered!
  }

  /**
   * Celebrate when plant blooms (mastery achieved)
   */
  private static async celebrateBloom(
    userId: string,
    item: string,
    transaction: admin.firestore.Transaction
  ): Promise<void> {
    // Grant bloom XP reward
    await XPManager.grantXP(userId, 100, `${item} 완벽 숙달!`);

    // Grant mastery badge
    const gamificationRef = getDb()
      .collection("users")
      .doc(userId)
      .collection("gamification")
      .doc("stats");

    transaction.update(gamificationRef, {
      badges: admin.firestore.FieldValue.arrayUnion({
        id: `bloom_${item}`,
        name: `${item} 마스터`,
        earnedAt: admin.firestore.Timestamp.now(),
        type: "mastery",
      }),
    });

    console.log(`User ${userId} achieved mastery of: ${item} 🌸`);
  }

  /**
   * Get garden statistics
   */
  static async getGardenStats(userId: string): Promise<{
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
  }> {
    const plantsSnapshot = await getDb()
      .collection("users")
      .doc(userId)
      .collection("mistakeGarden")
      .get();

    const plants = plantsSnapshot.docs.map((doc) => doc.data() as PlantData);

    const stats = {
      totalPlants: plants.length,
      bloomed: plants.filter((p) => p.stage === "🌸").length,
      budding: plants.filter((p) => p.stage === "🌺").length,
      sprouting: plants.filter((p) => p.stage === "🌿").length,
      seeds: plants.filter((p) => p.stage === "🌱").length,
      avgMastery:
        plants.length > 0
          ? plants.reduce((sum, p) => sum + p.masteryLevel, 0) / plants.length
          : 0,
      categories: {
        pronunciation: plants.filter((p) => p.category === "pronunciation")
          .length,
        grammar: plants.filter((p) => p.category === "grammar").length,
        vocabulary: plants.filter((p) => p.category === "vocabulary").length,
      },
    };

    return stats;
  }

  /**
   * Get all plants for a user
   */
  static async getGarden(userId: string): Promise<
    Array<
      PlantData & {
        id: string;
      }
    >
  > {
    const plantsSnapshot = await getDb()
      .collection("users")
      .doc(userId)
      .collection("mistakeGarden")
      .orderBy("plantedAt", "desc")
      .get();

    return plantsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as PlantData),
    }));
  }

  /**
   * Get a specific plant
   */
  static async getPlant(
    userId: string,
    plantId: string
  ): Promise<(PlantData & { id: string }) | null> {
    const plantDoc = await getDb()
      .collection("users")
      .doc(userId)
      .collection("mistakeGarden")
      .doc(plantId)
      .get();

    if (!plantDoc.exists) {
      return null;
    }

    return {
      id: plantDoc.id,
      ...(plantDoc.data() as PlantData),
    };
  }

  /**
   * Get plants that need watering (not mastered yet)
   */
  static async getPlantsNeedingWater(userId: string): Promise<
    Array<
      PlantData & {
        id: string;
      }
    >
  > {
    const plantsSnapshot = await getDb()
      .collection("users")
      .doc(userId)
      .collection("mistakeGarden")
      .where("stage", "!=", "🌸")
      .orderBy("stage")
      .orderBy("lastPracticed", "asc")
      .limit(5)
      .get();

    return plantsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as PlantData),
    }));
  }
}
