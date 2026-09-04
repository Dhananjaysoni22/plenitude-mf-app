import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Alert Test Data for NILIMA CHOUHAN...');

  // 1. Create or Find Nilima
  let rm = await prisma.user.findFirst({
    where: { name: { contains: 'NILIMA', mode: 'insensitive' } }
  });

  if (!rm) {
    rm = await prisma.user.create({
      data: {
        name: 'NILIMA CHOUHAN',
        email: 'nilima@plenitude.com',
        passwordHash: 'password123', 
        role: 'RM'
      }
    });
    console.log('✅ Created RM: NILIMA CHOUHAN');
  } else {
    console.log('✅ Found existing RM:', rm.name);
  }

  // 2. Create a Test Client for Nilima
  const client = await prisma.client.upsert({
    where: { pan: 'NILIMACLIENT1' },
    update: {},
    create: {
      name: 'Mr. Sharma (Test)',
      pan: 'NILIMACLIENT1',
      rmId: rm.id,
      totalAum: 1200000,
      equityAum: 1200000
    }
  });
  console.log('✅ Client created:', client.name);

  // 3. Ensure we have some Q3 and Q4 Research Funds
  const q3Fund = await prisma.researchFund.upsert({
    where: { name: 'HDFC Mid-Cap Opportunities (Q3)' },
    update: {},
    create: {
      name: 'HDFC Mid-Cap Opportunities (Q3)',
      category: 'Equity - Mid Cap',
      quartile: 'Q3 - BELOW AVERAGE',
      aum: 50000
    }
  });

  const q4Fund = await prisma.researchFund.upsert({
    where: { name: 'Axis Bluechip Fund (Q4)' },
    update: {},
    create: {
      name: 'Axis Bluechip Fund (Q4)',
      category: 'Equity - Large Cap',
      quartile: 'Q4 - BOTTOM QUARTILE',
      aum: 35000
    }
  });
  console.log('✅ Bad Research Funds (Q3 & Q4) confirmed');

  // 4. Create Holdings linking the Client to the Funds
  // Clean up any old test holdings for this specific test client
  await prisma.clientHolding.deleteMany({
    where: { clientId: client.id }
  });

  await prisma.clientHolding.createMany({
    data: [
      {
        clientId: client.id,
        fundId: q3Fund.id,
        fundNameRaw: q3Fund.name,
        currentValue: 500000
      },
      {
        clientId: client.id,
        fundId: q4Fund.id,
        fundNameRaw: q4Fund.name,
        currentValue: 700000
      }
    ]
  });
  console.log("✅ Bad holdings added to Mr. Sharma's portfolio");

  console.log('🎉 Seeding complete! You can now test the Alert Engine.');
  console.log('Login Email for RM:', rm.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
