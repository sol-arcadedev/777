-- Rename escalation columns to static names
ALTER TABLE "Configuration" RENAME COLUMN "winChanceStart" TO "winChance";
ALTER TABLE "Configuration" RENAME COLUMN "rewardPercentStart" TO "rewardPercent";

-- Drop escalation-specific columns
ALTER TABLE "Configuration" DROP COLUMN "winChanceEnd";
ALTER TABLE "Configuration" DROP COLUMN "rewardPercentEnd";
ALTER TABLE "Configuration" DROP COLUMN "escalationDurationMin";
ALTER TABLE "Configuration" DROP COLUMN "escalationStartedAt";

-- Update defaults
ALTER TABLE "Configuration" ALTER COLUMN "winChance" SET DEFAULT 5.0;
ALTER TABLE "Configuration" ALTER COLUMN "rewardPercent" SET DEFAULT 30.0;
