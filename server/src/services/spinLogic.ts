/**
 * Pure functions for spin mechanics.
 */

import type { ReelSymbol } from "@shared/types";

// 1/3 of total chance = jackpot, 2/3 = refund
const JACKPOT_FRACTION = 1 / 3;

export type SpinOutcome = "WIN" | "REFUND" | "LOSE";

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
