import api from './api';

export const getAreas = async () => {
  const response = await api.get('/areas');
  return response.data;
};

export const getArea = async (id) => {
  const response = await api.get(`/areas/${id}`);
  return response.data;
};

export const createArea = async (data) => {
  const response = await api.post('/areas', data);
  return response.data;
};

export const updateArea = async (id, data) => {
  const response = await api.put(`/areas/${id}`, data);
  return response.data;
};

export const deleteArea = async (id) => {
  const response = await api.delete(`/areas/${id}`);
  return response.data;
};
