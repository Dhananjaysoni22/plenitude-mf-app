import { Router } from 'express';
import { getClients, getResearchFunds, getRawResearchFundsController, getClientById, getUnmappedFunds, mapFund, getStats, getClientHistory, getDrawdownData } from '../controllers/data.controller';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/drawdown', authenticate, getDrawdownData);

router.get('/clients', authenticate, getClients);
router.get('/clients/:id', authenticate, getClientById);
router.get('/clients/:id/history', authenticate, getClientHistory);
router.get('/research', authenticate, getResearchFunds);
router.get('/research/all', authenticate, getRawResearchFundsController);
router.get('/unmapped', authenticate, getUnmappedFunds);
router.post('/map', authenticate, mapFund);
router.get('/stats', getStats); // We moved stats here from index.ts!
router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, updateSettings);

export default router;
