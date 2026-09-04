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
      // For simplicity, we just create it. In production, add a unique constraint or check.
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

  return notificationsCreated;
};
