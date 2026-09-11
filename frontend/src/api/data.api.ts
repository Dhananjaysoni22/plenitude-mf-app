import axiosClient from './axiosClient';

export const getStats = () => {
  return axiosClient.get('/data/stats'); // Note: previously it called /api/stats, wait let me check the actual backend route for stats.
};

export const getClients = (page: number = 1, limit: number = 100, search: string = '', sortField: string = '', sortDir: string = 'asc') => {
  return axiosClient.get(`/data/clients?page=${page}&limit=${limit}&search=${search}&sortField=${sortField}&sortDir=${sortDir}`);
};

export const getClientDetails = (id: string) => {
  return axiosClient.get(`/data/clients/${id}`);
};

export const getClientHistory = (id: string) => {
  return axiosClient.get(`/data/clients/${id}/history`);
};

export const getResearchFunds = (page: number = 1, limit: number = 100, search: string = '', sortField: string = '', sortDir: string = 'asc') => {
  return axiosClient.get(`/data/research?page=${page}&limit=${limit}&search=${search}&sortField=${sortField}&sortDir=${sortDir}`);
};

export const getRawResearchFunds = () => {
  return axiosClient.get('/data/research/all');
};

export const getMappingRules = () => {
  return axiosClient.get('/data/mapping');
};

export const getUnmappedHoldings = () => {
  return axiosClient.get('/data/unmapped');
};

export const mapFund = (data: { fundNameRaw: string; researchFundId: string }) => {
  return axiosClient.post('/data/map', data);
};

export const getSystemSettings = () => axiosClient.get('/data/settings');
export const updateSystemSettings = (data: any) => axiosClient.put('/data/settings', data);
export const getDrawdownData = () => axiosClient.get('/data/drawdown');
