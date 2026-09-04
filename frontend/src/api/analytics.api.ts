import axiosClient from './axiosClient';

export const getRmAnalytics = () => {
  return axiosClient.get('/analytics/rms');
};
