import * as functions from "firebase-functions";
import { GardenManager, ErrorData } from "./gardenManager";

/**
 * Plant a seed (record a mistake)
 */
export const plantSeed = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;
  const { item, category, context: errorContext } = data as ErrorData;

  if (!item || !category || !errorContext) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "item, category, and context are required"
    );
  }

  try {
    const result = await GardenManager.plantSeed(userId, {
      item,
      category,
      context: errorContext,
    });

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error("plantSeed error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Water a plant (practice)
 */
export const waterPlant = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;
  const { plantId, success } = data;

  if (!plantId || typeof success !== "boolean") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "plantId and success are required"
    );
  }

  try {
    const result = await GardenManager.waterPlant(userId, plantId, success);

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error("waterPlant error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get garden statistics
 */
export const getGardenStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;

  try {
    const stats = await GardenManager.getGardenStats(userId);

    return {
      success: true,
      stats,
    };
  } catch (error: any) {
    console.error("getGardenStats error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get all plants in garden
 */
export const getGarden = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;

  try {
    const plants = await GardenManager.getGarden(userId);

    return {
      success: true,
      plants,
    };
  } catch (error: any) {
    console.error("getGarden error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get a specific plant
 */
export const getPlant = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;
  const { plantId } = data;

  if (!plantId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "plantId is required"
    );
  }

  try {
    const plant = await GardenManager.getPlant(userId, plantId);

    if (!plant) {
      throw new functions.https.HttpsError("not-found", "Plant not found");
    }

    return {
      success: true,
      plant,
    };
  } catch (error: any) {
    console.error("getPlant error:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Get plants that need watering
 */
export const getPlantsNeedingWater = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;

    try {
      const plants = await GardenManager.getPlantsNeedingWater(userId);

      return {
        success: true,
        plants,
      };
    } catch (error: any) {
      console.error("getPlantsNeedingWater error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);
