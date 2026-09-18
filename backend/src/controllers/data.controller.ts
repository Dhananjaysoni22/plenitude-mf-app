
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const search = (req.query.search as string) || '';
  const sortField = (req.query.sortField as string) || '';
  const sortDir = (req.query.sortDir as string) || 'asc';
  const result = await fetchClients(req.user, page, limit, search, sortField, sortDir);
  res.json(result);
});

export const getClientById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const client = await fetchClientDetails(req.params.id as string, req.user);
  res.json(client);
});

export const getClientHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  // Need to import fetchClientHistory from service!
  // I will just add the import via a separate instruction if it fails, but I can use require directly or just add it to import list.
  // Wait, I must add it to the import list at the top of data.controller.ts!
  const { fetchClientHistory } = require('../services/data.service');
  const history = await fetchClientHistory(req.params.id as string, req.user);
  res.json(history);
});

export const getResearchFunds = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const search = (req.query.search as string) || '';
  const sortField = (req.query.sortField as string) || 'name';
  const sortDir = (req.query.sortDir as string) || 'asc';
  const funds = await fetchResearchFunds(page, limit, search, sortField, sortDir);
  res.json(funds);
});

export const getRawResearchFundsController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { getRawResearchFunds } = require('../dal/research.dal');
  const funds = await getRawResearchFunds();
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
import * as xlsx from 'xlsx';

export const exportClientExcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Unauthorized', 401);
  const client = await fetchClientDetails(req.params.id as string, req.user);
  if (!client) throw new AppError('Client not found', 404);

  const columns = req.body.columns || [
    { id: 'fundNameRaw', label: 'Scheme Name' },
    { id: 'researchFund', label: 'Research Fund Mapping' },
    { id: 'currentValue', label: 'Current Value' }
  ];

  const wsData: any[][] = [
    ['Client Name', client.name],
    ['PAN', client.pan],
    ['Family Head', client.familyHead || '-'],
    ['Sub Broker', client.subBroker || '-'],
    ['RM', client.rm?.name || 'Unassigned'],
    ['Total AUM', client.totalAum],
    [],
    columns.map((c: any) => c.label)
  ];

  client.holdings?.forEach((h: any) => {
    const row = columns.map((c: any) => {
      let val = h[c.id];
      if (c.id === 'researchFund') val = h.researchFund?.name;
      if (c.id === 'category') val = h.researchFund?.category;
      if (c.id === 'quartile') val = h.researchFund?.quartile;
      return val !== null && val !== undefined ? val : '-';
    });
    wsData.push(row);
  });

  const ws = xlsx.utils.aoa_to_sheet(wsData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Portfolio");
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', `attachment; filename="${client.name}_Portfolio.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});
