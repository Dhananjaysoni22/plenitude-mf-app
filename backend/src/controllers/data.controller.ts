
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

const prisma = new PrismaClient();
import { AuthRequest } from '../middlewares/auth';
import { 
  fetchClients, 
  fetchClientDetails, 
  fetchResearchFunds, 
  fetchUnmappedFunds, 
  mapFunds,
  fetchGlobalStats
} from '../services/data.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export const getClients = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const clients = await fetchClients(req.user);
  res.json(clients);
});

export const getClientById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const client = await fetchClientDetails(req.params.id, req.user);
  res.json(client);
});

export const getClientHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  // Need to import fetchClientHistory from service!
  // I will just add the import via a separate instruction if it fails, but I can use require directly or just add it to import list.
  // Wait, I must add it to the import list at the top of data.controller.ts!
  const { fetchClientHistory } = require('../services/data.service');
  const history = await fetchClientHistory(req.params.id, req.user);
  res.json(history);
});

export const getResearchFunds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const funds = await fetchResearchFunds();
  res.json(funds);
});

export const getUnmappedFunds = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const unmapped = await fetchUnmappedFunds(req.user);
  res.json(unmapped);
});

export const mapFund = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const count = await mapFunds(req.user, req.body.fundNameRaw, req.body.researchFundId);
  res.json({ message: `Successfully mapped ${count} holdings.` });
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await fetchGlobalStats();
  res.json(stats);
});

export const getDrawdownData = async (req: any, res: any) => {
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const currentDrawdown = settings?.currentDrawdown || 0;
    
    const history = await prisma.marketHistory.findMany({
      orderBy: { date: 'desc' },
      take: 7
    });

    const activeRule = await prisma.drawdownRule.findFirst({
      where: {
        minDrawdown: { lte: currentDrawdown },
        maxDrawdown: { gte: currentDrawdown }
      }
    });

    // Also get all rules for the admin grid
    const allRules = await prisma.drawdownRule.findMany({ orderBy: { step: 'asc' }});

    res.json({
      currentDrawdown,
      activeRule,
      history: history.reverse(),
      allRules
    });
  } catch (err) {
    console.error('getDrawdownData ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch drawdown data' });
  }
};
