import { Router } from 'express';
import { runNotificationEngine, getMyNotifications, resolveNotification } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';

import { runDrawdownScrape } from '../cron/drawdown.cron';

const router = Router();

// Endpoint to trigger the background engine manually for testing
router.post('/trigger', authenticate, runNotificationEngine);
router.post('/scrape', async (req, res) => {
  await runDrawdownScrape();
  res.json({ message: 'Scrape finished' });
});

// Endpoint for RM/Admin to fetch their alerts
router.get('/', authenticate, getMyNotifications);

// Endpoint to mark an alert as resolved
router.put('/:id/resolve', authenticate, resolveNotification);

export default router;
