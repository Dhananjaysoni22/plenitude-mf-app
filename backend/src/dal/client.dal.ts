
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const upsertClient = async (pan: string, updateData: any, createData: any) => {
  return prisma.client.upsert({
    where: { pan },
    update: updateData,
    create: createData
  });
};

export const getAllClients = async () => {
  return prisma.client.findMany({
    include: { rm: { select: { name: true } } },
    orderBy: { name: 'asc' }
  });
};

export const getClientsByRm = async (rmId: string) => {
  return prisma.client.findMany({
    where: { rmId },
    include: { rm: { select: { name: true } } },
    orderBy: { name: 'asc' }
  });
};

export const getClientDetails = async (id: string) => {
  return prisma.client.findUnique({
    where: { id },
    include: {
      rm: { select: { name: true } },
      holdings: {
        include: { researchFund: true },
        orderBy: { currentValue: 'desc' }
      }
    }
  });
};
