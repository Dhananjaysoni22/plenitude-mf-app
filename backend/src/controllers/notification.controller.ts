import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateQuartileNotifications, generateDrawdownNotifications } from '../services/notification.service';
import { AuthRequest } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

export const runNotificationEngine = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only Admins can trigger the alert engine', 403);
  }
  const qCount = await generateQuartileNotifications();
  const dCount = await generateDrawdownNotifications();
  res.json({ message: `Successfully generated ${qCount} quartile alerts and ${dCount} drawdown alerts.` });
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

  let notifications = await prisma.notification.findMany({
    where: whereClause,
    include: {
      client: { select: { name: true } },
      rm: { select: { name: true } }
    }
  });

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const search = ((req.query.search as string) || '').toLowerCase();
  const sortField = (req.query.sortField as string) || 'priority';
  const sortDir = (req.query.sortDir as string) || 'desc';

  if (search) {
    notifications = notifications.filter((n: any) => 
      n.client?.name?.toLowerCase().includes(search) || 
      n.message?.toLowerCase().includes(search) ||
      n.type?.toLowerCase().includes(search)
    );
  }

  notifications = notifications.map((n: any) => {
    let priority = 0;
    if (n.type === 'Q4_ALERT') priority = 3;
    else if (n.type === 'Q3_ALERT') priority = 2;
    else if (n.type === 'DRAWDOWN_ALERT') priority = 1;
    return { ...n, priority };
  });

  notifications.sort((a: any, b: any) => {
    let comparison = 0;
    if (sortField === 'priority') {
      comparison = a.priority - b.priority;
      if (comparison === 0) comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortField === 'client') {
      comparison = (a.client?.name || '').localeCompare(b.client?.name || '');
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    } else if (sortField === 'date') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return sortDir === 'asc' ? comparison : -comparison;
  });

  const total = notifications.length;
  const paginatedData = notifications.slice((page - 1) * limit, page * limit);

  res.json({ data: paginatedData, total });
});

export const resolveNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) throw new AppError('Unauthorized', 401);

  const id = req.params.id as string;
  const { resolutionNote } = req.body;

  if (!resolutionNote || resolutionNote.trim() === '') {
    throw new AppError('Resolution note is required to resolve an alert', 400);
  }

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
      resolutionNote,
      resolvedAt: new Date()
    }
  });

  res.json(updated);
});
