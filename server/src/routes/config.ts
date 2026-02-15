import { Router } from "express";
import prisma from "../lib/db.js";
import { serializeConfig } from "../lib/serialize.js";
import type { UpdateConfigRequest } from "@shared/types";

const router = Router();

router.get("/api/config", async (_req, res) => {
  try {
    const config = await prisma.configuration.upsert({
      where: { id: 1 },
      update: {},
      create: {},
    });
    res.json(serializeConfig(config));
  } catch (err) {
    console.error("GET /api/config error:", err);
    res.status(500).json({ error: "Failed to fetch configuration" });
  }
});

router.put("/api/config", async (req, res) => {
  try {
    const body: UpdateConfigRequest = req.body;
    const data: Record<string, unknown> = {};

    if (body.tokenCA !== undefined) data.tokenCA = body.tokenCA;
    if (body.requiredHoldings !== undefined)
      data.requiredHoldings = BigInt(body.requiredHoldings);
    if (body.minSolTransfer !== undefined)
      data.minSolTransfer = body.minSolTransfer;
    if (body.rewardPercent !== undefined)
      data.rewardPercent = body.rewardPercent;
    if (body.timerDurationSec !== undefined)
      data.timerDurationSec = body.timerDurationSec;
    if (body.paused !== undefined) data.paused = body.paused;

    const config = await prisma.configuration.update({
      where: { id: 1 },
      data,
    });
    res.json(serializeConfig(config));
  } catch (err) {
    console.error("PUT /api/config error:", err);
    res.status(500).json({ error: "Failed to update configuration" });
  }
});

export default router;
