const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const count = await prisma.drawdownRule.count();
  if (count === 0) {
    await prisma.drawdownRule.createMany({
      data: [
        { step: 1, minDrawdown: 0, maxDrawdown: 5, equityAllocation: 60, debtAllocation: 40 },
        { step: 2, minDrawdown: 5, maxDrawdown: 10, equityAllocation: 70, debtAllocation: 30 },
        { step: 3, minDrawdown: 10, maxDrawdown: 15, equityAllocation: 80, debtAllocation: 20 },
        { step: 4, minDrawdown: 15, maxDrawdown: 20, equityAllocation: 90, debtAllocation: 10 },
        { step: 5, minDrawdown: 20, maxDrawdown: 100, equityAllocation: 100, debtAllocation: 0 }
      ]
    });
    console.log('Seeded rules!');
  } else {
    console.log('Rules already exist.');
  }
}
seed().catch(console.error);
