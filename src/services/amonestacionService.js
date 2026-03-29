import api from './api';

export const getAmonestaciones = async (params = {}) => {
  const response = await api.get('/amonestaciones', { params });
  return response.data;
};

export const getAmonestacionesPorEmpleado = async (empleadoId) => {
  const response = await api.get('/amonestaciones', { params: { empleado_id: empleadoId } });
  return response.data;
};

export const createAmonestacion = async (data) => {
  const response = await api.post('/amonestaciones', data);
  return response.data;
};

export const updateAmonestacion = async (id, data) => {
  const response = await api.put(`/amonestaciones/${id}`, data);
  return response.data;
};

export const deleteAmonestacion = async (id) => {
  const response = await api.delete(`/amonestaciones/${id}`);
  return response.data;
};
