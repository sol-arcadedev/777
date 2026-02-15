import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createBurnCheckedInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  connection,
  verificationWallet,
  creatorWallet,
  rewardWallet,
  treasuryAddress,
  tokenMintAddress,
} from "../config/wallets.js";

const DEV_MODE = process.env.DEV_MODE === "true";

/** Detect whether a mint uses classic SPL Token or Token-2022. */
async function getTokenProgram(): Promise<PublicKey> {
  const info = await connection.getAccountInfo(tokenMintAddress);
  if (!info) throw new Error("Token mint account not found");
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  return TOKEN_PROGRAM_ID;
}

/** Check if a holder has the required token balance. */
export async function checkTokenBalance(
  holderAddress: string,
  requiredAmount: bigint,
): Promise<boolean> {
  if (DEV_MODE) {
    console.log(`[DEV_MODE] checkTokenBalance: skipping SPL check, returning true`);
    return true;
  }
  try {
    const owner = new PublicKey(holderAddress);
    const tokenProgram = await getTokenProgram();
    const ata = await getAssociatedTokenAddress(tokenMintAddress, owner, false, tokenProgram);
    const account = await getAccount(connection, ata, "confirmed", tokenProgram);
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

const PUMPPORTAL_API = "https://pumpportal.fun/api/trade-local";
const PRIORITY_FEE = 0.0001; // SOL
const BUYBACK_SLIPPAGE = 10; // percent
const PUMPFUN_TOKEN_DECIMALS = 6;
const MIN_WALLET_BALANCE_SOL = 0.002; // rent-exempt minimum to keep

/**
 * Send a trade request to PumpPortal Local Transaction API.
 * PumpPortal returns an unsigned serialized transaction; we sign and submit it.
 */
async function pumpPortalTrade(
  params: Record<string, string | number | boolean>,
  signer: Keypair,
): Promise<string> {
  const res = await fetch(PUMPPORTAL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PumpPortal API error ${res.status}: ${body}`);
  }

  const data = await res.arrayBuffer();
  const tx = VersionedTransaction.deserialize(new Uint8Array(data));
  tx.sign([signer]);

  const signature = await connection.sendTransaction(tx, {
    skipPreflight: false,
    maxRetries: 3,
  });

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    { signature, ...latestBlockhash },
    "confirmed",
  );

  return signature;
}

/** Claim PumpFun creator fees from Creator Wallet via PumpPortal. */
export async function claimCreatorFees(): Promise<{
  tx: string;
  totalClaimed: number;
}> {
  if (DEV_MODE) {
    console.log(`[DEV_MODE] claimCreatorFees: skipping PumpPortal call`);
    return { tx: `dev-mock-claim-${Date.now()}`, totalClaimed: 0 };
  }
  try {
    const balanceBefore = await connection.getBalance(creatorWallet.publicKey);

    const tx = await pumpPortalTrade(
      {
        publicKey: creatorWallet.publicKey.toBase58(),
        action: "collectCreatorFee",
        mint: tokenMintAddress.toBase58(),
        priorityFee: PRIORITY_FEE,
      },
      creatorWallet,
    );

    // Fetch tx to get the fee paid, so we can calculate actual claimed amount
    const txDetails = await connection.getTransaction(tx, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const txFee = txDetails?.meta?.fee ?? 0;

    const balanceAfter = await connection.getBalance(creatorWallet.publicKey);
    const totalClaimed = (balanceAfter - balanceBefore + txFee) / LAMPORTS_PER_SOL;

    console.log(`claimCreatorFees: claimed ${totalClaimed} SOL (tx fee: ${txFee / LAMPORTS_PER_SOL} SOL, tx: ${tx})`);
    return { tx, totalClaimed };
  } catch (err) {
    console.error("claimCreatorFees error:", err);
    return { tx: "", totalClaimed: 0 };
  }
}

/** Buy back 777 tokens via PumpPortal and burn them. */
export async function buybackAndBurn(
  solAmount: number,
): Promise<{ buybackTx: string; burnTx: string; tokensBurned: bigint }> {
  if (DEV_MODE) {
    console.log(`[DEV_MODE] buybackAndBurn: skipping PumpPortal buy + burn for ${solAmount} SOL`);
    return {
      buybackTx: `dev-mock-buyback-${Date.now()}`,
      burnTx: `dev-mock-burn-${Date.now()}`,
      tokensBurned: 0n,
    };
  }
  // Step 1: Buy tokens via PumpPortal
  const buybackTx = await pumpPortalTrade(
    {
      publicKey: creatorWallet.publicKey.toBase58(),
      action: "buy",
      mint: tokenMintAddress.toBase58(),
      amount: solAmount,
      denominatedInSol: "true",
      slippage: BUYBACK_SLIPPAGE,
      priorityFee: PRIORITY_FEE,
      pool: "auto",
    },
    creatorWallet,
  );

  console.log(`buybackAndBurn: bought tokens for ${solAmount} SOL (tx: ${buybackTx})`);

  // Step 2: Burn all tokens in creator wallet's ATA
  const tokenProgram = await getTokenProgram();
  const ata = await getAssociatedTokenAddress(
    tokenMintAddress,
    creatorWallet.publicKey,
    false,
    tokenProgram,
  );
  const tokenAccount = await getAccount(connection, ata, "confirmed", tokenProgram);
  const tokensBurned = tokenAccount.amount;

  if (tokensBurned === 0n) {
    console.log("buybackAndBurn: no tokens to burn after buy");
    return { buybackTx, burnTx: "", tokensBurned: 0n };
  }

  const burnIx = createBurnCheckedInstruction(
    ata,
    tokenMintAddress,
    creatorWallet.publicKey,
    tokensBurned,
    PUMPFUN_TOKEN_DECIMALS,
    [],
    tokenProgram,
  );

  const burnTxObj = new Transaction().add(burnIx);
  const burnTx = await sendAndConfirmTransaction(
    connection,
    burnTxObj,
    [creatorWallet],
    { commitment: "confirmed", maxRetries: 3 },
  );

  console.log(
    `buybackAndBurn: burned ${tokensBurned} tokens (tx: ${burnTx})`,
  );

  return { buybackTx, burnTx, tokensBurned };
}
