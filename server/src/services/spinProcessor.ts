import prisma from "../lib/db.js";
import { getQueueEntries, getWinnerEntries } from "../lib/queries.js";
import { determineResult } from "./spinLogic.js";
import {
  checkTokenBalance,
  getRewardWalletBalance,
  transferReward,
} from "./solana.js";
import { wsBroadcaster } from "./wsServer.js";

const PROCESS_INTERVAL_MS = 2000;

class QueueProcessor {
  private queue: number[] = [];
  private processing = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  /** Load PENDING spins from DB and start the processing loop. */
  async start(): Promise<void> {
    const pending = await prisma.spinTransaction.findMany({
      where: { result: "PENDING" },
      orderBy: { queuePosition: "asc" },
      select: { id: true },
    });
    this.queue = pending.map((s) => s.id);
    console.log(`QueueProcessor: loaded ${this.queue.length} pending spin(s)`);

    this.timer = setInterval(() => this.tick(), PROCESS_INTERVAL_MS);
    console.log(
      `QueueProcessor: started (interval ${PROCESS_INTERVAL_MS}ms)`,
    );
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Add a spin ID to the back of the queue. */
  enqueue(spinId: number): void {
    this.queue.push(spinId);
  }

  private async tick(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    // Check if paused
    const config = await prisma.configuration.findFirst();
    if (config?.paused) return;

    this.processing = true;
    try {
      const spinId = this.queue.shift()!;
      await this.processSpin(spinId);
    } catch (err) {
      console.error("QueueProcessor: error processing spin:", err);
    } finally {
      this.processing = false;
    }
  }

  private async processSpin(spinId: number): Promise<void> {
    const spin = await prisma.spinTransaction.findUnique({
      where: { id: spinId },
    });
    if (!spin || spin.result !== "PENDING") return;

    const config = await prisma.configuration.findFirst();
    if (!config) {
      console.error("QueueProcessor: no configuration found");
      return;
    }

    // Check token balance
    const hasTokens = await checkTokenBalance(
      spin.holderAddress,
      config.requiredHoldings,
    );
    if (!hasTokens) {
      await prisma.spinTransaction.update({
        where: { id: spinId },
        data: { result: "LOSE" },
      });
      console.log(`Spin #${spinId}: LOSE (insufficient tokens)`);

      wsBroadcaster.broadcast({
        type: "spin:result",
        data: {
          spinId,
          holderAddress: spin.holderAddress,
          result: "LOSE",
          solTransferred: spin.solTransferred,
          winChance: spin.winChance,
          rewardSol: null,
          txSignature: null,
        },
      });
      wsBroadcaster.broadcast({
        type: "queue:update",
        data: await getQueueEntries(),
      });
      return;
    }

    // Determine result
    const isWin = determineResult(spin.winChance);

    if (isWin) {
      const balance = await getRewardWalletBalance();
      const rewardSol = balance * (config.rewardPercent / 100);
      const rewardLamports = BigInt(Math.floor(rewardSol * 1e9));
      const txSignature = await transferReward(spin.holderAddress, rewardSol);

      await prisma.spinTransaction.update({
        where: { id: spinId },
        data: {
          result: "WIN",
          rewardLamports,
          txSignature,
          reward: {
            create: {
              winnerAddress: spin.holderAddress,
              txSignature,
              solWon: rewardSol,
            },
          },
        },
      });
      console.log(
        `Spin #${spinId}: WIN — ${rewardSol.toFixed(4)} SOL → ${spin.holderAddress}`,
      );

      const newBalance = await getRewardWalletBalance();
      wsBroadcaster.broadcast({
        type: "spin:result",
        data: {
          spinId,
          holderAddress: spin.holderAddress,
          result: "WIN",
          solTransferred: spin.solTransferred,
          winChance: spin.winChance,
          rewardSol,
          txSignature,
        },
      });
      wsBroadcaster.broadcast({
        type: "queue:update",
        data: await getQueueEntries(),
      });
      wsBroadcaster.broadcast({
        type: "winners:update",
        data: await getWinnerEntries(),
      });
      wsBroadcaster.broadcast({
        type: "reward:balance",
        data: { balanceSol: newBalance },
      });
    } else {
      await prisma.spinTransaction.update({
        where: { id: spinId },
        data: { result: "LOSE" },
      });
      console.log(`Spin #${spinId}: LOSE`);

      wsBroadcaster.broadcast({
        type: "spin:result",
        data: {
          spinId,
          holderAddress: spin.holderAddress,
          result: "LOSE",
          solTransferred: spin.solTransferred,
          winChance: spin.winChance,
          rewardSol: null,
          txSignature: null,
        },
      });
      wsBroadcaster.broadcast({
        type: "queue:update",
        data: await getQueueEntries(),
      });
    }
  }
}

// Singleton instance
export const queueProcessor = new QueueProcessor();
