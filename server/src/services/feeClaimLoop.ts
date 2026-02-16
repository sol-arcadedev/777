import prisma from "../lib/db.js";
import {
  claimCreatorFees,
  getRewardWalletBalance,
  transferToTreasury,
  transferToReward,
} from "./solana.js";
import { wsBroadcaster } from "./wsServer.js";

let intervalId: ReturnType<typeof setInterval> | null = null;
let currentIntervalMs = 30_000;

async function claimFees(): Promise<void> {
  try {
    const { tx, totalClaimed } = await claimCreatorFees();

    if (totalClaimed <= 0) {
      console.log("Fee claim: no fees to claim, skipping");
      return;
    }

    const treasuryAmount = totalClaimed * 0.7;
    const rewardAmount = totalClaimed * 0.3;

    await transferToTreasury(treasuryAmount);
    await transferToReward(rewardAmount);

    await prisma.feeClaim.create({
      data: {
        claimTxSignature: tx,
        totalClaimed,
        treasuryAmount,
        rewardAmount,
      },
    });

    console.log(
      `Fee claim: ${totalClaimed} SOL claimed — ${treasuryAmount} to Treasury, ${rewardAmount} to Reward`,
    );

    const newBalance = await getRewardWalletBalance();
    wsBroadcaster.broadcast({
      type: "reward:balance",
      data: { balanceSol: newBalance },
    });
  } catch (err) {
    console.error("Fee claim loop error:", err);
  }
}

export function startFeeClaimLoop(intervalMs?: number): void {
  if (intervalId) {
    console.warn("Fee claim loop already running");
    return;
  }

  currentIntervalMs = intervalMs ?? currentIntervalMs;

  console.log(
    `Starting fee claim loop (every ${currentIntervalMs / 1000}s)`,
  );
  intervalId = setInterval(claimFees, currentIntervalMs);
}

export function stopFeeClaimLoop(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Fee claim loop stopped");
  }
}

export function restartFeeClaimLoop(intervalMs: number): void {
  stopFeeClaimLoop();
  startFeeClaimLoop(intervalMs);
}

export function isFeeClaimRunning(): boolean {
  return intervalId !== null;
}
