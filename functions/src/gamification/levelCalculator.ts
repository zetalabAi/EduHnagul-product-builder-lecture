/**
 * Level Calculator
 * XP to Level conversion logic
 */

/**
 * Calculate level from total XP
 * Formula: Level N requires previous XP + (N * 100)
 * Level 1: 100 XP
 * Level 2: 200 XP (cumulative 300)
 * Level 3: 300 XP (cumulative 600)
 */
export function calculateLevel(totalXP: number): number {
  if (totalXP < 0) return 0;

  let level = 0;
  let xpRequired = 0;
  let cumulativeXP = 0;

  while (cumulativeXP <= totalXP) {
    level++;
    xpRequired = level * 100;
    cumulativeXP += xpRequired;
  }

  return level - 1; // Last completed level
}

/**
 * Get XP required to reach a specific level
 */
export function getXPForLevel(level: number): number {
  if (level <= 0) return 0;

  let totalXP = 0;
  for (let i = 1; i <= level; i++) {
    totalXP += i * 100;
  }

  return totalXP;
}

/**
 * Get current level progress (0-1)
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progress: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = getXPForLevel(currentLevel + 1);

  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  const xpRequiredForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progress = xpInCurrentLevel / xpRequiredForNextLevel;

  return {
    currentLevel,
    xpInCurrentLevel,
    xpRequiredForNextLevel,
    progress,
  };
}

/**
 * Get level title based on level
 */
export function getLevelTitle(level: number): string {
  if (level < 5) return "입문자";
  if (level < 10) return "초보자";
  if (level < 20) return "학습자";
  if (level < 30) return "숙련자";
  if (level < 50) return "전문가";
  if (level < 75) return "마스터";
  if (level < 100) return "그랜드 마스터";
  return "레전드";
}

/**
 * Get level badge icon
 */
export function getLevelBadge(level: number): string {
  if (level < 5) return "🌱";
  if (level < 10) return "🌿";
  if (level < 20) return "🌳";
  if (level < 30) return "🏆";
  if (level < 50) return "💎";
  if (level < 75) return "👑";
  if (level < 100) return "⭐";
  return "🔥";
}
