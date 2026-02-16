"use client";

import { memo, useState } from "react";
import { Plant, GardenStats } from "@/types/garden";
import PlantCard from "./PlantCard";
import PlantDetailModal from "./PlantDetailModal";
import GardenStatsPanel from "./GardenStatsPanel";

interface GardenGridProps {
  plants: Plant[];
  stats: GardenStats | null;
  isLoading: boolean;
  onWaterPlant: (plantId: string, success: boolean) => Promise<any>;
}

/**
 * GardenGrid Component
 * Display grid of plants in the Mistake Garden
 */
const GardenGrid = memo(function GardenGrid({
  plants,
  stats,
  isLoading,
  onWaterPlant,
}: GardenGridProps) {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            정원을 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          나의 실수 정원 🌸
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          실수가 꽃이 되는 마법의 정원입니다
        </p>
      </div>

      {/* Statistics Panel */}
      {stats && <GardenStatsPanel stats={stats} />}

      {/* Plants Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {plants.map((plant) => (
          <PlantCard
            key={plant.id}
            plant={plant}
            onClick={() => setSelectedPlant(plant)}
          />
        ))}

        {plants.length === 0 && (
          <div className="col-span-full">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-3xl p-12 text-center">
              <div className="text-8xl mb-6">🌱</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                아직 심은 씨앗이 없어요
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                실수하면 씨앗이 생겨요! 걱정하지 마세요 😊
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                실수는 성장의 기회입니다
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plant Detail Modal */}
      {selectedPlant && (
        <PlantDetailModal
          plant={selectedPlant}
          onClose={() => setSelectedPlant(null)}
          onWater={onWaterPlant}
        />
      )}
    </div>
  );
});

export default GardenGrid;
