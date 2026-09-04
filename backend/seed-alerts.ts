import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Alert Test Data...');

  // 1. Create a Test RM
  const rm = await prisma.user.upsert({
    where: { email: 'test.rm@plenitude.com' },
    update: {},
    create: {
      name: 'Test RM',
      email: 'test.rm@plenitude.com',
      passwordHash: 'defaultpassword', // Assuming hash isn't strictly needed for simple seed just to link relations
      role: 'RM'
    }
  });
  console.log('✅ RM created:', rm.name);

  // 2. Create a Test Client
  const client = await prisma.client.upsert({
    where: { pan: 'TESTPAN123' },
    update: {},
    create: {
      name: 'Test Client For Alerts',
      pan: 'TESTPAN123',
      rmId: rm.id,
      totalAum: 500000,
      equityAum: 500000
    }
  });
  console.log('✅ Client created:', client.name);

  // 3. Create Q3 and Q4 Research Funds
  const q3Fund = await prisma.researchFund.upsert({
    where: { name: 'Seed Fund - Yellow Cap (Q3)' },
    update: {},
    create: {
      name: 'Seed Fund - Yellow Cap (Q3)',
      category: 'Equity',
      quartile: 'Q3 - BELOW AVERAGE',
      aum: 1000
    }
  });

  const q4Fund = await prisma.researchFund.upsert({
    where: { name: 'Seed Fund - Red Cap (Q4)' },
    update: {},
    create: {
      name: 'Seed Fund - Red Cap (Q4)',
      category: 'Equity',
      quartile: 'Q4 - BOTTOM QUARTILE',
      aum: 500
    }
  });
  console.log('✅ Research Funds (Q3 & Q4) created');

  // 4. Create Holdings linking the Client to the Funds
  // Delete existing ones for this client just in case
  await prisma.clientHolding.deleteMany({
    where: { clientId: client.id }
  });

  await prisma.clientHolding.createMany({
    data: [
      {
        clientId: client.id,
        fundId: q3Fund.id,
        fundNameRaw: q3Fund.name,
        currentValue: 200000
      },
      {
        clientId: client.id,
        fundId: q4Fund.id,
        fundNameRaw: q4Fund.name,
        currentValue: 300000
      }
    ]
  });
  console.log('✅ Client Holdings created linked to Q3/Q4 funds');

  console.log('🎉 Seeding complete! You can now test the Alert Engine.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
