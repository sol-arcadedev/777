/**
 * Mock Solana interactions.
 * These will be replaced with real @solana/web3.js calls later.
 */

/** Check if a holder has the required token balance. */
export async function checkTokenBalance(
  _holderAddress: string,
  _requiredAmount: bigint,
): Promise<boolean> {
  // Mock: always returns true
  return true;
}

/** Get the current SOL balance of the reward wallet. */
export async function getRewardWalletBalance(): Promise<number> {
  // Mock: returns 10 SOL
  return 10.0;
}

/** Transfer SOL reward to the winner. Returns a tx signature. */
export async function transferReward(
  _toAddress: string,
  _solAmount: number,
): Promise<string> {
  // Mock: return a fake tx signature
  return `MOCK_TX_${Date.now()}`;
}

/** Get the current SOL balance of the verification wallet. */
export async function getVerificationWalletBalance(): Promise<number> {
  // Mock: returns 5 SOL
  return 5.0;
}

/** Transfer SOL from Verification Wallet to Creator Wallet. */
export async function transferToCreator(_solAmount: number): Promise<string> {
  return `MOCK_TRANSFER_TX_${Date.now()}`;
}

/** Get the current SOL balance of the creator wallet. */
export async function getCreatorWalletBalance(): Promise<number> {
  // Mock: returns 3 SOL
  return 3.0;
}

/** Buy back 777 tokens and burn them. */
export async function buybackAndBurn(
  _solAmount: number,
): Promise<{ buybackTx: string; burnTx: string; tokensBurned: bigint }> {
  return {
    buybackTx: `MOCK_BUYBACK_TX_${Date.now()}`,
    burnTx: `MOCK_BURN_TX_${Date.now()}`,
    tokensBurned: 100000n,
  };
}

/** Claim PumpFun creator fees from Creator Wallet. */
export async function claimCreatorFees(): Promise<{
  tx: string;
  totalClaimed: number;
}> {
  return {
    tx: `MOCK_CLAIM_TX_${Date.now()}`,
    totalClaimed: 0.5,
  };
}

/** Transfer SOL to the treasury wallet. */
export async function transferToTreasury(_solAmount: number): Promise<string> {
  return `MOCK_TREASURY_TX_${Date.now()}`;
}

/** Transfer SOL to the reward wallet. */
export async function transferToReward(_solAmount: number): Promise<string> {
  return `MOCK_REWARD_TX_${Date.now()}`;
}
