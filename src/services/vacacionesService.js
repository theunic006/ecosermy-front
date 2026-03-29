import api from './api';

export const getVacacionesResumen = async (anio) => {
  const response = await api.get('/vacaciones/resumen', { params: { anio } });
  return response.data;
};

export const getVacacionesEmpleado = async (empleadoId) => {
  const response = await api.get(`/vacaciones/empleado/${empleadoId}`);
  return response.data;
};

// ─── Calendario histórico (vacaciones_goce) ────────────────────────────────

export const getVacacionesRegistros = async (anioInicio, anioFin) => {
  const response = await api.get('/vacaciones/registros-todos', {
    params: { anio_inicio: anioInicio, anio_fin: anioFin },
  });
  return response.data;
};

export const getVacacionesRegistrosEmpleado = async (empleadoId) => {
  const response = await api.get(`/vacaciones/registros-empleado/${empleadoId}`);
  return response.data;
};

export const createVacacionesRegistro = async (data) => {
  const response = await api.post('/vacaciones/registros', data);
  return response.data;
};

export const updateVacacionesRegistro = async (id, data) => {
  const response = await api.put(`/vacaciones/registros/${id}`, data);
  return response.data;
};

export const deleteVacacionesRegistro = async (id) => {
  const response = await api.delete(`/vacaciones/registros/${id}`);
  return response.data;
};
