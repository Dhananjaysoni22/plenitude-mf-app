import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getSystemSettingsService, updateSystemSettingsService } from '../services/settings.service';

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await getSystemSettingsService();
  res.json(settings);
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Only Admins can update system settings', 403);
  }
  const { reviewThresholdDays } = req.body;
  if (reviewThresholdDays === undefined) {
    throw new AppError('reviewThresholdDays is required', 400);
  }
  const settings = await updateSystemSettingsService(Number(reviewThresholdDays));
  res.json(settings);
});
