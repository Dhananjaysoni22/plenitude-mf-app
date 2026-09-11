
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const upsertClient = async (pan: string, name: string, updateData: any, createData: any) => {
  return prisma.client.upsert({
    where: { pan_name: { pan, name } },
    update: updateData,
    create: createData
  });
};

export const getAllClients = async (page: number = 1, limit: number = 100, search: string = '', sortField: string = '', sortDir: string = 'asc') => {
  let clients = await prisma.client.findMany({
    include: { rm: { select: { name: true } }, notifications: { where: { status: 'PENDING' } } }
  });
  return processClients(clients, page, limit, search, sortField, sortDir);
};

export const getClientsByRm = async (rmId: string, page: number = 1, limit: number = 100, search: string = '', sortField: string = '', sortDir: string = 'asc') => {
  let clients = await prisma.client.findMany({
    where: { rmId },
    include: { rm: { select: { name: true } }, notifications: { where: { status: 'PENDING' } } }
  });
  return processClients(clients, page, limit, search, sortField, sortDir);
};

const processClients = (clients: any[], page: number, limit: number, search: string, sortField: string, sortDir: string) => {
  // 1. Search
  if (search) {
    const s = search.toLowerCase();
    clients = clients.filter(c => 
      c.name?.toLowerCase().includes(s) || 
      c.pan?.toLowerCase().includes(s) || 
      c.rm?.name?.toLowerCase().includes(s) ||
      c.notifications?.some((n: any) => n.type.toLowerCase().includes(s))
    );
  }

  // 2. Alert Priority Calculation
  clients = clients.map(c => {
    let alertScore = 0;
    if (c.notifications?.some((n: any) => n.type === 'Q4_ALERT')) alertScore = 3;
    else if (c.notifications?.some((n: any) => n.type === 'Q3_ALERT')) alertScore = 2;
    else if (c.notifications?.length > 0) alertScore = 1;
    return { ...c, alertScore };
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
