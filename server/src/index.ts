import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.js";
import prisma from "./lib/db.js";
import { queueProcessor } from "./services/spinProcessor.js";
import { startFeeClaimLoop } from "./services/feeClaimLoop.js";
import { startBuybackTimerLoop } from "./services/buybackTimerLoop.js";
import { walletMonitor } from "./services/walletMonitor.js";
import { wsBroadcaster } from "./services/wsServer.js";
import { setTokenMintAddress } from "./config/wallets.js";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(router);

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Load config from database
  let config;
  try {
    config = await prisma.configuration.findFirst({ where: { id: 1 } });
    if (config) {
      setTokenMintAddress(config.tokenCA);
    }
  } catch (err) {
    console.error("Failed to load config from database:", err);
  }

  wsBroadcaster.attach(server);

  // Always start queue processor (it checks slotActive/paused internally)
  queueProcessor.start().catch((err) => {
    console.error("Failed to start QueueProcessor:", err);
  });

  // Conditionally start subsystems based on DB flags
  if (config?.feeClaimEnabled) {
    startFeeClaimLoop(config.feeClaimIntervalSec * 1000);
  } else {
    console.log("Fee claim loop: disabled (toggle via admin panel)");
  }

  if (config?.buybackEnabled) {
    startBuybackTimerLoop();
  } else {
    console.log("Buyback timer loop: disabled (toggle via admin panel)");
  }

  if (config?.queueEnabled) {
    walletMonitor.start().catch((err) => {
      console.error("Failed to start WalletMonitor:", err);
    });
  } else {
    console.log("Wallet monitor: disabled (toggle via admin panel)");
  }

  if (!config?.slotActive) {
    console.log("Slot machine: inactive (toggle via admin panel)");
  }
});
