
import { Request, Response } from 'express';
import { loginUser, changePassword as changePasswordService } from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middlewares/auth';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const result = await loginUser(email, password);
  res.json(result);
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) throw new AppError('Unauthorized', 401);
  if (!currentPassword || !newPassword) throw new AppError('Current password and new password are required', 400);

  const result = await changePasswordService(userId, currentPassword, newPassword);
  res.json(result);
});
