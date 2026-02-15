/**
 * Pure functions for spin mechanics.
 */

import type { ReelSymbol } from "@shared/types";

const BASE_WIN_CHANCE = 3; // 3%
const CHANCE_INCREMENT = 1; // +1% per extra 0.01 SOL
const MAX_WIN_CHANCE = 5; // cap at 5%
const SOL_STEP = 0.01;

// 1/3 of total chance = jackpot, 2/3 = refund
const JACKPOT_FRACTION = 1 / 3;

export type SpinOutcome = "WIN" | "REFUND" | "LOSE";

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
 * Determine spin outcome given a win chance percentage.
 * Total win chance is split: 1/3 jackpot (WIN), 2/3 refund (REFUND).
 */
export function determineOutcome(winChance: number): SpinOutcome {
  const roll = Math.random() * 100;
  if (roll >= winChance) return "LOSE";
  // Within the win range, split into jackpot vs refund
  const jackpotThreshold = winChance * JACKPOT_FRACTION;
  return roll < jackpotThreshold ? "WIN" : "REFUND";
}

const ALL_SYMBOLS: ReelSymbol[] = ["7", "SOL", "X"];

/**
 * Generate reel symbols matching the outcome.
 * WIN = ["7","7","7"], REFUND = ["SOL","SOL","SOL"], LOSE = random non-matching.
 */
export function generateReelSymbols(
  outcome: SpinOutcome,
): [ReelSymbol, ReelSymbol, ReelSymbol] {
  if (outcome === "WIN") return ["7", "7", "7"];
  if (outcome === "REFUND") return ["SOL", "SOL", "SOL"];

  // LOSE: generate symbols that don't all match
  let symbols: [ReelSymbol, ReelSymbol, ReelSymbol];
  do {
    symbols = [
      ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
      ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
      ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
    ];
  } while (symbols[0] === symbols[1] && symbols[1] === symbols[2]);

  return symbols;
}
