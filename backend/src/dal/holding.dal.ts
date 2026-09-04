
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const createHolding = async (data: any) => {
  return prisma.clientHolding.create({ data });
};

export const deleteHoldings = async () => {
  return prisma.clientHolding.deleteMany({});
};

export const getUnmappedHoldingsGrouped = async () => {
  return prisma.clientHolding.groupBy({
    by: ['fundNameRaw', 'fundId'],
    _count: { clientId: true },
    orderBy: { fundNameRaw: 'asc' }
  });
};

export const updateHoldingsMapping = async (fundNameRaw: string, researchFundId: string) => {
  return prisma.clientHolding.updateMany({
    where: { fundNameRaw },
    data: { fundId: researchFundId }
  });
};

export const getDatabaseStats = async () => {
  const clientsCount = await prisma.client.count();
  const rmsCount = await prisma.user.count({ where: { role: 'RM' } });
  const fundsCount = await prisma.researchFund.count();
  const holdingsCount = await prisma.clientHolding.count();
  return { clientsCount, rmsCount, fundsCount, holdingsCount };
};

export const upsertMappingRule = async (rawName: string, researchFundId: string) => {
  return prisma.fundMappingRule.upsert({
    where: { rawName },
    update: { researchFundId },
    create: { rawName, researchFundId }
  });
};

export const getMappingRule = async (rawName: string) => {
  return prisma.fundMappingRule.findUnique({
    where: { rawName }
  });
};
