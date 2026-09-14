import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed plan configs (admin-overridable pricing).
  const plans = [
    { tier: "FREE", name: "Free", priceMonthly: 0, priceYearly: 0 },
    { tier: "PREMIUM", name: "Premium", priceMonthly: 7.99, priceYearly: 79.99 },
    { tier: "ENTERPRISE", name: "Enterprise", priceMonthly: 29.99, priceYearly: 299.99 },
  ];
  for (const p of plans) {
    await prisma.planConfig.upsert({
      where: { tier: p.tier },
      create: p,
      update: { name: p.name, priceMonthly: p.priceMonthly, priceYearly: p.priceYearly },
    });
  }

  await prisma.platformSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", maintenanceMode: false },
    update: {},
  });

  console.log("Seed complete: plan configs + platform settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
