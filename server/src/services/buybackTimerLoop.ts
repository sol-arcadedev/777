import prisma from "../lib/db.js";
import {
  getVerificationWalletBalance,
  getRewardWalletBalance,
  transferToCreator,
  transferToReward,
  buybackAndBurn,
} from "./solana.js";
import { wsBroadcaster } from "./wsServer.js";
import { getBurnStats } from "../lib/queries.js";

const CHECK_INTERVAL_MS = 5_000;
const DEV_MODE = process.env.DEV_MODE === "true";

let intervalId: ReturnType<typeof setInterval> | null = null;

async function checkTimer(): Promise<void> {
  try {
    const config = await prisma.configuration.findUnique({
      where: { id: 1 },
    });

    if (!config || !config.timerExpiresAt) return;

    if (config.timerExpiresAt.getTime() > Date.now()) return;

    if (DEV_MODE) {
      console.log("[DEV_MODE] Buyback timer expired, skipping on-chain transfers");
      // Reset timer even in dev mode
      await prisma.configuration.update({
        where: { id: 1 },
        data: {
          timerExpiresAt: new Date(
            Date.now() + config.timerDurationSec * 1000,
          ),
        },
      });
      console.log(`Buyback timer: reset for ${config.timerDurationSec}s`);
      return;
    }

    // Timer expired — trigger Verification → Creator (80%) + Reward (20%)
    const balance = await getVerificationWalletBalance();

    if (balance > 0) {
      const creatorAmount = balance * 0.8;
      const rewardAmount = balance * 0.2;

      const tx = await transferToCreator(creatorAmount);

      console.log(
        `Buyback timer: transferred ${creatorAmount} SOL to Creator (tx: ${tx})`,
      );

      // Transfer 20% to reward wallet
      try {
        await transferToReward(rewardAmount);
        console.log(
          `Buyback timer: transferred ${rewardAmount} SOL to Reward`,
        );

        const newBalance = await getRewardWalletBalance();
        wsBroadcaster.broadcast({
          type: "reward:balance",
          data: { balanceSol: newBalance },
        });
      } catch (rewardErr) {
        console.error("Buyback timer: reward transfer failed:", rewardErr);
      }

      // Buyback+burn using 50% of the creator amount (per spec)
      const buybackAmount = creatorAmount * 0.5;
      try {
        const { buybackTx, burnTx, tokensBurned } =
          await buybackAndBurn(buybackAmount);

        await prisma.buybackBurn.create({
          data: {
            transferTxSignature: tx,
            buybackTxSignature: buybackTx,
            burnTxSignature: burnTx,
            solAmount: creatorAmount,
            tokensBurned: tokensBurned,
          },
        });

        console.log(
          `Buyback timer: bought back & burned ${tokensBurned} tokens for ${buybackAmount} SOL`,
        );

        // Broadcast updated burn stats
        const burnStats = await getBurnStats();
        wsBroadcaster.broadcast({ type: "burn:update", data: burnStats });
      } catch (bbErr) {
        // Still record the transfer even if buyback fails
        await prisma.buybackBurn.create({
          data: {
            transferTxSignature: tx,
            solAmount: creatorAmount,
          },
        });
        console.error("Buyback timer: buyback+burn failed:", bbErr);
      }
    } else {
      console.log("Buyback timer: verification wallet empty, skipping transfer");
    }

    // Reset timer
    await prisma.configuration.update({
      where: { id: 1 },
      data: {
        timerExpiresAt: new Date(
          Date.now() + config.timerDurationSec * 1000,
        ),
      },
    });

    console.log(
      `Buyback timer: reset for ${config.timerDurationSec}s`,
    );
  } catch (err) {
    console.error("Buyback timer loop error:", err);
  }
}

export function startBuybackTimerLoop(): void {
  if (intervalId) {
    console.warn("Buyback timer loop already running");
    return;
  }

  console.log(
    `Starting buyback timer loop (checking every ${CHECK_INTERVAL_MS / 1000}s)`,
  );
  intervalId = setInterval(checkTimer, CHECK_INTERVAL_MS);
}

export function stopBuybackTimerLoop(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Buyback timer loop stopped");
  }
}

export function isBuybackTimerRunning(): boolean {
  return intervalId !== null;
}
