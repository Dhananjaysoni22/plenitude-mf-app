import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getTopWhalesDal = async (limit: number) => {
  return prisma.client.findMany({
    orderBy: { totalAum: 'desc' },
    take: limit,
    include: { rm: { select: { name: true } } }
  });
};

export const getRmsWithAnalyticsDataDal = async () => {
  return prisma.user.findMany({
    where: { role: 'RM', isActive: true },
    include: {
      clients: {
        include: {
          holdings: { include: { researchFund: true } },
          ClientHistory: { orderBy: { date: 'asc' } }
        }
      },
      notifications: true
    }
  });
};

export const getUnmappedHoldingsCountDal = async () => {
  return prisma.clientHolding.count({
    where: { fundId: null }
  });
};

export const getUnmappedUniqueCountDal = async () => {
  const unmappedFunds = await prisma.clientHolding.groupBy({
    by: ['fundNameRaw'],
    where: { fundId: null }
  });
  return unmappedFunds.length;
};
