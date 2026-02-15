import { Router } from "express";
import prisma from "../lib/db.js";
import { serializeSpin } from "../lib/serialize.js";
import type { QueueEntry } from "@shared/types";

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
    // Pending spins that haven't been resolved yet.
    // Until the queue service is implemented this will return an empty array.
    const pending = await prisma.spinTransaction.findMany({
      where: { result: undefined as never },
      orderBy: { queuePosition: "asc" },
    });

    const queue: QueueEntry[] = pending.map((s) => ({
      holderAddress: s.holderAddress,
      solTransferred: s.solTransferred,
      winChance: s.winChance,
      queuePosition: s.queuePosition,
    }));

    res.json(queue);
  } catch (err) {
    console.error("GET /api/queue error:", err);
    res.status(500).json({ error: "Failed to fetch queue" });
  }
});

export default router;
