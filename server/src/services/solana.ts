import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createBurnCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  connection,
  verificationWallet,
  creatorWallet,
  rewardWallet,
  treasuryAddress,
  getTokenMintAddress,
} from "../config/wallets.js";

const DEV_MODE = process.env.DEV_MODE === "true";

/** Detect whether a mint uses classic SPL Token or Token-2022. */
async function getTokenProgram(): Promise<PublicKey> {
  const mint = getTokenMintAddress();
  if (!mint) throw new Error("Token mint address not configured");
  const info = await connection.getAccountInfo(mint);
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
    const mint = getTokenMintAddress();
    if (!mint) return false;
    const owner = new PublicKey(holderAddress);
    const tokenProgram = await getTokenProgram();
    const ata = await getAssociatedTokenAddress(mint, owner, false, tokenProgram);
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

/** Transfer SOL refund from Verification Wallet back to holder. */
export async function transferRefund(
  toAddress: string,
  solAmount: number,
): Promise<string> {
  const to = new PublicKey(toAddress);
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: verificationWallet.publicKey,
      toPubkey: to,
      lamports,
    }),
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [verificationWallet], {
    commitment: "confirmed",
    maxRetries: 3,
  });

  console.log(`Refund transfer: ${solAmount} SOL → ${toAddress} (tx: ${signature})`);
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

// --- PumpFun native fee claim constants ---
const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const PUMP_FEE_PROGRAM_ID = new PublicKey("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ");
const PAMM_PROGRAM_ID = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// Anchor instruction discriminators (first 8 bytes of sha256("global:<instruction_name>"))
const DISTRIBUTE_CREATOR_FEES_DISC = Buffer.from([165, 114, 103, 0, 121, 206, 247, 81]);
const COLLECT_COIN_CREATOR_FEE_DISC = Buffer.from([160, 57, 89, 42, 181, 139, 43, 66]);

// PDA derivation helpers
function getBondingCurvePDA(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mint.toBuffer()],
    PUMP_PROGRAM_ID,
  )[0];
}

function getSharingConfigPDA(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("sharing-config"), mint.toBuffer()],
    PUMP_FEE_PROGRAM_ID,
  )[0];
}

function getCreatorVaultPDA(sharingConfig: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("creator-vault"), sharingConfig.toBuffer()],
    PUMP_PROGRAM_ID,
  )[0];
}

function getPumpEventAuthorityPDA(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    PUMP_PROGRAM_ID,
  )[0];
}

function getPammCreatorVaultPDA(creator: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("creator_vault"), creator.toBuffer()],
    PAMM_PROGRAM_ID,
  )[0];
}

function getPammEventAuthorityPDA(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    PAMM_PROGRAM_ID,
  )[0];
}

/**
 * Claim PumpFun creator fees directly on-chain (no PumpPortal dependency).
 *
 * Handles two fee sources:
 * 1. Bonding phase fees — DistributeCreatorFees on pump program (native SOL)
 * 2. Post-migration fees — CollectCoinCreatorFee on pAMM program (WSOL → unwrap)
 *
 * Both are attempted independently; if one fails the other still runs.
 */
