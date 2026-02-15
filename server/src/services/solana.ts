import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import {
  connection,
  verificationWallet,
  creatorWallet,
  rewardWallet,
  treasuryAddress,
  tokenMintAddress,
} from "../config/wallets.js";

/** Check if a holder has the required token balance. */
export async function checkTokenBalance(
  holderAddress: string,
  requiredAmount: bigint,
): Promise<boolean> {
  try {
    const owner = new PublicKey(holderAddress);
    const ata = await getAssociatedTokenAddress(tokenMintAddress, owner);
    const account = await getAccount(connection, ata);
    return account.amount >= requiredAmount;
  } catch (err: unknown) {
    // TokenAccountNotFoundError or TokenInvalidAccountOwnerError
    const name = (err as { name?: string })?.name ?? "";
    if (
      name === "TokenAccountNotFoundError" ||
      name === "TokenInvalidAccountOwnerError"
    ) {
      return false;
    }
    console.error("checkTokenBalance error:", err);
    return false;
  }
}

/** Get the current SOL balance of the reward wallet. */
export async function getRewardWalletBalance(): Promise<number> {
  const lamports = await connection.getBalance(rewardWallet.publicKey);
  return lamports / LAMPORTS_PER_SOL;
}

/** Get the current SOL balance of the verification wallet. */
export async function getVerificationWalletBalance(): Promise<number> {
  const lamports = await connection.getBalance(verificationWallet.publicKey);
  return lamports / LAMPORTS_PER_SOL;
}

/** Get the current SOL balance of the creator wallet. */
export async function getCreatorWalletBalance(): Promise<number> {
  const lamports = await connection.getBalance(creatorWallet.publicKey);
  return lamports / LAMPORTS_PER_SOL;
}

/** Transfer SOL reward to the winner. Returns a tx signature. */
export async function transferReward(
  toAddress: string,
  solAmount: number,
): Promise<string> {
  const to = new PublicKey(toAddress);
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: rewardWallet.publicKey,
      toPubkey: to,
      lamports,
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [rewardWallet], {
    commitment: "confirmed",
    maxRetries: 3,
  });

  console.log(`Reward transfer: ${solAmount} SOL → ${toAddress} (tx: ${signature})`);
  return signature;
}

/** Transfer SOL from Verification Wallet to Creator Wallet. */
export async function transferToCreator(solAmount: number): Promise<string> {
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: verificationWallet.publicKey,
      toPubkey: creatorWallet.publicKey,
      lamports,
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [verificationWallet], {
    commitment: "confirmed",
    maxRetries: 3,
  });

  console.log(`Verification → Creator: ${solAmount} SOL (tx: ${signature})`);
  return signature;
}

/** Transfer SOL to the treasury wallet. */
export async function transferToTreasury(solAmount: number): Promise<string> {
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: creatorWallet.publicKey,
      toPubkey: treasuryAddress,
      lamports,
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [creatorWallet], {
    commitment: "confirmed",
    maxRetries: 3,
  });

  console.log(`Creator → Treasury: ${solAmount} SOL (tx: ${signature})`);
  return signature;
}

/** Transfer SOL to the reward wallet. */
export async function transferToReward(solAmount: number): Promise<string> {
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: creatorWallet.publicKey,
      toPubkey: rewardWallet.publicKey,
      lamports,
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [creatorWallet], {
    commitment: "confirmed",
    maxRetries: 3,
  });

  console.log(`Creator → Reward: ${solAmount} SOL (tx: ${signature})`);
  return signature;
}

/** Claim PumpFun creator fees from Creator Wallet. STUB — PumpFun SDK not available. */
export async function claimCreatorFees(): Promise<{
  tx: string;
  totalClaimed: number;
}> {
  // Returns 0 so the fee claim loop skips distribution
  console.log("claimCreatorFees: STUB — PumpFun integration not yet implemented");
  return {
    tx: `STUB_CLAIM_${Date.now()}`,
    totalClaimed: 0,
  };
}

/** Buy back 777 tokens and burn them. STUB — PumpFun SDK not available. */
export async function buybackAndBurn(
  _solAmount: number,
): Promise<{ buybackTx: string; burnTx: string; tokensBurned: bigint }> {
  console.log("buybackAndBurn: STUB — PumpFun integration not yet implemented");
  return {
    buybackTx: `STUB_BUYBACK_${Date.now()}`,
    burnTx: `STUB_BURN_${Date.now()}`,
    tokensBurned: 100000n,
  };
}
