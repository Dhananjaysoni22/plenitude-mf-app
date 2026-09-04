import { getRmClientsDal, updateClientLastReviewDal } from '../dal/rm.dal';
import { getSystemSettingsDal } from '../dal/settings.dal';

export const getRmIntelligenceService = async (rmId: string) => {
  const clients = await getRmClientsDal(rmId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const settings = await getSystemSettingsDal();
  const thresholdDays = settings?.reviewThresholdDays || 45;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

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

    if (client.ClientHistory && client.ClientHistory.length > 0) {
      const pastSnapshots = client.ClientHistory.filter((h: any) => h.date < thirtyDaysAgo);
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
    
    if (isOverExposed || client.notifications.length > 0 || isOverdue) {
      callList.push({
        clientId: client.id,
        name: client.name,
        equityRatio: equityRatio * 100,
        alerts: client.notifications.length,
        isOverExposed,
        isOverdue,
        daysSinceReview
      });
    }
  });

  clientGrowth.sort((a, b) => a.growth - b.growth);
  const flightRisk = clientGrowth.slice(0, 5);

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
