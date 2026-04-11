import api from './api';

export const getFichaPersonal = async (empleadoId) => {
  const response = await api.get(`/ficha-personal/${empleadoId}`);
  return response.data;
};
