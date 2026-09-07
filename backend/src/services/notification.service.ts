import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateQuartileNotifications = async () => {
  // 1. Get all client holdings that are linked to a research fund
  const holdings = await prisma.clientHolding.findMany({
    include: {
      client: {
        include: { rm: true }
      },
      researchFund: true
    }
  });

  let notificationsCreated = 0;

  for (const holding of holdings) {
    if (!holding.researchFund || !holding.client.rm) continue;

    const quartile = holding.researchFund.quartile || '';
    let message = '';
    let type = '';

    if (quartile.includes('Q4') || quartile.includes('BOTTOM')) {
      type = 'Q4_ALERT';
      message = `URGENT (Q4): Your client ${holding.client.name} is holding ${holding.researchFund.name}. This fund is in the Bottom Quartile. You should exit this mutual fund and invest the client's money into a better alternative.`;
    } 
    else if (quartile.includes('Q3') || quartile.includes('BELOW AVERAGE')) {
      type = 'Q3_ALERT';
      message = `WARNING (Q3): Your client ${holding.client.name} is holding ${holding.researchFund.name}. This fund is Below Average. Try to change the strategy or review this holding.`;
    }

    if (message) {
      // Check if we already notified the RM about this exact client and fund recently
      const existing = await prisma.notification.findFirst({
        where: {
          clientId: holding.client.id,
          message: message,
          status: 'PENDING'
        }
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            rmId: holding.client.rm.id,
            clientId: holding.client.id,
            message,
            type
          }
        });
        notificationsCreated++;
      }
    }
  }

  return notificationsCreated;
};

export const generateDrawdownNotifications = async () => {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
  const currentDrawdown = settings?.currentDrawdown || 0;

  const activeRule = await prisma.drawdownRule.findFirst({
    where: {
      minDrawdown: { lte: currentDrawdown },
      maxDrawdown: { gte: currentDrawdown }
    }
  });

  if (!activeRule) return 0;

  const clients = await prisma.client.findMany({
    include: { rm: true }
  });

  let notificationsCreated = 0;

  for (const client of clients) {
    if (!client.rm || client.totalAum === 0) continue;

    const actualEquityPct = (client.equityAum / client.totalAum) * 100;
    const targetEquityPct = activeRule.equityAllocation;

    // Deviation > 5% triggers a rebalance alert
    if (Math.abs(actualEquityPct - targetEquityPct) > 5) {
      const message = `REBALANCE: Market Drawdown is ${currentDrawdown.toFixed(2)}%. Target Equity is ${targetEquityPct}%, but client currently holds ${actualEquityPct.toFixed(1)}%.`;
      
      const existing = await prisma.notification.findFirst({
        where: {
          clientId: client.id,
          type: 'DRAWDOWN_ALERT',
          status: 'PENDING'
        }
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            rmId: client.rm.id,
            clientId: client.id,
            message,
            type: 'DRAWDOWN_ALERT'
          }
        });
        notificationsCreated++;
      }
    }
  }

  return notificationsCreated;
};
