import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mockHoldings() {
  const clients = await prisma.client.findMany();
  
  // Fetch some Q4 funds
  const badFunds = await prisma.researchFund.findMany({
    where: {
      quartile: { contains: 'Q4' }
    },
    take: 5
  });

  // Fetch some Q3 funds
  const warningFunds = await prisma.researchFund.findMany({
    where: {
      quartile: { contains: 'Q3' }
    },
    take: 5
  });

  if (badFunds.length === 0 || warningFunds.length === 0) {
    console.log("No Q4 or Q3 funds found in DB. Did you upload the research sheet?");
    return;
  }

  console.log('Mocking holdings for clients...');

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    
    // Assign 1 bad fund and 1 warning fund to every alternate client
    if (i % 2 === 0) {
      await prisma.clientHolding.create({
        data: {
          clientId: client.id,
          fundId: badFunds[i % badFunds.length].id,
          fundNameRaw: badFunds[i % badFunds.length].name,
          investedAmount: 50000,
          currentValue: 45000
        }
      });
    } else {
      await prisma.clientHolding.create({
        data: {
          clientId: client.id,
          fundId: warningFunds[i % warningFunds.length].id,
          fundNameRaw: warningFunds[i % warningFunds.length].name,
          investedAmount: 100000,
          currentValue: 105000
        }
      });
    }
  }

  console.log('Done mocking holdings!');
}

mockHoldings().finally(() => prisma.$disconnect());
