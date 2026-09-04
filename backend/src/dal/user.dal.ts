
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserByNameAndRole = async (name: string, role: any) => {
  return prisma.user.findFirst({ where: { name, role } });
};

export const createUser = async (data: any) => {
  return prisma.user.create({ data });
};
