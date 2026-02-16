import { Router } from "express";
import prisma from "../lib/db.js";
import {
  getVerificationWalletBalance,
  getRewardWalletBalance,
  transferToCreator,
  transferToReward,
  getCreatorWalletBalance,
  buybackAndBurn,
} from "../services/solana.js";
import { adminAuth, createSession } from "../middleware/adminAuth.js";
import { startFeeClaimLoop, stopFeeClaimLoop, isFeeClaimRunning } from "../services/feeClaimLoop.js";
import { startBuybackTimerLoop, stopBuybackTimerLoop, isBuybackTimerRunning } from "../services/buybackTimerLoop.js";
import { walletMonitor } from "../services/walletMonitor.js";
import { wsBroadcaster } from "../services/wsServer.js";
import { serializeConfig } from "../lib/serialize.js";
import { getBurnStats } from "../lib/queries.js";
import type { SystemStatus } from "@shared/types";

const router = Router();

router.post("/api/admin/login", (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(503).json({ error: "Admin not configured" });
    return;
  }

  const { password } = req.body;
  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = createSession();
  res.json({ token });
});

// ─── Manual Triggers ───────────────────────────────────

router.post("/api/admin/trigger-transfer", adminAuth, async (_req, res) => {
  try {
    const balance = await getVerificationWalletBalance();
    if (balance <= 0) {
      res.status(400).json({ error: "Verification wallet has no balance" });
      return;
    }

    const creatorAmount = balance * 0.8;
    const rewardAmount = balance * 0.2;

    const txSignature = await transferToCreator(creatorAmount);

    // Transfer 20% to reward wallet
    try {
      await transferToReward(rewardAmount);
      const newBalance = await getRewardWalletBalance();
      wsBroadcaster.broadcast({
        type: "reward:balance",
        data: { balanceSol: newBalance },
      });
    } catch (rewardErr) {
      console.error("Trigger transfer: reward transfer failed:", rewardErr);
    }

    const record = await prisma.buybackBurn.create({
      data: {
        transferTxSignature: txSignature,
        solAmount: creatorAmount,
      },
    });

    console.log(
      `Transfer: ${creatorAmount} SOL (80%) to Creator, ${rewardAmount} SOL (20%) to Reward (tx: ${txSignature})`,
    );

    res.json({
      id: record.id,
      txSignature,
      solAmount: creatorAmount,
    });
  } catch (err) {
    console.error("Trigger transfer failed:", err);
    res.status(500).json({ error: "Transfer failed" });
  }
});

router.post("/api/admin/trigger-buyback", adminAuth, async (_req, res) => {
  try {
    const balance = await getCreatorWalletBalance();
    if (balance <= 0) {
      res.status(400).json({ error: "Creator wallet has no balance" });
      return;
    }

    const buybackAmount = balance * 0.5;
    const { buybackTx, burnTx, tokensBurned } =
      await buybackAndBurn(buybackAmount);

    const record = await prisma.buybackBurn.create({
      data: {
        transferTxSignature: buybackTx,
        buybackTxSignature: buybackTx,
        burnTxSignature: burnTx,
        solAmount: buybackAmount,
        tokensBurned,
      },
    });

    console.log(
      `Buyback & Burn: ${buybackAmount} SOL, ${tokensBurned} tokens burned`,
    );

    // Broadcast updated burn stats
    const burnStats = await getBurnStats();
    wsBroadcaster.broadcast({ type: "burn:update", data: burnStats });

    res.json({
      id: record.id,
      buybackTx,
      burnTx,
      solAmount: buybackAmount,
      tokensBurned: tokensBurned.toString(),
    });
  } catch (err) {
    console.error("Trigger buyback failed:", err);
    res.status(500).json({ error: "Buyback failed" });
  }
});

// ─── Subsystem Toggles ────────────────────────────────

