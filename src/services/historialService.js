import api from './api';

// Historial de actividad de USUARIOS
export const getHistorialUsuarios = async (params = {}) => {
  const response = await api.get('/historial/usuarios', { params });
  return response.data;
};

// Historial del SISTEMA (errores, warnings)
export const getHistorialSistema = async (params = {}) => {
  const response = await api.get('/historial/sistema', { params });
  return response.data;
};

// Módulos disponibles (para filtro select)
export const getHistorialModulos = async () => {
  const response = await api.get('/historial/modulos');
  return response.data;
};

// Estadísticas rápidas
export const getHistorialEstadisticas = async () => {
  const response = await api.get('/historial/estadisticas');
  return response.data;
};

// Detalle de un log
export const getHistorialDetalle = async (id) => {
  const response = await api.get(`/historial/${id}`);
  return response.data;
};
