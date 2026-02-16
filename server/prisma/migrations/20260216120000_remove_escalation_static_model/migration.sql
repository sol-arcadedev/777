-- Add columns that were previously added via db push without migrations

-- Subsystem toggle columns
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "feeClaimEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "feeClaimIntervalSec" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "buybackEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "queueEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "slotActive" BOOLEAN NOT NULL DEFAULT false;

-- Static win chance and reward percent (replaces escalation system)
ALTER TABLE "Configuration" ADD COLUMN IF NOT EXISTS "winChance" DOUBLE PRECISION NOT NULL DEFAULT 5.0;
ALTER TABLE "Configuration" ALTER COLUMN "rewardPercent" SET DEFAULT 30.0;

-- Drop escalation columns if they exist (from db push)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuration' AND column_name = 'winChanceStart') THEN
    UPDATE "Configuration" SET "winChance" = "winChanceStart";
    ALTER TABLE "Configuration" DROP COLUMN "winChanceStart";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuration' AND column_name = 'winChanceEnd') THEN
    ALTER TABLE "Configuration" DROP COLUMN "winChanceEnd";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuration' AND column_name = 'rewardPercentStart') THEN
    UPDATE "Configuration" SET "rewardPercent" = "rewardPercentStart";
    ALTER TABLE "Configuration" DROP COLUMN "rewardPercentStart";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuration' AND column_name = 'rewardPercentEnd') THEN
    ALTER TABLE "Configuration" DROP COLUMN "rewardPercentEnd";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuration' AND column_name = 'escalationDurationMin') THEN
    ALTER TABLE "Configuration" DROP COLUMN "escalationDurationMin";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuration' AND column_name = 'escalationStartedAt') THEN
    ALTER TABLE "Configuration" DROP COLUMN "escalationStartedAt";
  END IF;
END
$$;
