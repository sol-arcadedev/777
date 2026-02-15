import { Router } from "express";
import prisma from "../lib/db.js";
import { calculateWinChance } from "../services/spinLogic.js";
import { queueProcessor } from "../services/spinProcessor.js";

const router = Router();

/**
 * Simulate an incoming SOL transfer to the verification wallet.
 * In production this would be replaced by a real wallet monitor.
 */
router.post("/api/dev/simulate-transfer", async (req, res) => {
  try {
    const { holderAddress, solAmount } = req.body as {
      holderAddress?: string;
      solAmount?: number;
    };

    if (!holderAddress || typeof holderAddress !== "string") {
      res.status(400).json({ error: "holderAddress is required" });
      return;
    }

    const config = await prisma.configuration.findFirst();
    if (!config) {
      res.status(500).json({ error: "Server configuration not found" });
      return;
    }

    if (typeof solAmount !== "number" || solAmount < config.minSolTransfer) {
      res.status(400).json({
        error: `solAmount must be at least ${config.minSolTransfer} SOL`,
      });
      return;
    }

    const winChance = calculateWinChance(solAmount, config.minSolTransfer);

    const maxPos = await prisma.spinTransaction.aggregate({
      _max: { queuePosition: true },
    });
    const queuePosition = (maxPos._max.queuePosition ?? 0) + 1;

    const spin = await prisma.spinTransaction.create({
      data: {
        holderAddress,
        solTransferred: solAmount,
        winChance,
        queuePosition,
        result: "PENDING",
      },
    });

    queueProcessor.enqueue(spin.id);

    res.status(201).json({
      spinId: spin.id,
      queuePosition: spin.queuePosition,
      winChance: spin.winChance,
    });
  } catch (err) {
    console.error("POST /api/dev/simulate-transfer error:", err);
    res.status(500).json({ error: "Failed to simulate transfer" });
  }
});

export default router;
