import axiosClient from './axiosClient';

export const uploadFile = (endpoint: string, formData: FormData) => {
  return axiosClient.post(`/upload/${endpoint}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const uploadBulkPortfolios = (formData: FormData) => {
  return axiosClient.post('/upload/portfolios/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
