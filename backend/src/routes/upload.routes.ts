import { Router } from 'express';
import { upload } from '../middlewares/upload';
import { uploadClients, uploadResearch, uploadHoldings, uploadBulkPortfolios } from '../controllers/upload.controller';

const router = Router();

// /api/upload/clients
router.post('/clients', upload.single('file'), uploadClients);

// /api/upload/research
router.post('/research', upload.single('file'), uploadResearch);

// /api/upload/holdings
router.post('/holdings', upload.single('file'), uploadHoldings);

// /api/upload/portfolios/bulk
router.post('/portfolios/bulk', upload.array('files', 500), uploadBulkPortfolios);

export default router;
