import { getAllClients, getClientsByRm, getClientDetails } from '../dal/client.dal';
import { getAllResearchFunds } from '../dal/research.dal';
import { getUnmappedHoldingsGrouped, updateHoldingsMapping, getDatabaseStats, upsertMappingRule } from '../dal/holding.dal';
import { AppError } from '../utils/AppError';
import { PrismaClient } from '@prisma/client';
import { diceCoefficient } from '../utils/similarity';
const prisma = new PrismaClient();

export const fetchClients = async (user: any) => {
  if (user.role === 'ADMIN') return getAllClients();
  return getClientsByRm(user.id);
};

export const fetchClientDetails = async (clientId: string, user: any) => {
  const client = await getClientDetails(clientId);
  if (!client) throw new AppError('Client not found', 404);

  if (user.role === 'RM' && client.rmId !== user.id) {
    throw new AppError('Forbidden. This client belongs to another RM.', 403);
  }

  return client;
};

export const fetchResearchFunds = async () => {
  return getAllResearchFunds();
};

export const fetchClientHistory = async (clientId: string, user: any) => {
  // Ensure RM owns this client (unless Admin)
  if (user.role === 'RM') {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.rmId !== user.id) {
      throw new AppError('Unauthorized access to client history', 403);
    }
  }

  return prisma.clientHistory.findMany({
    where: { clientId },
    orderBy: { date: 'asc' }
  });
};

export const fetchUnmappedFunds = async (user: any) => {
  if (user.role !== 'ADMIN') throw new AppError('Only admins can view unmapped funds', 403);
  
  const grouped = await getUnmappedHoldingsGrouped();
  const researchFunds = await getAllResearchFunds();
  
  const results = [];
  for (const g of grouped) {
    let bestMatch = null;
    let highestScore = 0;
    
    if (!g.fundId) {
      for (const rf of researchFunds) {
        const score = diceCoefficient(g.fundNameRaw, rf.name);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = rf;
        }
      }
    }
    
    results.push({
      fundNameRaw: g.fundNameRaw,
      fundId: g.fundId,
      count: g._count.clientId,
      suggestedFundId: bestMatch && highestScore > 0.4 ? bestMatch.id : null,
      suggestedFundName: bestMatch && highestScore > 0.4 ? bestMatch.name : null,
      confidenceScore: bestMatch && highestScore > 0.4 ? Math.round(highestScore * 100) : 0
    });
  }
  
  return results;
};

export const mapFunds = async (user: any, fundNameRaw: string, researchFundId: string) => {
  if (user.role !== 'ADMIN') throw new AppError('Only admins can map funds', 403);
  if (!fundNameRaw || !researchFundId) throw new AppError('Missing required fields', 400);

  const updated = await updateHoldingsMapping(fundNameRaw, researchFundId);
  await upsertMappingRule(fundNameRaw, researchFundId);
  
  return updated.count;
};

export const fetchGlobalStats = async () => {
  return getDatabaseStats();
}
