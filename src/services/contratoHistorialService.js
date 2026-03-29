import api from './api';

export const getContratosHistorial = async (empleadoId = null) => {
  const params = empleadoId ? { empleado_id: empleadoId } : {};
  const response = await api.get('/contratos-historial', { params });
  return response.data;
};

export const getContratosEmpleado = async (empleadoId) => {
  const response = await api.get(`/contratos-historial/empleado/${empleadoId}`);
  return response.data;
};

// Alias corto
export const getHistorialEmpleado = getContratosEmpleado;

export const crearContratoHistorial = async (data) => {
  const response = await api.post('/contratos-historial', data);
  return response.data;
};

export const actualizarContratoHistorial = async (id, data) => {
  const response = await api.put(`/contratos-historial/${id}`, data);
  return response.data;
};

export const eliminarContratoHistorial = async (id) => {
  await api.delete(`/contratos-historial/${id}`);
};

export const recontratarEmpleado = async (data) => {
  const response = await api.post('/contratos-historial/recontratar', data);
  return response.data;
};

export const generarHistorialExistente = async () => {
  const response = await api.post('/contratos-historial/generar-existente');
  return response.data;
};

/**
 * No renovar contrato de un empleado (lo cesa automáticamente)
 */
export const noRenovarContrato = async (empleadoId, motivo) => {
  const response = await api.post(`/contratos-historial/no-renovar/${empleadoId}`, { motivo });
  return response.data;
};

/**
 * Reactivar un contrato CESADO: revierte a VIGENTE el contrato y el empleado
 */
export const reactivarContrato = async (contratoId) => {
  const response = await api.post(`/contratos-historial/reactivar/${contratoId}`);
  return response.data;
};

/**
 * Subir contrato firmado (escaneado PDF)
 */
export const subirContratoFirmado = async (contratoId, archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const response = await api.post(`/contratos-historial/subir-firmado/${contratoId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Descargar contrato firmado
 */
export const descargarContratoFirmado = async (contratoId) => {
  const response = await api.get(`/contratos-historial/firmado/${contratoId}/descargar`, {
    responseType: 'blob',
  });
  // Crear URL y descargar
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const disposition = response.headers['content-disposition'];
  const filename = disposition
    ? disposition.split('filename=')[1]?.replace(/"/g, '') || `contrato_firmado_${contratoId}.pdf`
    : `contrato_firmado_${contratoId}.pdf`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
