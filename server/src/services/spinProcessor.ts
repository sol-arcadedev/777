import prisma from "../lib/db.js";
import { getQueueEntries, getWinnerEntries } from "../lib/queries.js";
import { determineOutcome, generateReelSymbols } from "./spinLogic.js";
import type { SpinOutcome } from "./spinLogic.js";
import type { SpinResultEvent } from "@shared/types";
import {
  checkTokenBalance,
  getRewardWalletBalance,
  getVerificationWalletBalance,
  transferReward,
  transferRefund,
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

    // Check if paused or slot inactive
    const config = await prisma.configuration.findFirst();
    if (config?.paused || !config?.slotActive) return;

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

  private broadcastResult(data: SpinResultEvent): void {
    wsBroadcaster.broadcast({ type: "spin:result", data });
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
      const reelSymbols = generateReelSymbols("LOSE");
      await prisma.spinTransaction.update({
        where: { id: spinId },
        data: { result: "LOSE" },
      });
      console.log(`Spin #${spinId}: LOSE (insufficient tokens)`);

      this.broadcastResult({
        spinId,
        holderAddress: spin.holderAddress,
        result: "LOSE",
        solTransferred: spin.solTransferred,
        winChance: spin.winChance,
        rewardSol: null,
        refundSol: null,
        txSignature: null,
        reelSymbols,
      });
      wsBroadcaster.broadcast({
        type: "queue:update",
        data: await getQueueEntries(),
      });
      return;
    }

    // Determine outcome
    let outcome: SpinOutcome = determineOutcome(spin.winChance);
    const reelSymbols = generateReelSymbols(outcome);

    if (outcome === "WIN") {
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
      this.broadcastResult({
        spinId,
        holderAddress: spin.holderAddress,
        result: "WIN",
        solTransferred: spin.solTransferred,
        winChance: spin.winChance,
        rewardSol,
        refundSol: null,
        txSignature,
        reelSymbols,
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
    } else if (outcome === "REFUND") {
      // Check verification wallet balance before refund
      const verBalance = await getVerificationWalletBalance();
      const refundSol = spin.solTransferred;

      if (verBalance < refundSol + 0.002) {
        // Insufficient balance for refund + rent, fall back to LOSE
        console.log(
          `Spin #${spinId}: REFUND downgraded to LOSE (insufficient verification balance: ${verBalance} SOL)`,
        );
        const loseSymbols = generateReelSymbols("LOSE");
        await prisma.spinTransaction.update({
          where: { id: spinId },
          data: { result: "LOSE" },
        });

        this.broadcastResult({
          spinId,
          holderAddress: spin.holderAddress,
          result: "LOSE",
          solTransferred: spin.solTransferred,
          winChance: spin.winChance,
          rewardSol: null,
          refundSol: null,
          txSignature: null,
          reelSymbols: loseSymbols,
        });
        wsBroadcaster.broadcast({
          type: "queue:update",
          data: await getQueueEntries(),
        });
        return;
      }

      const refundLamports = BigInt(Math.floor(refundSol * 1e9));
      const txSignature = await transferRefund(spin.holderAddress, refundSol);

      await prisma.spinTransaction.update({
        where: { id: spinId },
        data: {
          result: "REFUND",
          refundLamports,
          refundTxSignature: txSignature,
        },
      });
      console.log(
        `Spin #${spinId}: REFUND — ${refundSol.toFixed(4)} SOL → ${spin.holderAddress}`,
      );

      this.broadcastResult({
        spinId,
        holderAddress: spin.holderAddress,
        result: "REFUND",
        solTransferred: spin.solTransferred,
        winChance: spin.winChance,
        rewardSol: null,
        refundSol,
        txSignature,
        reelSymbols,
      });
      wsBroadcaster.broadcast({
        type: "queue:update",
        data: await getQueueEntries(),
      });
    } else {
      // LOSE
      await prisma.spinTransaction.update({
        where: { id: spinId },
        data: { result: "LOSE" },
      });
      console.log(`Spin #${spinId}: LOSE`);

      this.broadcastResult({
        spinId,
        holderAddress: spin.holderAddress,
        result: "LOSE",
        solTransferred: spin.solTransferred,
        winChance: spin.winChance,
        rewardSol: null,
        refundSol: null,
        txSignature: null,
        reelSymbols,
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
