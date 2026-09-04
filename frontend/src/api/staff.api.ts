import axiosClient from './axiosClient';

export const getStaff = () => {
  return axiosClient.get('/staff');
};

export const createStaff = (data: any) => {
  return axiosClient.post('/staff', data);
};

export const updateStaff = (id: string, data: any) => {
  return axiosClient.put(`/staff/${id}`, data);
};

export const deleteStaff = (id: string) => {
  return axiosClient.delete(`/staff/${id}`);
};

export const resetPassword = (id: string) => {
  return axiosClient.post(`/staff/${id}/reset-password`);
};
