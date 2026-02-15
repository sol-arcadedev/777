// ─── Enums ───────────────────────────────────────────────

export type SpinResult = "WIN" | "LOSE";

// ─── Database Models (mirror Prisma schema) ──────────────

export interface Configuration {
  id: number;
  tokenCA: string;
  requiredHoldings: bigint;
  minSolTransfer: number;
  rewardPercent: number;
  timerDurationSec: number;
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

// ─── Admin Config Update Request ─────────────────────────

export interface UpdateConfigRequest {
  tokenCA?: string;
  requiredHoldings?: string;
  minSolTransfer?: number;
  rewardPercent?: number;
  timerDurationSec?: number;
  paused?: boolean;
}
