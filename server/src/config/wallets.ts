import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";

function loadKeypair(envVar: string): Keypair {
  const raw = process.env[envVar];
  if (!raw) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
  try {
    const secretKey = bs58.decode(raw);
    return Keypair.fromSecretKey(secretKey);
  } catch {
    throw new Error(`Invalid base58 private key in ${envVar}`);
  }
}

function loadPublicKey(envVar: string): PublicKey {
  const raw = process.env[envVar];
  if (!raw) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
  try {
    return new PublicKey(raw);
  } catch {
    throw new Error(`Invalid public key in ${envVar}`);
  }
}

const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

export const connection = new Connection(rpcUrl, "confirmed");

export const verificationWallet = loadKeypair("VERIFICATION_WALLET_PRIVATE_KEY");
export const creatorWallet = loadKeypair("CREATOR_WALLET_PRIVATE_KEY");
export const rewardWallet = loadKeypair("REWARD_WALLET_PRIVATE_KEY");

export const treasuryAddress = loadPublicKey("TREASURY_WALLET_ADDRESS");
export const tokenMintAddress = loadPublicKey("TOKEN_MINT_ADDRESS");

console.log("Wallets loaded:");
console.log(`  Verification: ${verificationWallet.publicKey.toBase58()}`);
console.log(`  Creator:      ${creatorWallet.publicKey.toBase58()}`);
console.log(`  Reward:       ${rewardWallet.publicKey.toBase58()}`);
console.log(`  Treasury:     ${treasuryAddress.toBase58()}`);
console.log(`  Token Mint:   ${tokenMintAddress.toBase58()}`);
console.log(`  RPC:          ${rpcUrl}`);
