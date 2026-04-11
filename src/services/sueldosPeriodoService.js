import api from './api';

export const getSueldosPeriodo = async (anio) => {
  const response = await api.get('/sueldos-periodo', { params: { anio } });
  return response.data;
};

export const updateSueldoPeriodo = async (detalleId, sueldoBase) => {
  const response = await api.put(`/sueldos-periodo/${detalleId}`, { sueldo_base: sueldoBase });
  return response.data;
};

export const updateSueldosMasivo = async (cambios) => {
  const response = await api.put('/sueldos-periodo-masivo', { cambios });
  return response.data;
};
