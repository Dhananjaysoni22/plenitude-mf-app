
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const upsertResearchFund = async (name: string, updateData: any, createData: any) => {
  return prisma.researchFund.upsert({
    where: { name },
    update: updateData,
    create: createData
  });
};

export const getAllResearchFunds = async () => {
  return prisma.researchFund.findMany({
    orderBy: { name: 'asc' }
  });
};

export const findResearchFundByName = async (name: string) => {
  return prisma.researchFund.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } }
  });
};
