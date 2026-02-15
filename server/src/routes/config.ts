import { Router } from "express";
import prisma from "../lib/db.js";
import { serializeConfig } from "../lib/serialize.js";
import { getRewardWalletBalance } from "../services/solana.js";
import { wsBroadcaster } from "../services/wsServer.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { setTokenMintAddress } from "../config/wallets.js";
import type { UpdateConfigRequest } from "@shared/types";

const router = Router();

router.get("/api/config", async (_req, res) => {
  try {
    let config = await prisma.configuration.upsert({
      where: { id: 1 },
      update: {},
      create: {},
    });

    // Initialize timerExpiresAt if not set yet
    if (!config.timerExpiresAt) {
      config = await prisma.configuration.update({
        where: { id: 1 },
        data: {
          timerExpiresAt: new Date(
            Date.now() + config.timerDurationSec * 1000,
          ),
        },
      });
    }

    res.json(serializeConfig(config));
  } catch (err) {
    console.error("GET /api/config error:", err);
    res.status(500).json({ error: "Failed to fetch configuration" });
  }
});

router.put("/api/config", adminAuth, async (req, res) => {
  try {
    const body: UpdateConfigRequest = req.body;
    const data: Record<string, unknown> = {};

    if (body.tokenCA !== undefined) {
      data.tokenCA = body.tokenCA;
      setTokenMintAddress(body.tokenCA);
    }
    if (body.requiredHoldings !== undefined)
      data.requiredHoldings = BigInt(body.requiredHoldings);
    if (body.minSolTransfer !== undefined)
      data.minSolTransfer = body.minSolTransfer;
    if (body.rewardPercent !== undefined)
      data.rewardPercent = body.rewardPercent;
    if (body.timerDurationSec !== undefined) {
      data.timerDurationSec = body.timerDurationSec;
      data.timerExpiresAt = new Date(
        Date.now() + body.timerDurationSec * 1000,
      );
    }
    if (body.paused !== undefined) data.paused = body.paused;

    const config = await prisma.configuration.update({
      where: { id: 1 },
      data,
    });
    const serialized = serializeConfig(config);
    wsBroadcaster.broadcast({ type: "config:update", data: serialized });
    res.json(serialized);
  } catch (err) {
    console.error("PUT /api/config error:", err);
    res.status(500).json({ error: "Failed to update configuration" });
  }
});

router.get("/api/reward-balance", async (_req, res) => {
  try {
    const balanceSol = await getRewardWalletBalance();
    res.json({ balanceSol });
  } catch (err) {
    console.error("GET /api/reward-balance error:", err);
    res.status(500).json({ error: "Failed to fetch reward balance" });
  }
});

export default router;
