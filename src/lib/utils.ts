import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * XP thresholds for level progression.
 * Each level requires increasingly more XP to reach.
 */
export const XP_LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3300, 4000] as const;

/**
 * Returns the XP needed to reach the next level from currentLevel.
 * currentLevel is 0-indexed (level 0 = first level).
 */
export function getNextLevelXP(currentLevel: number): number {
  if (currentLevel >= XP_LEVEL_THRESHOLDS.length) {
    return XP_LEVEL_THRESHOLDS[XP_LEVEL_THRESHOLDS.length - 1];
  }
  return XP_LEVEL_THRESHOLDS[currentLevel] - XP_LEVEL_THRESHOLDS[currentLevel - 1];
}
