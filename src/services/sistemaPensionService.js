import api from './api';

export const getSistemasPensiones = async () => {
  const response = await api.get('/sistemas-pensiones');
  return response.data;
};

export const getSistemaPension = async (id) => {
  const response = await api.get(`/sistemas-pensiones/${id}`);
  return response.data;
};

export const createSistemaPension = async (data) => {
  const response = await api.post('/sistemas-pensiones', data);
  return response.data;
};

export const updateSistemaPension = async (id, data) => {
  const response = await api.put(`/sistemas-pensiones/${id}`, data);
  return response.data;
};

export const deleteSistemaPension = async (id) => {
  const response = await api.delete(`/sistemas-pensiones/${id}`);
  return response.data;
};
