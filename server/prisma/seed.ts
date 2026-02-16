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
      winChance: 5.0,
      rewardPercent: 30.0,
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
