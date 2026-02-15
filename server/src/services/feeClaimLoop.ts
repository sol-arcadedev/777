import prisma from "../lib/db.js";
import {
  claimCreatorFees,
  transferToTreasury,
  transferToReward,
} from "./solana.js";

const FEE_CLAIM_INTERVAL_MS = 30_000;

let intervalId: ReturnType<typeof setInterval> | null = null;

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
  } catch (err) {
    console.error("Fee claim loop error:", err);
  }
}

export function startFeeClaimLoop(): void {
  if (intervalId) {
    console.warn("Fee claim loop already running");
    return;
  }

  console.log(
    `Starting fee claim loop (every ${FEE_CLAIM_INTERVAL_MS / 1000}s)`,
  );
  intervalId = setInterval(claimFees, FEE_CLAIM_INTERVAL_MS);
}

export function stopFeeClaimLoop(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Fee claim loop stopped");
  }
}
