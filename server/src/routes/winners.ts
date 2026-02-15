import { Router } from "express";
import { getWinnerEntries } from "../lib/queries.js";

const router = Router();

router.get("/api/winners", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const entries = await getWinnerEntries(limit);
    res.json(entries);
  } catch (err) {
    console.error("GET /api/winners error:", err);
    res.status(500).json({ error: "Failed to fetch winners" });
  }
});

export default router;
