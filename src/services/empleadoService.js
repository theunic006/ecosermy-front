import api from './api';

export const getEmpleados = async () => {
  const response = await api.get('/empleados');
  return response.data;
};

export const getEmpleadosVigentes = async () => {
  const response = await api.get('/empleados-vigentes');
  return response.data;
};

export const getEmpleadosCesados = async () => {
  const response = await api.get('/empleados-cesados');
  return response.data;
};

export const getEmpleado = async (id) => {
  const response = await api.get(`/empleados/${id}`);
  return response.data;
};

export const createEmpleado = async (data) => {
  const response = await api.post('/empleados', data);
  return response.data;
};

export const updateEmpleado = async (id, data) => {
  const response = await api.put(`/empleados/${id}`, data);
  return response.data;
};

export const updateConcepto = async (id, concepto) => {
  const response = await api.patch(`/empleados/${id}/concepto`, { concepto });
  return response.data;
};

export const updateContratoUnidadEmpleado = async (id, contrato_unidad_id) => {
  const response = await api.patch(`/empleados/${id}/contrato-unidad`, { contrato_unidad_id });
  return response.data;
};

export const deleteEmpleado = async (id) => {
  const response = await api.delete(`/empleados/${id}`);
  return response.data;
};

export const reactivarEmpleado = async (id) => {
  const response = await api.patch(`/empleados/${id}/reactivar`);
  return response.data;
};

export const getEmpleadosInactivos = async () => {
  const response = await api.get('/empleados-inactivos');
  return response.data;
};

export const cesarEmpleado = async (id, data = {}) => {
  const response = await api.put(`/empleados/${id}/cesar`, data);
  return response.data;
};

export const registrarAmonestacion = async (id, data = {}) => {
  const response = await api.put(`/empleados/${id}/amonestacion`, data);
  return response.data;
};

export const buscarEmpleados = async (termino) => {
  const response = await api.get(`/empleados/buscar/${termino}`);
  return response.data;
};

export const descargarPlantilla = () => {
  return api.get('/empleados/plantilla/descargar', { responseType: 'blob' });
};

export const importarEmpleados = async (archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const response = await api.post('/empleados/importar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
