import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateQuartileNotifications } from '../services/notification.service';
import { AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import AppError from '../utils/AppError';

const prisma = new PrismaClient();

export const runNotificationEngine = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only Admins can trigger the alert engine', 403);
  }
  const count = await generateQuartileNotifications();
  res.json({ message: `Successfully generated ${count} notifications.` });
});

export const getMyNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError('Unauthorized', 401);
  }

  // Update escalate status before fetching
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  await prisma.notification.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: sevenDaysAgo }
    },
    data: {
      status: 'ESCALATED'
    }
  });

  const whereClause = user.role === 'ADMIN' ? {} : { rmId: user.id };

  const notifications = await prisma.notification.findMany({
    where: whereClause,
    include: {
      client: { select: { name: true } },
      rm: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(notifications);
});

export const resolveNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) throw new AppError('Unauthorized', 401);

  const { id } = req.params;

  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) {
    throw new AppError('Notification not found', 404);
  }

  if (user.role !== 'ADMIN' && notif.rmId !== user.id) {
    throw new AppError('You can only resolve your own alerts', 403);
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date()
    }
  });

  res.json(updated);
});
