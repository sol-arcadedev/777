-- AlterEnum
ALTER TYPE "SpinResult" ADD VALUE 'REFUND';

-- AlterTable
ALTER TABLE "SpinTransaction" ADD COLUMN     "refundLamports" BIGINT,
ADD COLUMN     "refundTxSignature" TEXT;
