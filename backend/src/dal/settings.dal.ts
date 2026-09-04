import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getSystemSettingsDal = async () => {
  return prisma.systemSettings.findUnique({ where: { id: 'default' } });
};

export const createDefaultSettingsDal = async (days: number) => {
  return prisma.systemSettings.create({ data: { id: 'default', reviewThresholdDays: days } });
};

export const upsertSystemSettingsDal = async (days: number) => {
  return prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: { reviewThresholdDays: days },
    create: { id: 'default', reviewThresholdDays: days }
  });
};
