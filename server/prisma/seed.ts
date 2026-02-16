import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.configuration.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      tokenCA: "To be added",
      requiredHoldings: 500000,
      minSolTransfer: 0.01,
      winChanceStart: 2.0,
      winChanceEnd: 8.0,
      rewardPercentStart: 40.0,
      rewardPercentEnd: 10.0,
      escalationDurationMin: 60,
      timerDurationSec: 300,
      paused: false,
    },
  });

  console.log("Seeded configuration:", config);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
