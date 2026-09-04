import axiosClient from './axiosClient';

export const getStats = () => {
  return axiosClient.get('/data/stats'); // Note: previously it called /api/stats, wait let me check the actual backend route for stats.
};

export const getClients = () => {
  return axiosClient.get('/data/clients');
};

export const getClientDetails = (id: string) => {
  return axiosClient.get(`/data/clients/${id}`);
};

export const getClientHistory = (id: string) => {
  return axiosClient.get(`/data/clients/${id}/history`);
};

export const getResearchFunds = () => {
  return axiosClient.get('/data/research');
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
