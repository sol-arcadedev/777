import { Router } from "express";
import prisma from "../lib/db.js";
import {
  getVerificationWalletBalance,
  getRewardWalletBalance,
  transferToCreator,
  transferToReward,
  transferToTreasury,
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

// Rate limiting for login: max 5 attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

router.post("/api/admin/login", (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= LOGIN_MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.status(429).json({ error: `Too many login attempts. Try again in ${retryAfter}s` });
      return;
    }
  } else if (entry && now >= entry.resetAt) {
    loginAttempts.delete(ip);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(503).json({ error: "Admin not configured" });
    return;
  }

  const { password } = req.body;
  if (!password || password !== adminPassword) {
    const current = loginAttempts.get(ip);
    if (current && now < current.resetAt) {
      current.count++;
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    }
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  // Successful login — clear attempts
  loginAttempts.delete(ip);
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

router.post("/api/admin/claim-fees", adminAuth, async (req, res) => {
  try {
    const { amount } = req.body as { amount?: number };
    const claimAmount = (typeof amount === "number" && amount > 0) ? amount : 0.05;

    const creatorBal = await getCreatorWalletBalance();
    if (creatorBal < claimAmount + 0.002) {
      res.status(400).json({ error: `Creator wallet balance too low (${creatorBal.toFixed(4)} SOL)` });
      return;
    }

    const treasuryAmount = claimAmount * 0.7;
    const rewardAmount = claimAmount * 0.3;

    await transferToTreasury(treasuryAmount);
    await transferToReward(rewardAmount);

    const feeClaim = await prisma.feeClaim.create({
      data: {
        claimTxSignature: `admin-claim-${Date.now()}`,
        totalClaimed: claimAmount,
        treasuryAmount,
        rewardAmount,
      },
    });

    const newBalance = await getRewardWalletBalance();
    wsBroadcaster.broadcast({
      type: "reward:balance",
      data: { balanceSol: newBalance },
    });

    console.log(`Admin fee claim: ${claimAmount} SOL → 70% Treasury (${treasuryAmount}), 30% Reward (${rewardAmount})`);
    res.json({
      id: feeClaim.id,
      totalClaimed: claimAmount,
      treasuryAmount,
      rewardAmount,
      rewardWalletBalance: newBalance,
    });
  } catch (err) {
    console.error("Admin claim fees failed:", err);
    res.status(500).json({ error: "Fee claim failed" });
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
