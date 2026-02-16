import prisma from "./db.js";
import { serializeWinner } from "./serialize.js";
import type { QueueEntry, WinnerHistoryEntry, SpinHistoryEntry, BurnStatsDTO, ReelSymbol } from "@shared/types";

export async function getQueueEntries(): Promise<QueueEntry[]> {
  const pending = await prisma.spinTransaction.findMany({
    where: { result: "PENDING" },
    orderBy: { queuePosition: "asc" },
  });

  return pending.map((s) => ({
    holderAddress: s.holderAddress,
    solTransferred: s.solTransferred,
    queuePosition: s.queuePosition,
    incomingTxSignature: s.incomingTxSignature,
  }));
}

export async function getWinnerEntries(
  limit = 20,
): Promise<WinnerHistoryEntry[]> {
  const winners = await prisma.spinTransaction.findMany({
    where: {
      result: "WIN",
      reward: { isNot: null },
    },
    include: { reward: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return winners
    .filter((w) => w.reward !== null)
    .map((w) =>
      serializeWinner(
        w as typeof w & { reward: NonNullable<typeof w.reward> },
      ),
    );
}

function parseReelSymbols(raw: string | null): [ReelSymbol, ReelSymbol, ReelSymbol] {
  if (!raw) return ["X", "7", "SOL"]; // fallback for old spins without stored symbols
  const parts = raw.split(",") as ReelSymbol[];
  return [parts[0] ?? "X", parts[1] ?? "7", parts[2] ?? "SOL"];
}

export async function getSpinHistoryEntries(
  limit = 30,
): Promise<SpinHistoryEntry[]> {
  const spins = await prisma.spinTransaction.findMany({
    where: { result: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return spins.map((s) => ({
    holderAddress: s.holderAddress,
    result: s.result as SpinHistoryEntry["result"],
    reelSymbols: parseReelSymbols(s.reelSymbols),
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function getBurnStats(): Promise<BurnStatsDTO> {
  const result = await prisma.buybackBurn.aggregate({
    _sum: { tokensBurned: true },
    _max: { createdAt: true },
  });

  return {
    totalBurned: (result._sum.tokensBurned ?? 0n).toString(),
    lastBurnAt: result._max.createdAt?.toISOString() ?? null,
  };
}
