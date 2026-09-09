import axiosClient from './axiosClient';

export const login = (data: any) => {
  return axiosClient.post('/auth/login', data);
};

export const changePassword = (data: any) => {
  return axiosClient.post('/auth/change-password', data);
};
