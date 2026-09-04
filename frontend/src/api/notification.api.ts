import axiosClient from './axiosClient';

export const getNotifications = () => {
  return axiosClient.get('/notifications');
};

export const triggerAlertEngine = () => {
  return axiosClient.post('/notifications/trigger');
};

export const resolveNotification = (id: string) => {
  return axiosClient.put(`/notifications/${id}/resolve`);
};
