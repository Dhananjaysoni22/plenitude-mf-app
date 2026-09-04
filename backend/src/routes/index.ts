import { Router } from 'express';
import uploadRoutes from './upload.routes';
import dataRoutes from './data.routes';
import authRoutes from './auth.routes';
import notificationRoutes from './notification.routes';
import staffRoutes from './staff.routes';
import analyticsRoutes from './analytics.routes';
import rmRoutes from './rm.routes';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Modularize routes cleanly
router.use('/auth', authRoutes);
router.use('/upload', authenticate, uploadRoutes);
router.use('/data', dataRoutes);
router.use('/notifications', notificationRoutes);
router.use('/staff', authenticate, staffRoutes);
router.use('/analytics', authenticate, analyticsRoutes);
router.use('/rm', authenticate, rmRoutes);

export default router;
