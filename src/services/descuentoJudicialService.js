import api from './api';

export const getDescuentosByEmpleado = async (empleadoId) => {
  const response = await api.get(`/descuentos-judiciales/empleado/${empleadoId}`);
  return response.data;
};

export const createDescuentoJudicial = async (data) => {
  const response = await api.post('/descuentos-judiciales', data);
  return response.data;
};

export const updateDescuentoJudicial = async (id, data) => {
  const response = await api.put(`/descuentos-judiciales/${id}`, data);
  return response.data;
};

export const deleteDescuentoJudicial = async (id) => {
  await api.delete(`/descuentos-judiciales/${id}`);
};
