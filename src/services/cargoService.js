import api from './api';

export const getCargos = async () => {
  const response = await api.get('/cargos');
  return response.data;
};

export const getCargo = async (id) => {
  const response = await api.get(`/cargos/${id}`);
  return response.data;
};

export const createCargo = async (data) => {
  const response = await api.post('/cargos', data);
  return response.data;
};

export const updateCargo = async (id, data) => {
  const response = await api.put(`/cargos/${id}`, data);
  return response.data;
};

export const deleteCargo = async (id) => {
  const response = await api.delete(`/cargos/${id}`);
  return response.data;
};
