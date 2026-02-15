import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.js";
import { queueProcessor } from "./services/spinProcessor.js";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(router);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  queueProcessor.start().catch((err) => {
    console.error("Failed to start QueueProcessor:", err);
  });
});
