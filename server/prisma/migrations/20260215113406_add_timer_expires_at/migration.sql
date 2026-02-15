-- CreateEnum
CREATE TYPE "SpinResult" AS ENUM ('PENDING', 'WIN', 'LOSE');

-- CreateTable
CREATE TABLE "Configuration" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "tokenCA" TEXT NOT NULL DEFAULT 'To be added',
    "requiredHoldings" BIGINT NOT NULL DEFAULT 500000,
    "minSolTransfer" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "rewardPercent" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "timerDurationSec" INTEGER NOT NULL DEFAULT 300,
    "timerExpiresAt" TIMESTAMP(3),
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpinTransaction" (
    "id" SERIAL NOT NULL,
    "holderAddress" TEXT NOT NULL,
    "solTransferred" DOUBLE PRECISION NOT NULL,
    "winChance" DOUBLE PRECISION NOT NULL,
    "queuePosition" INTEGER NOT NULL,
    "result" "SpinResult" NOT NULL,
    "rewardLamports" BIGINT,
    "txSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardTransfer" (
    "id" SERIAL NOT NULL,
    "winnerAddress" TEXT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "solWon" DOUBLE PRECISION NOT NULL,
    "spinId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeClaim" (
    "id" SERIAL NOT NULL,
    "claimTxSignature" TEXT NOT NULL,
    "totalClaimed" DOUBLE PRECISION NOT NULL,
    "treasuryAmount" DOUBLE PRECISION NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuybackBurn" (
    "id" SERIAL NOT NULL,
    "transferTxSignature" TEXT NOT NULL,
    "buybackTxSignature" TEXT,
    "burnTxSignature" TEXT,
    "solAmount" DOUBLE PRECISION NOT NULL,
    "tokensBurned" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuybackBurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RewardTransfer_txSignature_key" ON "RewardTransfer"("txSignature");

-- CreateIndex
CREATE UNIQUE INDEX "RewardTransfer_spinId_key" ON "RewardTransfer"("spinId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeClaim_claimTxSignature_key" ON "FeeClaim"("claimTxSignature");

-- AddForeignKey
ALTER TABLE "RewardTransfer" ADD CONSTRAINT "RewardTransfer_spinId_fkey" FOREIGN KEY ("spinId") REFERENCES "SpinTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
