import { Router } from "express";

const router = Router();

router.post("/api/admin/trigger-transfer", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

router.post("/api/admin/trigger-buyback", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

export default router;
