import { Router } from "express";
import prisma from "../lib/db.js";
import { serializeSpin } from "../lib/serialize.js";
import { getQueueEntries } from "../lib/queries.js";
import { queueProcessor } from "../services/spinProcessor.js";
import { checkTokenBalance } from "../services/solana.js";
import type { SubmitSpinRequest, SubmitSpinResponse } from "@shared/types";

const router = Router();

router.get("/api/spins", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const spins = await prisma.spinTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json(spins.map(serializeSpin));
  } catch (err) {
    console.error("GET /api/spins error:", err);
    res.status(500).json({ error: "Failed to fetch spins" });
  }
});

router.get("/api/queue", async (_req, res) => {
  try {
    const queue = await getQueueEntries();
    res.json(queue);
  } catch (err) {
    console.error("GET /api/queue error:", err);
    res.status(500).json({ error: "Failed to fetch queue" });
  }
});

router.post("/api/spin", async (req, res) => {
  try {
    const { holderAddress, solTransferred } = req.body as SubmitSpinRequest;

    // Validate inputs
    if (!holderAddress || typeof holderAddress !== "string") {
      res.status(400).json({ error: "holderAddress is required" });
      return;
    }

    const config = await prisma.configuration.findFirst();
    if (!config) {
      res.status(500).json({ error: "Server configuration not found" });
      return;
    }

    if (typeof solTransferred !== "number" || solTransferred < config.minSolTransfer) {
      res.status(400).json({
        error: `solTransferred must be at least ${config.minSolTransfer} SOL`,
      });
      return;
    }

    // Check token balance before allowing queue entry
    const hasTokens = await checkTokenBalance(holderAddress, config.requiredHoldings);
    if (!hasTokens) {
      res.status(403).json({ error: "Insufficient 777 token holdings" });
      return;
    }

    const winChance = config.winChance;

    // Get next queue position
    const maxPos = await prisma.spinTransaction.aggregate({
      _max: { queuePosition: true },
    });
    const queuePosition = (maxPos._max.queuePosition ?? 0) + 1;

    // Create the spin record
    const spin = await prisma.spinTransaction.create({
      data: {
        holderAddress,
        solTransferred,
        winChance,
        queuePosition,
        result: "PENDING",
      },
    });

    // Add to processing queue
    queueProcessor.enqueue(spin.id);

    const response: SubmitSpinResponse = {
      spinId: spin.id,
      queuePosition: spin.queuePosition,
      winChance: spin.winChance,
    };
    res.status(201).json(response);
  } catch (err) {
    console.error("POST /api/spin error:", err);
    res.status(500).json({ error: "Failed to submit spin" });
  }
});

export default router;
