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
