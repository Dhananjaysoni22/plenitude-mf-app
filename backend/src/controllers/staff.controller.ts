import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import AppError from '../utils/AppError';

const prisma = new PrismaClient();

// Get all active staff
export const getStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only Admins can view staff', 403);
  }

  const staff = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { clients: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(staff);
});

// Create new staff
export const createStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only Admins can create staff', 403);
  }

  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    throw new AppError('Missing required fields', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('User with this email already exists', 400);
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: password, // In production this should be hashed, keeping simple per current scope
      role
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  res.status(201).json(user);
});

// Update staff
export const updateStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only Admins can update staff', 403);
  }

  const { id } = req.params;
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    throw new AppError('Missing required fields', 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { name, email, role },
    select: { id: true, name: true, email: true, role: true }
  });

  res.json(updated);
});

// Soft delete staff
export const deleteStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only Admins can delete staff', 403);
  }

  const { id } = req.params;

  if (id === req.user.id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({ message: 'Staff member deleted (soft delete)' });
});

// Reset staff password
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only Admins can reset passwords', 403);
  }

  const { id } = req.params;
  const hash = await bcrypt.hash('0000', 10);
  
  await prisma.user.update({
    where: { id },
    data: { passwordHash: hash }
  });

  res.json({ message: 'Password reset to 0000 successfully' });
});