router.post("/api/admin/toggle-fee-claim", adminAuth, async (_req, res) => {
  try {
    const config = await prisma.configuration.findFirst();
    const newState = !config?.feeClaimEnabled;

    await prisma.configuration.update({
      where: { id: 1 },
      data: { feeClaimEnabled: newState },
    });

    if (newState) {
      const intervalMs = (config?.feeClaimIntervalSec ?? 30) * 1000;
      startFeeClaimLoop(intervalMs);
    } else {
      stopFeeClaimLoop();
    }

    // Broadcast config update
    const updated = await prisma.configuration.findUnique({ where: { id: 1 } });
    if (updated) {
      wsBroadcaster.broadcast({ type: "config:update", data: serializeConfig(updated) });
    }

    console.log(`Fee claim loop toggled: ${newState ? "ON" : "OFF"}`);
    res.json({ feeClaimEnabled: newState });
  } catch (err) {
    console.error("Toggle fee claim failed:", err);
    res.status(500).json({ error: "Toggle failed" });
  }
});

router.post("/api/admin/toggle-buyback", adminAuth, async (_req, res) => {
  try {
    const config = await prisma.configuration.findFirst();
    const newState = !config?.buybackEnabled;

    await prisma.configuration.update({
      where: { id: 1 },
      data: { buybackEnabled: newState },
    });

    if (newState) {
      startBuybackTimerLoop();
    } else {
      stopBuybackTimerLoop();
    }

    const updated = await prisma.configuration.findUnique({ where: { id: 1 } });
    if (updated) {
      wsBroadcaster.broadcast({ type: "config:update", data: serializeConfig(updated) });
    }

    console.log(`Buyback timer loop toggled: ${newState ? "ON" : "OFF"}`);
    res.json({ buybackEnabled: newState });
  } catch (err) {
    console.error("Toggle buyback failed:", err);
    res.status(500).json({ error: "Toggle failed" });
  }
});

router.post("/api/admin/toggle-queue", adminAuth, async (_req, res) => {
  try {
    const config = await prisma.configuration.findFirst();
    const newState = !config?.queueEnabled;

    await prisma.configuration.update({
      where: { id: 1 },
      data: { queueEnabled: newState },
    });

    if (newState) {
      walletMonitor.start().catch((err) => {
        console.error("Failed to start WalletMonitor:", err);
      });
    } else {
      walletMonitor.stop();
    }

    const updated = await prisma.configuration.findUnique({ where: { id: 1 } });
    if (updated) {
      wsBroadcaster.broadcast({ type: "config:update", data: serializeConfig(updated) });
    }

    console.log(`Queue (wallet monitor) toggled: ${newState ? "ON" : "OFF"}`);
    res.json({ queueEnabled: newState });
  } catch (err) {
    console.error("Toggle queue failed:", err);
    res.status(500).json({ error: "Toggle failed" });
  }
});

router.post("/api/admin/toggle-slot", adminAuth, async (_req, res) => {
  try {
    const config = await prisma.configuration.findFirst();
    const newState = !config?.slotActive;

    await prisma.configuration.update({
      where: { id: 1 },
      data: { slotActive: newState },
    });

    const updated = await prisma.configuration.findUnique({ where: { id: 1 } });
    if (updated) {
      wsBroadcaster.broadcast({ type: "config:update", data: serializeConfig(updated) });
    }

    console.log(`Slot machine toggled: ${newState ? "ON" : "OFF"}`);
    res.json({ slotActive: newState });
  } catch (err) {
    console.error("Toggle slot failed:", err);
    res.status(500).json({ error: "Toggle failed" });
  }
});

// ─── System Status ─────────────────────────────────────

router.get("/api/admin/system-status", adminAuth, async (_req, res) => {
  try {
    const config = await prisma.configuration.findFirst();
    const status: SystemStatus = {
      feeClaimEnabled: config?.feeClaimEnabled ?? false,
      buybackEnabled: config?.buybackEnabled ?? false,
      queueEnabled: config?.queueEnabled ?? false,
      slotActive: config?.slotActive ?? false,
    };
    res.json(status);
  } catch (err) {
    console.error("GET /api/admin/system-status error:", err);
    res.status(500).json({ error: "Failed to fetch system status" });
  }
});

// ─── Public Burn Stats ─────────────────────────────────

router.get("/api/burn-stats", async (_req, res) => {
  try {
    const stats = await getBurnStats();
    res.json(stats);
  } catch (err) {
    console.error("GET /api/burn-stats error:", err);
    res.status(500).json({ error: "Failed to fetch burn stats" });
  }
});

export default router;