export async function claimCreatorFees(): Promise<{
  tx: string;
  totalClaimed: number;
}> {
  if (DEV_MODE) {
    console.log(`[DEV_MODE] claimCreatorFees: skipping on-chain call`);
    return { tx: `dev-mock-claim-${Date.now()}`, totalClaimed: 0 };
  }

  let totalClaimed = 0;
  let lastTx = "";

  const mint = getTokenMintAddress();
  if (!mint) {
    console.log("claimCreatorFees: token mint not configured, skipping");
    return { tx: "", totalClaimed: 0 };
  }

  // --- Part 1: Pump program claim (bonding phase fees) ---
  try {
    const balanceBefore = await connection.getBalance(creatorWallet.publicKey);

    const bondingCurve = getBondingCurvePDA(mint);
    const sharingConfig = getSharingConfigPDA(mint);
    const creatorVault = getCreatorVaultPDA(sharingConfig);
    const eventAuthority = getPumpEventAuthorityPDA();

    // Check if creator vault exists and has lamports to claim
    const vaultInfo = await connection.getAccountInfo(creatorVault);
    if (vaultInfo && vaultInfo.lamports > 0) {
      const ix = new TransactionInstruction({
        programId: PUMP_PROGRAM_ID,
        keys: [
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: bondingCurve, isSigner: false, isWritable: false },
          { pubkey: sharingConfig, isSigner: false, isWritable: false },
          { pubkey: creatorVault, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: eventAuthority, isSigner: false, isWritable: false },
          { pubkey: PUMP_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: creatorWallet.publicKey, isSigner: true, isWritable: true },
        ],
        data: DISTRIBUTE_CREATOR_FEES_DISC,
      });

      const tx = new Transaction().add(ix);
      const sig = await sendAndConfirmTransaction(connection, tx, [creatorWallet], {
        commitment: "confirmed",
        maxRetries: 3,
      });

      // Calculate actual claimed amount (balance diff + tx fee)
      const txDetails = await connection.getTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const txFee = txDetails?.meta?.fee ?? 5000;
      const balanceAfter = await connection.getBalance(creatorWallet.publicKey);
      const claimed = (balanceAfter - balanceBefore + txFee) / LAMPORTS_PER_SOL;

      if (claimed > 0) {
        totalClaimed += claimed;
        lastTx = sig;
        console.log(`claimCreatorFees (pump): claimed ${claimed} SOL (tx: ${sig})`);
      }
    }
  } catch (err) {
    console.error("claimCreatorFees (pump) error:", err);
  }

  // --- Part 2: pAMM claim (post-migration fees, paid in WSOL) ---
  try {
    const balanceBefore = await connection.getBalance(creatorWallet.publicKey);

    const pammCreatorVault = getPammCreatorVaultPDA(creatorWallet.publicKey);
    const pammEventAuthority = getPammEventAuthorityPDA();
    const vaultWsolAta = await getAssociatedTokenAddress(WSOL_MINT, pammCreatorVault, true);

    // Only attempt if the vault's WSOL ATA exists (means post-migration fees may exist)
    const vaultAtaInfo = await connection.getAccountInfo(vaultWsolAta);
    if (vaultAtaInfo) {
      const creatorWsolAta = await getAssociatedTokenAddress(WSOL_MINT, creatorWallet.publicKey);
      const tx = new Transaction();

      // Create creator's WSOL ATA if it doesn't exist
      const creatorAtaInfo = await connection.getAccountInfo(creatorWsolAta);
      if (!creatorAtaInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            creatorWallet.publicKey,
            creatorWsolAta,
            creatorWallet.publicKey,
            WSOL_MINT,
          ),
        );
      }

      // CollectCoinCreatorFee instruction
      tx.add(
        new TransactionInstruction({
          programId: PAMM_PROGRAM_ID,
          keys: [
            { pubkey: WSOL_MINT, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: creatorWallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: pammCreatorVault, isSigner: false, isWritable: false },
            { pubkey: vaultWsolAta, isSigner: false, isWritable: true },
            { pubkey: creatorWsolAta, isSigner: false, isWritable: true },
            { pubkey: pammEventAuthority, isSigner: false, isWritable: false },
            { pubkey: PAMM_PROGRAM_ID, isSigner: false, isWritable: false },
          ],
          data: COLLECT_COIN_CREATOR_FEE_DISC,
        }),
      );

      // Close WSOL ATA to unwrap to native SOL
      tx.add(
        createCloseAccountInstruction(
          creatorWsolAta,
          creatorWallet.publicKey,
          creatorWallet.publicKey,
        ),
      );

      const sig = await sendAndConfirmTransaction(connection, tx, [creatorWallet], {
        commitment: "confirmed",
        maxRetries: 3,
      });

      const txDetails = await connection.getTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const txFee = txDetails?.meta?.fee ?? 5000;
      const balanceAfter = await connection.getBalance(creatorWallet.publicKey);
      const claimed = (balanceAfter - balanceBefore + txFee) / LAMPORTS_PER_SOL;

      if (claimed > 0) {
        totalClaimed += claimed;
        lastTx = sig;
        console.log(`claimCreatorFees (pAMM): claimed ${claimed} SOL (tx: ${sig})`);
      }
    }
  } catch (err) {
    console.error("claimCreatorFees (pAMM) error:", err);
  }

  if (totalClaimed > 0) {
    console.log(`claimCreatorFees: total claimed ${totalClaimed} SOL`);
  }
  return { tx: lastTx, totalClaimed };
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
  const mint = getTokenMintAddress();
  if (!mint) throw new Error("Token mint address not configured");

  // Step 1: Buy tokens via PumpPortal
  const buybackTx = await pumpPortalTrade(
    {
      publicKey: creatorWallet.publicKey.toBase58(),
      action: "buy",
      mint: mint.toBase58(),
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
    mint,
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
    mint,
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
