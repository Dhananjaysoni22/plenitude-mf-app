import axiosClient from './axiosClient';

export const uploadFile = (endpoint: string, formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
  return axiosClient.post(`/upload/${endpoint}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });
};

export const uploadBulkPortfolios = (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
  return axiosClient.post('/upload/portfolios/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  });
};
