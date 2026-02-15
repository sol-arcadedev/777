import prisma from "../lib/db.js";
import {
  getVerificationWalletBalance,
  transferToCreator,
} from "./solana.js";

const CHECK_INTERVAL_MS = 5_000;

let intervalId: ReturnType<typeof setInterval> | null = null;

async function checkTimer(): Promise<void> {
  try {
    const config = await prisma.configuration.findUnique({
      where: { id: 1 },
    });

    if (!config || !config.timerExpiresAt) return;

    if (config.timerExpiresAt.getTime() > Date.now()) return;

    // Timer expired — trigger Verification → Creator transfer
    const balance = await getVerificationWalletBalance();

    if (balance > 0) {
      const transferAmount = balance * 0.9;
      const tx = await transferToCreator(transferAmount);

      await prisma.buybackBurn.create({
        data: {
          transferTxSignature: tx,
          solAmount: transferAmount,
        },
      });

      console.log(
        `Buyback timer: transferred ${transferAmount} SOL to Creator (tx: ${tx})`,
      );
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
