import { getTopWhalesDal, getRmsWithAnalyticsDataDal, getUnmappedHoldingsCountDal, getUnmappedUniqueCountDal } from '../dal/analytics.dal';
import { getSystemSettingsDal } from '../dal/settings.dal';

export const getFirmAnalyticsService = async () => {
  const whales = await getTopWhalesDal(5);
  const formattedWhales = whales.map(w => ({
    clientName: w.name,
    totalAum: w.totalAum,
    rmName: w.rm?.name || 'Unassigned'
  }));

  const rms = await getRmsWithAnalyticsDataDal();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const settings = await getSystemSettingsDal();
  const reviewThresholdDays = settings?.reviewThresholdDays || 45;
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - reviewThresholdDays);

  const analytics = rms.map((rm: any) => {
    let totalAum = 0; let equityAum = 0; let debtAum = 0; let hybridAum = 0;
    let goodAum = 0; let badAum = 0; let q4Aum = 0; let unmappedAum = 0;
    let overdueReviews = 0; let growth30Day = 0;
    
    const totalClients = rm.clients.length;
    const monthlyHistoryMap: { [key: string]: number } = {};

    rm.clients.forEach((client: any) => {
      totalAum += client.totalAum || 0;
      equityAum += client.equityAum || 0;
      debtAum += client.debtAum || 0;
      hybridAum += client.hybridAum || 0;

      if (!client.lastPortfolioReview || client.lastPortfolioReview < thresholdDate) {
        overdueReviews++;
      }
      
      client.holdings.forEach((holding: any) => {
        const value = holding.currentValue || 0;
        if (!holding.researchFund) {
          unmappedAum += value;
        } else {
          const q = holding.researchFund.quartile;
          if (q === 'Q1' || q === 'Q2') goodAum += value;
          else if (q === 'Q3' || q === 'Q4') {
            badAum += value;
            if (q === 'Q4') q4Aum += value;
          } else unmappedAum += value;
        }
      });

      if (client.ClientHistory && client.ClientHistory.length > 0) {
        client.ClientHistory.forEach((h: any) => {
          const dateStr = h.date.toISOString().substring(0, 7);
          if (!monthlyHistoryMap[dateStr]) monthlyHistoryMap[dateStr] = 0;
          monthlyHistoryMap[dateStr] += h.totalAum || 0;
        });

        const pastSnapshots = client.ClientHistory.filter((h: any) => h.date < thirtyDaysAgo);
        if (pastSnapshots.length > 0) {
          const oldestRecent = pastSnapshots[pastSnapshots.length - 1];
          growth30Day += ((client.totalAum || 0) - (oldestRecent.totalAum || 0));
        }
      }
    });

    const pendingAlerts = rm.notifications.filter((n: any) => n.status === 'PENDING').length;
    const escalatedAlerts = rm.notifications.filter((n: any) => n.status === 'ESCALATED').length;
    const resolvedAlertsArray = rm.notifications.filter((n: any) => n.status === 'RESOLVED' && n.resolvedAt);
    
    let totalResolutionDays = 0;
    resolvedAlertsArray.forEach((n: any) => {
      totalResolutionDays += (n.resolvedAt.getTime() - n.createdAt.getTime()) / (1000 * 3600 * 24);
    });
    const avgResolutionDays = resolvedAlertsArray.length > 0 ? (totalResolutionDays / resolvedAlertsArray.length) : 0;

    const mappedAum = goodAum + badAum;
    const qualityPercentage = mappedAum > 0 ? (goodAum / mappedAum) * 100 : 0;

    const history = Object.keys(monthlyHistoryMap)
      .sort()
      .map(date => ({ date, aum: monthlyHistoryMap[date] }));

    return {
      id: rm.id, name: rm.name, totalClients, totalAum, equityAum, debtAum, hybridAum,
      goodAum, badAum, q4Aum, unmappedAum, qualityPercentage, growth30Day, overdueReviews, history,
      alerts: { pending: pendingAlerts, escalated: escalatedAlerts, resolved: resolvedAlertsArray.length, avgResolutionDays }
    };
  });

  analytics.sort((a, b) => b.totalAum - a.totalAum);

  const unmappedHoldingsCount = await getUnmappedHoldingsCountDal();
  const unmappedUniqueCount = await getUnmappedUniqueCountDal();

  return { rms: analytics, whales: formattedWhales, unmappedHoldingsCount, unmappedUniqueCount };
};
