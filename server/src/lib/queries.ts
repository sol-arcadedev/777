import prisma from "./db.js";
import { serializeWinner } from "./serialize.js";
import type { QueueEntry, WinnerHistoryEntry, BurnStatsDTO } from "@shared/types";

export async function getQueueEntries(): Promise<QueueEntry[]> {
  const pending = await prisma.spinTransaction.findMany({
    where: { result: "PENDING" },
    orderBy: { queuePosition: "asc" },
  });

  return pending.map((s) => ({
    holderAddress: s.holderAddress,
    solTransferred: s.solTransferred,
    winChance: s.winChance,
    queuePosition: s.queuePosition,
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
