import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getRmClientsDal = async (rmId: string) => {
  return prisma.client.findMany({
    where: { rmId },
    include: {
      holdings: { include: { researchFund: true } },
      notifications: { where: { status: 'PENDING' } },
      ClientHistory: { orderBy: { date: 'asc' } }
    }
  });
};

export const updateClientLastReviewDal = async (clientId: string) => {
  return prisma.client.update({
    where: { id: clientId },
    data: { lastPortfolioReview: new Date() }
  });
};
