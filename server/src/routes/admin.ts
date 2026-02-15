import { Router } from "express";
import prisma from "../lib/db.js";
import {
  getVerificationWalletBalance,
  transferToCreator,
  getCreatorWalletBalance,
  buybackAndBurn,
} from "../services/solana.js";

const router = Router();

router.post("/api/admin/trigger-transfer", async (_req, res) => {
  try {
    const balance = await getVerificationWalletBalance();
    if (balance <= 0) {
      res.status(400).json({ error: "Verification wallet has no balance" });
      return;
    }

    const transferAmount = balance * 0.9;
    const txSignature = await transferToCreator(transferAmount);

    const record = await prisma.buybackBurn.create({
      data: {
        transferTxSignature: txSignature,
        solAmount: transferAmount,
      },
    });

    console.log(
      `Transfer: ${transferAmount} SOL from Verification to Creator (tx: ${txSignature})`,
    );

    res.json({
      id: record.id,
      txSignature,
      solAmount: transferAmount,
    });
  } catch (err) {
    console.error("Trigger transfer failed:", err);
    res.status(500).json({ error: "Transfer failed" });
  }
});

router.post("/api/admin/trigger-buyback", async (_req, res) => {
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

export default router;
