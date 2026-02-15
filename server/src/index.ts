import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.js";
import { queueProcessor } from "./services/spinProcessor.js";
import { startFeeClaimLoop } from "./services/feeClaimLoop.js";
import { startBuybackTimerLoop } from "./services/buybackTimerLoop.js";
import { walletMonitor } from "./services/walletMonitor.js";
import { wsBroadcaster } from "./services/wsServer.js";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(router);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  wsBroadcaster.attach(server);

  queueProcessor.start().catch((err) => {
    console.error("Failed to start QueueProcessor:", err);
  });
  startFeeClaimLoop();
  startBuybackTimerLoop();
  walletMonitor.start().catch((err) => {
    console.error("Failed to start WalletMonitor:", err);
  });
});
