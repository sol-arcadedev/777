import type {
  Configuration,
  SpinTransaction,
  RewardTransfer,
} from "@prisma/client";
import type {
  ConfigurationDTO,
  SpinTransactionDTO,
  WinnerHistoryEntry,
} from "@shared/types";

export function serializeConfig(config: Configuration): ConfigurationDTO {
  return {
    id: config.id,
    tokenCA: config.tokenCA,
    requiredHoldings: config.requiredHoldings.toString(),
    minSolTransfer: config.minSolTransfer,
    winChanceStart: config.winChanceStart,
    winChanceEnd: config.winChanceEnd,
    rewardPercentStart: config.rewardPercentStart,
    rewardPercentEnd: config.rewardPercentEnd,
    escalationDurationMin: config.escalationDurationMin,
    escalationStartedAt: config.escalationStartedAt?.toISOString() ?? null,
    timerDurationSec: config.timerDurationSec,
    timerExpiresAt: config.timerExpiresAt?.toISOString() ?? null,
    paused: config.paused,
    feeClaimEnabled: config.feeClaimEnabled,
    feeClaimIntervalSec: config.feeClaimIntervalSec,
    buybackEnabled: config.buybackEnabled,
    queueEnabled: config.queueEnabled,
    slotActive: config.slotActive,
    updatedAt: config.updatedAt.toISOString(),
  };
}

export function serializeSpin(spin: SpinTransaction): SpinTransactionDTO {
  return {
    id: spin.id,
    holderAddress: spin.holderAddress,
    solTransferred: spin.solTransferred,
    winChance: spin.winChance,
    queuePosition: spin.queuePosition,
    result: spin.result,
    rewardLamports: spin.rewardLamports?.toString() ?? null,
    txSignature: spin.txSignature,
    createdAt: spin.createdAt.toISOString(),
  };
}

export function serializeWinner(
  spin: SpinTransaction & { reward: RewardTransfer },
): WinnerHistoryEntry {
  return {
    holderAddress: spin.holderAddress,
    solTransferred: spin.solTransferred,
    winChance: spin.winChance,
    solWon: spin.reward.solWon,
    rewardTxSignature: spin.reward.txSignature,
    createdAt: spin.createdAt.toISOString(),
  };
}
