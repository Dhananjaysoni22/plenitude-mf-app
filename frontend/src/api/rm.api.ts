import axiosClient from './axiosClient';

export const getRmIntelligence = () => {
  return axiosClient.get('/rm/intelligence');
};

export const markPortfolioReviewed = (clientId: string) => {
  return axiosClient.post(`/rm/clients/${clientId}/review`);
};
