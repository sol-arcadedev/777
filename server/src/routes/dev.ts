import { Router } from "express";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import prisma from "../lib/db.js";
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

// --- Auto fee simulation ---
let feeSimInterval: ReturnType<typeof setInterval> | null = null;
let feeSimSourceKeypair: Keypair | null = null;

function loadFeeSourceWallet(): Keypair | null {
  const raw = process.env.DEV_FEE_SOURCE_PRIVATE_KEY;
  if (!raw) return null;
  try {
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    console.error("[DEV] Invalid DEV_FEE_SOURCE_PRIVATE_KEY");
    return null;
  }
}

async function runFeeSimTick(amountPerTick: number): Promise<void> {
  try {
    if (!feeSimSourceKeypair) return;

    // Step 1: Transfer from fee source → creator (simulates PumpFun fee claim)
    const sourceBalance = await connection.getBalance(feeSimSourceKeypair.publicKey);
    const lamportsNeeded = Math.floor(amountPerTick * LAMPORTS_PER_SOL);
    if (sourceBalance < lamportsNeeded + 10_000) {
      console.log("[DEV FEE SIM] Fee source wallet low on funds, skipping tick");
      return;
    }

    const claimTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: feeSimSourceKeypair.publicKey,
        toPubkey: creatorWallet.publicKey,
        lamports: lamportsNeeded,
      }),
    );
    const claimSig = await sendAndConfirmTransaction(
      connection, claimTx, [feeSimSourceKeypair], { commitment: "confirmed" },
    );
    console.log(`[DEV FEE SIM] Claimed ${amountPerTick} SOL → Creator (tx: ${claimSig})`);

    // Step 2: 70/30 split from creator
    const treasuryAmount = amountPerTick * 0.7;
    const rewardAmount = amountPerTick * 0.3;

    await transferToTreasury(treasuryAmount);
    await transferToReward(rewardAmount);

    // Step 3: Record in DB
    await prisma.feeClaim.create({
      data: {
        claimTxSignature: claimSig,
        totalClaimed: amountPerTick,
        treasuryAmount,
        rewardAmount,
      },
    });

    // Step 4: Broadcast updated reward balance
    const newBalance = await getRewardWalletBalance();
    wsBroadcaster.broadcast({
      type: "reward:balance",
      data: { balanceSol: newBalance },
    });

    console.log(
      `[DEV FEE SIM] Split: ${treasuryAmount} Treasury, ${rewardAmount} Reward | Reward balance: ${newBalance} SOL`,
    );
  } catch (err) {
    console.error("[DEV FEE SIM] tick error:", err);
  }
}

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

    const winChance = config.winChance;

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
        incomingTxSignature: `dev-sim-${Date.now()}`,
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

/**
 * Start automatic fee claim simulation.
 * Transfers `amount` SOL from fee source wallet → creator every 15s,
 * then does real 70/30 split and broadcasts reward balance.
 */
router.post("/api/dev/fee-sim/start", async (req, res) => {
  try {
    if (feeSimInterval) {
      res.status(400).json({ error: "Fee simulation already running" });
      return;
    }

    const { amount } = req.body as { amount?: number };
    const amountPerTick = (typeof amount === "number" && amount > 0) ? amount : 0.05;

    feeSimSourceKeypair = loadFeeSourceWallet();
    if (!feeSimSourceKeypair) {
      res.status(500).json({ error: "DEV_FEE_SOURCE_PRIVATE_KEY not configured" });
      return;
    }

    const balance = await connection.getBalance(feeSimSourceKeypair.publicKey);
    console.log(
      `[DEV FEE SIM] Starting: ${amountPerTick} SOL every 15s | Source: ${feeSimSourceKeypair.publicKey.toBase58()} (${balance / LAMPORTS_PER_SOL} SOL)`,
    );

    // Run first tick immediately
    runFeeSimTick(amountPerTick);

    feeSimInterval = setInterval(() => runFeeSimTick(amountPerTick), 15_000);

    res.json({
      status: "started",
      amountPerTick,
      intervalSec: 15,
      sourceWallet: feeSimSourceKeypair.publicKey.toBase58(),
      sourceBalance: balance / LAMPORTS_PER_SOL,
    });
  } catch (err) {
    console.error("POST /api/dev/fee-sim/start error:", err);
    res.status(500).json({ error: "Failed to start fee simulation" });
  }
});

/**
 * Stop automatic fee claim simulation.
 */
router.post("/api/dev/fee-sim/stop", (_req, res) => {
  if (!feeSimInterval) {
    res.status(400).json({ error: "Fee simulation not running" });
    return;
  }

  clearInterval(feeSimInterval);
  feeSimInterval = null;
  feeSimSourceKeypair = null;
  console.log("[DEV FEE SIM] Stopped");

  res.json({ status: "stopped" });
});

export default router;
