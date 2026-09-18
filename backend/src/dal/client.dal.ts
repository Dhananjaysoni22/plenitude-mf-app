
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const upsertClient = async (pan: string, name: string, updateData: any, createData: any) => {
  const cleanName = name.trim();
  const cleanPan = pan.trim().toUpperCase();

  let existing = null;

  if (cleanPan === 'NO_PAN' || cleanPan.startsWith('UNKNOWN_')) {
    existing = await prisma.client.findFirst({
      where: {
        name: { equals: cleanName, mode: 'insensitive' },
        OR: [
          { pan: 'NO_PAN' },
          { pan: { startsWith: 'UNKNOWN_' } }
        ]
      }
    });
  } else {
    existing = await prisma.client.findFirst({
      where: {
        pan: { equals: cleanPan, mode: 'insensitive' },
        name: { equals: cleanName, mode: 'insensitive' }
      }
    });
    if (!existing) {
      existing = await prisma.client.findFirst({
        where: { pan: { equals: cleanPan, mode: 'insensitive' } }
      });
    }
  }

  if (existing) {
    return prisma.client.update({
      where: { id: existing.id },
      data: {
        ...updateData,
        name: cleanName,
        pan: cleanPan
      }
    });
  }

  return prisma.client.create({
    data: {
      ...createData,
      name: cleanName,
      pan: cleanPan
    }
  });
};

export const cleanupDuplicateClients = async () => {
  try {
    const allClients = await prisma.client.findMany({
      include: { holdings: true, history: true, notifications: true }
    });

    const byName = new Map<string, typeof allClients>();
    for (const c of allClients) {
      const normalizedPan = c.pan === 'NO_PAN' || c.pan.startsWith('UNKNOWN_') ? 'NO_PAN' : c.pan.trim().toUpperCase();
      const key = `${c.name.trim().toLowerCase()}__${normalizedPan}`;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(c);
    }

    let mergedCount = 0;
    for (const [, list] of byName.entries()) {
      if (list.length > 1) {
        list.sort((a, b) => b.holdings.length - a.holdings.length || a.createdAt.getTime() - b.createdAt.getTime());
        const primary = list[0];
        const duplicates = list.slice(1);

        for (const dupe of duplicates) {
          if (dupe.holdings.length > 0) {
            await prisma.clientHolding.updateMany({
              where: { clientId: dupe.id },
              data: { clientId: primary.id }
            });
          }
          if (dupe.history.length > 0) {
            await prisma.clientHistory.updateMany({
              where: { clientId: dupe.id },
              data: { clientId: primary.id }
            });
          }
          if (dupe.notifications.length > 0) {
            await prisma.notification.updateMany({
              where: { clientId: dupe.id },
              data: { clientId: primary.id }
            });
          }
          await prisma.client.delete({ where: { id: dupe.id } });
          mergedCount++;
        }

        if (primary.pan.startsWith('UNKNOWN_')) {
          await prisma.client.update({
            where: { id: primary.id },
            data: { pan: 'NO_PAN' }
          });
        }
      } else if (list[0].pan.startsWith('UNKNOWN_')) {
        await prisma.client.update({
          where: { id: list[0].id },
          data: { pan: 'NO_PAN' }
        });
      }
    }

    if (mergedCount > 0) {
      console.log(`Cleaned up and merged ${mergedCount} duplicate client records.`);
    }
  } catch (err) {
    console.error('Error during duplicate client cleanup:', err);
  }
};

export const getAllClients = async (page: number = 1, limit: number = 100, search: string = '', sortField: string = '', sortDir: string = 'asc') => {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
  const currentDrawdown = settings?.currentDrawdown || 0;
  const activeRule = await prisma.drawdownRule.findFirst({
    where: {
      minDrawdown: { lte: currentDrawdown },
      maxDrawdown: { gte: currentDrawdown }
    }
  });
  const targetEquityPct = activeRule?.equityAllocation || 0;

  let clients = await prisma.client.findMany({
    include: { rm: { select: { name: true } }, notifications: { where: { status: 'PENDING' } } }
  });
  return processClients(clients, page, limit, search, sortField, sortDir, targetEquityPct);
};

