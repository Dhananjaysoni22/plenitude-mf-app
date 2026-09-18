
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const upsertResearchFund = async (name: string, updateData: any, createData: any) => {
  return prisma.researchFund.upsert({
    where: { name },
    update: updateData,
    create: createData
  });
};

export const getRawResearchFunds = async () => {
  return prisma.researchFund.findMany({
    orderBy: { name: 'asc' }
  });
};

export const getAllResearchFunds = async (page: number = 1, limit: number = 100, search: string = '', sortField: string = 'name', sortDir: string = 'asc') => {
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { category: { contains: search, mode: 'insensitive' as const } },
      { primaryAsset: { contains: search, mode: 'insensitive' as const } }
    ]
  } : {};

  const [data, total] = await Promise.all([
    prisma.researchFund.findMany({
      where,
      orderBy: { [sortField || 'name']: sortDir || 'asc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.researchFund.count({ where })
  ]);
  return { data, total };
};

export const findResearchFundByName = async (name: string) => {
  return prisma.researchFund.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } }
  });
};
