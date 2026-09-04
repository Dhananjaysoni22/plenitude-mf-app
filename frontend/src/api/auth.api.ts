import axiosClient from './axiosClient';

export const login = (data: any) => {
  return axiosClient.post('/auth/login', data);
};
