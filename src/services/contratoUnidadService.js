import api from './api';

export const getContratosUnidad = async (unidad = null) => {
  const params = unidad ? { unidad } : {};
  const response = await api.get('/contratos-unidad', { params });
  return response.data;
};

export const createContratoUnidad = async (data) => {
  const response = await api.post('/contratos-unidad', data);
  return response.data;
};

export const updateContratoUnidad = async (id, data) => {
  const response = await api.put(`/contratos-unidad/${id}`, data);
  return response.data;
};

export const deleteContratoUnidad = async (id) => {
  await api.delete(`/contratos-unidad/${id}`);
};
