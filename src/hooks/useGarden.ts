import { useState, useEffect, useCallback } from "react";
import { onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { Plant, GardenStats, WaterResult } from "@/types/garden";

/**
 * useGarden Hook
 * Manage Mistake Garden data and operations
 */
export function useGarden(userId: string | null) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time garden updates
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const gardenRef = collection(db, "users", userId, "mistakeGarden");
    const q = query(gardenRef, orderBy("plantedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plantsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            item: data.item,
            category: data.category,
            plantedAt: data.plantedAt?.toDate() || new Date(),
            lastPracticed: data.lastPracticed?.toDate() || null,
            practiceCount: data.practiceCount || 0,
            stage: data.stage,
            masteryLevel: data.masteryLevel || 0,
            errorHistory: (data.errorHistory || []).map((err: any) => ({
              timestamp: err.timestamp?.toDate() || new Date(),
              context: err.context || "",
              corrected: err.corrected || false,
            })),
          } as Plant;
        });

        setPlants(plantsData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching garden:", err);
        setError("정원 데이터를 불러올 수 없습니다.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Fetch garden statistics
  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      const getGardenStatsFn = httpsCallable<{}, { success: boolean; stats: GardenStats }>(
        functions,
        "getGardenStats"
      );

      const result = await getGardenStatsFn({});
      setStats(result.data.stats);
    } catch (err: any) {
      console.error("Error fetching garden stats:", err);
      setError("통계를 불러올 수 없습니다.");
    }
  }, [userId]);

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /**
   * Plant a seed (record a mistake)
   */
  const plantSeed = useCallback(
    async (item: string, category: string, context: string) => {
      if (!userId) return;

      try {
        const plantSeedFn = httpsCallable<
          { item: string; category: string; context: string },
          { success: boolean; newSeed: boolean; plantId: string }
        >(functions, "plantSeed");

        const result = await plantSeedFn({ item, category, context });

        // Refresh stats
        await fetchStats();

        return result.data;
      } catch (err: any) {
        console.error("Error planting seed:", err);
        throw err;
      }
    },
    [userId, fetchStats]
  );

  /**
   * Water a plant (practice)
   */
  const waterPlant = useCallback(
    async (plantId: string, success: boolean): Promise<WaterResult> => {
      if (!userId) throw new Error("User not authenticated");

      try {
        const waterPlantFn = httpsCallable<
          { plantId: string; success: boolean },
          WaterResult
        >(functions, "waterPlant");

        const result = await waterPlantFn({ plantId, success });

        // Refresh stats
        await fetchStats();

        return result.data;
      } catch (err: any) {
        console.error("Error watering plant:", err);
        throw err;
      }
    },
    [userId, fetchStats]
  );

  /**
   * Get plants that need watering
   */
  const getPlantsNeedingWater = useCallback(async () => {
    if (!userId) return [];

    try {
      const getPlantsNeedingWaterFn = httpsCallable<
        {},
        { success: boolean; plants: Plant[] }
      >(functions, "getPlantsNeedingWater");

      const result = await getPlantsNeedingWaterFn({});
      return result.data.plants;
    } catch (err: any) {
      console.error("Error getting plants needing water:", err);
      return [];
    }
  }, [userId]);

  return {
    plants,
    stats,
    isLoading,
    error,
    plantSeed,
    waterPlant,
    getPlantsNeedingWater,
    refreshStats: fetchStats,
  };
}
