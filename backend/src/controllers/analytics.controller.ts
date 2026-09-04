import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getFirmAnalyticsService } from '../services/analytics.service';

export const getRmAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Unauthorized', 403);
  }
  const analyticsData = await getFirmAnalyticsService();
  res.json(analyticsData);
});
