import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getSystemSettingsDal = async () => {
  return prisma.systemSettings.findUnique({ where: { id: 'default' } });
};

export const createDefaultSettingsDal = async (days: number) => {
  return prisma.systemSettings.create({ data: { id: 'default', reviewThresholdDays: days } });
};

export const upsertSystemSettingsDal = async (updates: any) => {
  return prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: updates,
    create: { id: 'default', ...updates }
  });
};
