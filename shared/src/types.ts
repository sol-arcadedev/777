// ─── Enums ───────────────────────────────────────────────

export type SpinResult = "PENDING" | "WIN" | "REFUND" | "LOSE";

export type ReelSymbol = "7" | "SOL" | "X";

// ─── Database Models (mirror Prisma schema) ──────────────

export interface Configuration {
  id: number;
  tokenCA: string;
  requiredHoldings: bigint;
  minSolTransfer: number;
  rewardPercent: number;
  timerDurationSec: number;
  timerExpiresAt: Date | null;
  paused: boolean;
  updatedAt: Date;
}

export interface SpinTransaction {
  id: number;
  holderAddress: string;
  solTransferred: number;
  winChance: number;
  queuePosition: number;
  result: SpinResult;
  rewardLamports: bigint | null;
  txSignature: string | null;
  createdAt: Date;
}

export interface RewardTransfer {
  id: number;
  winnerAddress: string;
  txSignature: string;
  solWon: number;
  spinId: number;
  createdAt: Date;
}

export interface FeeClaim {
  id: number;
  claimTxSignature: string;
  totalClaimed: number;
  treasuryAmount: number;
  rewardAmount: number;
  createdAt: Date;
}

export interface BuybackBurn {
  id: number;
  transferTxSignature: string;
  buybackTxSignature: string | null;
  burnTxSignature: string | null;
  solAmount: number;
  tokensBurned: bigint | null;
  createdAt: Date;
}

// ─── API DTOs (JSON-safe — bigint serialized as string) ──

export interface ConfigurationDTO {
  id: number;
  tokenCA: string;
  requiredHoldings: string;
  minSolTransfer: number;
  rewardPercent: number;
  timerDurationSec: number;
  timerExpiresAt: string | null;
  paused: boolean;
  updatedAt: string;
}

export interface SpinTransactionDTO {
  id: number;
  holderAddress: string;
  solTransferred: number;
  winChance: number;
  queuePosition: number;
  result: SpinResult;
  rewardLamports: string | null;
  txSignature: string | null;
  createdAt: string;
}

export interface RewardTransferDTO {
  id: number;
  winnerAddress: string;
  txSignature: string;
  solWon: number;
  spinId: number;
  createdAt: string;
}

export interface FeeClaimDTO {
  id: number;
  claimTxSignature: string;
  totalClaimed: number;
  treasuryAmount: number;
  rewardAmount: number;
  createdAt: string;
}

export interface BuybackBurnDTO {
  id: number;
  transferTxSignature: string;
  buybackTxSignature: string | null;
  burnTxSignature: string | null;
  solAmount: number;
  tokensBurned: string | null;
  createdAt: string;
}

// ─── Winner History (combined for frontend display) ──────

export interface WinnerHistoryEntry {
  holderAddress: string;
  solTransferred: number;
  winChance: number;
  solWon: number;
  rewardTxSignature: string;
  createdAt: string;
}

// ─── Queue Display ───────────────────────────────────────

export interface QueueEntry {
  holderAddress: string;
  solTransferred: number;
  winChance: number;
  queuePosition: number;
}

// ─── Spin Submission ────────────────────────────────────

export interface SubmitSpinRequest {
  holderAddress: string;
  solTransferred: number;
}

export interface SubmitSpinResponse {
  spinId: number;
  queuePosition: number;
  winChance: number;
}

// ─── WebSocket Messages ─────────────────────────────────

export interface SpinResultEvent {
  spinId: number;
  holderAddress: string;
  result: "WIN" | "REFUND" | "LOSE";
  solTransferred: number;
  winChance: number;
  rewardSol: number | null;
  refundSol: number | null;
  txSignature: string | null;
  reelSymbols: [ReelSymbol, ReelSymbol, ReelSymbol];
}

export type WsServerMessage =
  | { type: "queue:update"; data: QueueEntry[] }
  | { type: "winners:update"; data: WinnerHistoryEntry[] }
  | { type: "config:update"; data: ConfigurationDTO }
  | { type: "spin:result"; data: SpinResultEvent }
  | { type: "reward:balance"; data: { balanceSol: number } };

// ─── Admin Config Update Request ─────────────────────────

export interface UpdateConfigRequest {
  tokenCA?: string;
  requiredHoldings?: string;
  minSolTransfer?: number;
  rewardPercent?: number;
  timerDurationSec?: number;
  paused?: boolean;
}
