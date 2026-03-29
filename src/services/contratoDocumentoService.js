import api from './api';

/**
 * Buscar empleados para generar contrato (por DNI, nombre o código)
 */
export const buscarParaContrato = async (q) => {
  const response = await api.get('/contrato-documento/buscar', { params: { q } });
  return response.data;
};

/**
 * Obtener datos completos del empleado para generar contrato
 */
export const getDatosContrato = async (empleadoId) => {
  const response = await api.get(`/contrato-documento/datos/${empleadoId}`);
  return response.data;
};

/**
 * Listar todos los cambios de personal (con filtros opcionales)
 */
export const getCambiosPersonal = async (params = {}) => {
  const response = await api.get('/empleado-cambios', { params });
  return response.data;
};

/**
 * Obtener cambios de un empleado específico
 */
export const getCambiosEmpleado = async (empleadoId) => {
  const response = await api.get(`/empleado-cambios/${empleadoId}`);
  return response.data;
};

/**
 * Obtener empleados con contrato a vencer en los próximos X días (default 30)
 */
export const getContratosProximosVencer = async (dias = 30) => {
  const response = await api.get('/contrato-documento/proximos-vencer', { params: { dias } });
  return response.data;
};

/**
 * Actualizar una renovación ya guardada (sin crear duplicados)
 */
export const actualizarRenovacion = async (contratoId, data) => {
  const response = await api.put(`/contratos-historial/actualizar-renovacion/${contratoId}`, data);
  return response.data;
};
