import { Router } from "express";
import prisma from "../lib/db.js";
import { serializeWinner } from "../lib/serialize.js";

const router = Router();

router.get("/api/winners", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const winners = await prisma.spinTransaction.findMany({
      where: {
        result: "WIN",
        reward: { isNot: null },
      },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Filter to only entries where reward is present (TypeScript narrowing)
    const entries = winners
      .filter((w) => w.reward !== null)
      .map((w) => serializeWinner(w as typeof w & { reward: NonNullable<typeof w.reward> }));

    res.json(entries);
  } catch (err) {
    console.error("GET /api/winners error:", err);
    res.status(500).json({ error: "Failed to fetch winners" });
  }
});

export default router;
