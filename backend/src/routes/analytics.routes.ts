import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getRmAnalytics } from '../controllers/analytics.controller';

const router = Router();

// /api/analytics/rms
router.get('/rms', authenticate, getRmAnalytics);

export default router;
