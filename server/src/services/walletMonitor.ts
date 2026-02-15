import { PublicKey } from "@solana/web3.js";
import { connection, verificationWallet } from "../config/wallets.js";
import { checkTokenBalance } from "./solana.js";
import { calculateWinChance } from "./spinLogic.js";
import { queueProcessor } from "./spinProcessor.js";
import { wsBroadcaster } from "./wsServer.js";
import { getQueueEntries } from "../lib/queries.js";
import prisma from "../lib/db.js";

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 5000;

class WalletMonitor {
  private subscriptionId: number | null = null;
  private reconnectAttempts = 0;
  private processedSignatures = new Set<string>();

  async start(): Promise<void> {
    console.log(
      `WalletMonitor: subscribing to ${verificationWallet.publicKey.toBase58()}`,
    );
    this.subscribe();
  }

  stop(): void {
    if (this.subscriptionId !== null) {
      connection.removeOnLogsListener(this.subscriptionId);
      this.subscriptionId = null;
      console.log("WalletMonitor: stopped");
    }
  }

  private subscribe(): void {
    this.subscriptionId = connection.onLogs(
      verificationWallet.publicKey,
      async (logs) => {
        if (logs.err) return;
        await this.handleLog(logs.signature);
      },
      "confirmed",
    );

    this.reconnectAttempts = 0;
    console.log(
      `WalletMonitor: subscribed (id: ${this.subscriptionId})`,
    );
  }

  private async handleLog(signature: string): Promise<void> {
    // Deduplicate — onLogs can fire multiple times per tx
    if (this.processedSignatures.has(signature)) return;
    this.processedSignatures.add(signature);

    // Prevent unbounded growth
    if (this.processedSignatures.size > 1000) {
      const entries = [...this.processedSignatures];
      this.processedSignatures = new Set(entries.slice(-500));
    }

    try {
      // Small delay to let the transaction finalize
      await sleep(2000);

      const tx = await connection.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (!tx?.meta || tx.meta.err) return;

      // Find SystemProgram.transfer instruction to verification wallet
      const transfer = this.extractTransfer(tx);
      if (!transfer) return;

      const { sender, lamports } = transfer;
      const solAmount = lamports / 1e9;

      console.log(
        `WalletMonitor: incoming ${solAmount} SOL from ${sender}`,
      );

      // Load config
      const config = await prisma.configuration.findFirst();
      if (!config) {
        console.error("WalletMonitor: no configuration found, ignoring transfer");
        return;
      }

      // Validate minimum SOL
      if (solAmount < config.minSolTransfer) {
        console.log(
          `WalletMonitor: ${solAmount} SOL below minimum ${config.minSolTransfer}, ignoring`,
        );
        return;
      }

      // Pre-filter: check token balance
      const hasTokens = await checkTokenBalance(
        sender,
        config.requiredHoldings,
      );
      if (!hasTokens) {
        console.log(
          `WalletMonitor: ${sender} lacks required token holdings, ignoring`,
        );
        return;
      }

      // Calculate win chance and create spin
      const winChance = calculateWinChance(solAmount, config.minSolTransfer);

      const maxPos = await prisma.spinTransaction.aggregate({
        _max: { queuePosition: true },
      });
      const queuePosition = (maxPos._max.queuePosition ?? 0) + 1;

      const spin = await prisma.spinTransaction.create({
        data: {
          holderAddress: sender,
          solTransferred: solAmount,
          winChance,
          queuePosition,
          result: "PENDING",
        },
      });

      queueProcessor.enqueue(spin.id);

      wsBroadcaster.broadcast({
        type: "queue:update",
        data: await getQueueEntries(),
      });

      console.log(
        `WalletMonitor: queued spin #${spin.id} for ${sender} (${solAmount} SOL, ${winChance}% chance, pos ${queuePosition})`,
      );
    } catch (err) {
      console.error(`WalletMonitor: error processing tx ${signature}:`, err);
    }
  }

  private extractTransfer(
    tx: Awaited<ReturnType<typeof connection.getParsedTransaction>>,
  ): { sender: string; lamports: number } | null {
    if (!tx?.transaction.message.instructions) return null;

    const verificationKey = verificationWallet.publicKey.toBase58();

    for (const ix of tx.transaction.message.instructions) {
      // Parsed instructions have a `parsed` field
      if (!("parsed" in ix)) continue;

      const parsed = ix as {
        program: string;
        parsed: {
          type: string;
          info: {
            source: string;
            destination: string;
            lamports: number;
          };
        };
      };

      if (
        parsed.program === "system" &&
        parsed.parsed.type === "transfer" &&
        parsed.parsed.info.destination === verificationKey
      ) {
        return {
          sender: parsed.parsed.info.source,
          lamports: parsed.parsed.info.lamports,
        };
      }
    }

    return null;
  }

  /** Attempt to reconnect on WebSocket disconnect. */
  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(
        `WalletMonitor: max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached, giving up`,
      );
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `WalletMonitor: reconnecting (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`,
    );

    await sleep(RECONNECT_DELAY_MS);

    try {
      this.subscribe();
    } catch (err) {
      console.error("WalletMonitor: reconnect failed:", err);
      await this.reconnect();
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const walletMonitor = new WalletMonitor();
