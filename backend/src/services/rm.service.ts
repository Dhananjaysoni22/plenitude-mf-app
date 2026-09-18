import { getRmClientsDal, updateClientLastReviewDal } from '../dal/rm.dal';
import { getSystemSettingsDal } from '../dal/settings.dal';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRmIntelligenceService = async (rmId: string) => {
  const clients = await getRmClientsDal(rmId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const settings = await getSystemSettingsDal();
  const thresholdDays = settings?.reviewThresholdDays || 45;
  const currentDrawdown = settings?.currentDrawdown || 0;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

  const activeRule = await prisma.drawdownRule.findFirst({
    where: {
      minDrawdown: { lte: currentDrawdown },
      maxDrawdown: { gte: currentDrawdown }
    }
  });
  const targetEquityPct = activeRule?.equityAllocation || 0;

  let totalQ1 = 0; let totalQ2 = 0; let totalQ3 = 0; let totalQ4 = 0; let totalUnmapped = 0;
  let q4Aum = 0;
  const clientGrowth: any[] = [];
  const callList: any[] = [];

  clients.forEach(client => {
    client.holdings.forEach(h => {
      const v = h.currentValue || 0;
      if (!h.researchFund) totalUnmapped += v;
      else if (h.researchFund.quartile === 'Q1') totalQ1 += v;
      else if (h.researchFund.quartile === 'Q2') totalQ2 += v;
      else if (h.researchFund.quartile === 'Q3') totalQ3 += v;
      else if (h.researchFund.quartile === 'Q4') {
        totalQ4 += v;
        q4Aum += v;
      }
    });

    if (client.history && client.history.length > 0) {
      const pastSnapshots = client.history.filter((h: any) => h.date < thirtyDaysAgo);
      if (pastSnapshots.length > 0) {
        const oldestRecent = pastSnapshots[pastSnapshots.length - 1];
        const growth = (client.totalAum || 0) - (oldestRecent.totalAum || 0);
        if (growth < 0) {
          clientGrowth.push({ clientId: client.id, name: client.name, growth });
        }
      }
    }

    const equityRatio = client.totalAum > 0 ? (client.equityAum / client.totalAum) : 0;
    const isOverExposed = equityRatio > 0.85;
    
    let isOverdue = false;
    let daysSinceReview = 0;
    if (client.lastPortfolioReview) {
      isOverdue = client.lastPortfolioReview < thresholdDate;
      daysSinceReview = Math.floor((new Date().getTime() - new Date(client.lastPortfolioReview).getTime()) / (1000 * 3600 * 24));
    } else {
      isOverdue = true;
      daysSinceReview = thresholdDays;
    }

    let transferAmount = 0;
    let transferDirection = '';
    
    if (targetEquityPct > 0 && client.totalAum > 0) {
      const targetEquityAum = (targetEquityPct / 100) * client.totalAum;
      if (client.equityAum < targetEquityAum) {
        transferAmount = targetEquityAum - client.equityAum;
        transferDirection = 'DEBT_TO_EQUITY';
      } else if (client.equityAum > targetEquityAum) {
        transferAmount = client.equityAum - targetEquityAum;
        transferDirection = 'EQUITY_TO_DEBT';
      }
    }
    
    callList.push({
      clientId: client.id,
      name: client.name,
      pan: client.pan,
      familyHead: client.familyHead || null,
      equityAum: client.equityAum,
      debtAum: client.debtAum,
      totalAum: client.totalAum,
      equityRatio: equityRatio * 100,
      targetEquityPct,
      transferAmount,
      transferDirection,
      alerts: client.notifications.length,
      alertTypes: Array.from(new Set(client.notifications.map((n: any) => n.type))),
      isOverExposed,
      isOverdue,
      daysSinceReview
    });
  });

  clientGrowth.sort((a, b) => a.growth - b.growth);
  const flightRisk = clientGrowth.slice(0, 5);

  // Sort CallList by alerts first, then overdue
  callList.sort((a, b) => b.alerts - a.alerts || b.daysSinceReview - a.daysSinceReview);

  const quartilesArray = [
    { name: 'Q1 (Top Quartile)', value: totalQ1 },
    { name: 'Q2 (Upper Mid)', value: totalQ2 },
    { name: 'Q3 (Lower Mid)', value: totalQ3 },
    { name: 'Q4 (Bottom Quartile)', value: totalQ4 },
    { name: 'Unmapped / Unknown', value: totalUnmapped }
  ];

  return {
    quartiles: quartilesArray,
    q4Aum,
    flightRisk,
    callList
  };
};

export const markClientReviewedService = async (clientId: string) => {
  return updateClientLastReviewDal(clientId);
};
