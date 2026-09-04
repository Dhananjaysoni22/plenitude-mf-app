import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getRmIntelligence, markReviewed } from '../controllers/rm.controller';

const router = Router();

// /api/rm/intelligence
router.get('/intelligence', authenticate, getRmIntelligence);
router.post('/clients/:id/review', authenticate, markReviewed);

export default router;
