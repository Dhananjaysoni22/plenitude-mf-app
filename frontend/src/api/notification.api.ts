import axiosClient from './axiosClient';

export const getNotifications = (page: number = 1, limit: number = 100, search: string = '', sortField: string = '', sortDir: string = '') => {
  return axiosClient.get(`/notifications?page=${page}&limit=${limit}&search=${search}&sortField=${sortField}&sortDir=${sortDir}`);
};

export const triggerAlertEngine = () => {
  return axiosClient.post('/notifications/trigger');
};

export const resolveNotification = (id: string, resolutionNote: string) => {
  return axiosClient.put(`/notifications/${id}/resolve`, { resolutionNote });
};
