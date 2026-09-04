import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getRmIntelligenceService, markClientReviewedService } from '../services/rm.service';

export const getRmIntelligence = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'RM') {
    throw new AppError('Only RMs can access this intelligence dashboard', 403);
  }
  const intelligence = await getRmIntelligenceService(req.user.id);
  res.json(intelligence);
});

export const markReviewed = asyncHandler(async (req: AuthRequest, res: Response) => {
  await markClientReviewedService(req.params.id);
  res.json({ success: true });
});
