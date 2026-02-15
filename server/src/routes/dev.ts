import { Router } from "express";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import prisma from "../lib/db.js";
import { calculateWinChance } from "../services/spinLogic.js";
import { queueProcessor } from "../services/spinProcessor.js";
import {
  connection,
  verificationWallet,
  creatorWallet,
  rewardWallet,
} from "../config/wallets.js";
import {
  transferToTreasury,
  transferToReward,
  getRewardWalletBalance,
} from "../services/solana.js";
import { wsBroadcaster } from "../services/wsServer.js";

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

/**
 * Airdrop SOL to one of the project wallets (devnet only).
 */
router.post("/api/dev/airdrop", async (req, res) => {
  try {
    const { wallet, amount } = req.body as {
      wallet?: string;
      amount?: number;
    };

    const walletMap: Record<string, { publicKey: typeof verificationWallet.publicKey }> = {
      verification: verificationWallet,
      creator: creatorWallet,
      reward: rewardWallet,
    };

    if (!wallet || !walletMap[wallet]) {
      res.status(400).json({
        error: 'wallet must be one of: "verification", "creator", "reward"',
      });
      return;
    }

    if (typeof amount !== "number" || amount <= 0 || amount > 2) {
      res.status(400).json({ error: "amount must be between 0 and 2 SOL" });
      return;
    }

    const pubkey = walletMap[wallet].publicKey;
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    const signature = await connection.requestAirdrop(pubkey, lamports);
    await connection.confirmTransaction(signature, "confirmed");

    const newBalance = await connection.getBalance(pubkey);

    res.json({
      signature,
      wallet,
      airdropped: amount,
      newBalance: newBalance / LAMPORTS_PER_SOL,
    });
  } catch (err) {
    console.error("POST /api/dev/airdrop error:", err);
    res.status(500).json({ error: "Airdrop failed" });
  }
});

/**
 * Simulate a fee claim with a real 70/30 SOL split from creator wallet.
 * Requires creator wallet to have sufficient balance (airdrop first).
 */
router.post("/api/dev/simulate-fee-claim", async (req, res) => {
  try {
    const { amount } = req.body as { amount?: number };

    if (typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "amount must be a positive number (SOL)" });
      return;
    }

    const treasuryAmount = amount * 0.7;
    const rewardAmount = amount * 0.3;

    await transferToTreasury(treasuryAmount);
    await transferToReward(rewardAmount);

    const feeClaim = await prisma.feeClaim.create({
      data: {
        claimTxSignature: `dev-sim-claim-${Date.now()}`,
        totalClaimed: amount,
        treasuryAmount,
        rewardAmount,
      },
    });

    const newBalance = await getRewardWalletBalance();
    wsBroadcaster.broadcast({
      type: "reward:balance",
      data: { balanceSol: newBalance },
    });

    res.json({
      feeClaimId: feeClaim.id,
      totalClaimed: amount,
      treasuryAmount,
      rewardAmount,
      rewardWalletBalance: newBalance,
    });
  } catch (err) {
    console.error("POST /api/dev/simulate-fee-claim error:", err);
    res.status(500).json({ error: "Simulated fee claim failed" });
  }
});

export default router;
