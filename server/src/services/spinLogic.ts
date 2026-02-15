/**
 * Pure functions for spin mechanics.
 */

const BASE_WIN_CHANCE = 3; // 3%
const CHANCE_INCREMENT = 1; // +1% per extra 0.01 SOL
const MAX_WIN_CHANCE = 5; // cap at 5%
const SOL_STEP = 0.01;

/**
 * Calculate win chance based on SOL transferred and minimum required.
 * Base 3%, +1% per extra 0.01 SOL above min, capped at 5%.
 */
export function calculateWinChance(
  solTransferred: number,
  minSolTransfer: number,
): number {
  const extraSol = solTransferred - minSolTransfer;
  const extraSteps = Math.floor(extraSol / SOL_STEP);
  const bonus = Math.max(0, extraSteps) * CHANCE_INCREMENT;
  return Math.min(BASE_WIN_CHANCE + bonus, MAX_WIN_CHANCE);
}

/**
 * Determine spin result given a win chance percentage.
 * Returns true for WIN, false for LOSE.
 */
export function determineResult(winChance: number): boolean {
  const roll = Math.random() * 100;
  return roll < winChance;
}