export const getClientsByRm = async (rmId: string, page: number = 1, limit: number = 100, search: string = '', sortField: string = '', sortDir: string = 'asc') => {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
  const currentDrawdown = settings?.currentDrawdown || 0;
  const activeRule = await prisma.drawdownRule.findFirst({
    where: {
      minDrawdown: { lte: currentDrawdown },
      maxDrawdown: { gte: currentDrawdown }
    }
  });
  const targetEquityPct = activeRule?.equityAllocation || 0;

  let clients = await prisma.client.findMany({
    where: { rmId },
    include: { rm: { select: { name: true } }, notifications: { where: { status: 'PENDING' } } }
  });
  return processClients(clients, page, limit, search, sortField, sortDir, targetEquityPct);
};

const processClients = (clients: any[], page: number, limit: number, search: string, sortField: string, sortDir: string, targetEquityPct: number) => {
  // 1. Search
  if (search) {
    const s = search.toLowerCase().trim();
    
    // Find all family heads that match directly or have any member matching
    const matchingFamilyHeads = new Set(
      clients
        .filter(c => 
          c.name?.toLowerCase().includes(s) || 
          c.pan?.toLowerCase().includes(s) || 
          c.familyHead?.toLowerCase().includes(s) ||
          c.subBroker?.toLowerCase().includes(s) ||
          c.rm?.name?.toLowerCase().includes(s) ||
          c.notifications?.some((n: any) => n.type.toLowerCase().includes(s))
        )
        .map(c => (c.familyHead && c.familyHead.trim().toLowerCase()) || c.name.trim().toLowerCase())
    );

    clients = clients.filter(c => {
      const directMatch = 
        c.name?.toLowerCase().includes(s) || 
        c.pan?.toLowerCase().includes(s) || 
        c.familyHead?.toLowerCase().includes(s) ||
        c.subBroker?.toLowerCase().includes(s) ||
        c.rm?.name?.toLowerCase().includes(s) ||
        c.notifications?.some((n: any) => n.type.toLowerCase().includes(s));
      
      const fh = (c.familyHead && c.familyHead.trim().toLowerCase()) || c.name.trim().toLowerCase();
      return directMatch || matchingFamilyHeads.has(fh);
    });
  }

  // 2. Data Enrichment
  clients = clients.map(c => {
    let alertScore = 0;
    if (c.notifications?.some((n: any) => n.type === 'Q4_ALERT')) alertScore = 3;
    else if (c.notifications?.some((n: any) => n.type === 'Q3_ALERT')) alertScore = 2;
    else if (c.notifications?.length > 0) alertScore = 1;

    let transferAmount = 0;
    let transferDirection = '';
    
    if (targetEquityPct > 0 && c.totalAum > 0) {
      const targetEquityAum = (targetEquityPct / 100) * c.totalAum;
      if (c.equityAum < targetEquityAum) {
        transferAmount = targetEquityAum - c.equityAum;
        transferDirection = 'DEBT_TO_EQUITY';
      } else if (c.equityAum > targetEquityAum) {
        transferAmount = c.equityAum - targetEquityAum;
        transferDirection = 'EQUITY_TO_DEBT';
      }
    }

    return { 
      ...c, 
      alertScore,
      targetEquityPct,
      transferAmount,
      transferDirection
    };
  });

  // 3. Sort
  clients.sort((a, b) => {
    if (!sortField || sortField === 'alertScore') {
      if (a.alertScore !== b.alertScore) return b.alertScore - a.alertScore; // Always Descending for alerts
      return a.name.localeCompare(b.name);
    }

    const valA = a[sortField];
    const valB = b[sortField];
    
    let comparison = 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      comparison = valA.localeCompare(valB);
    } else {
      comparison = (valA || 0) - (valB || 0);
    }

    return sortDir === 'asc' ? comparison : -comparison;
  });

  // 4. Paginate
  const total = clients.length;
  const data = clients.slice((page - 1) * limit, page * limit);

  return { data, total };
};

export const getClientDetails = async (id: string) => {
  return prisma.client.findUnique({
    where: { id },
    include: {
      rm: { select: { name: true } },
      holdings: {
        include: { researchFund: true },
        orderBy: { currentValue: 'desc' }
      }
    }
  });
};
