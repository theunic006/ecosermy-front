import api from './api';

export const getTareoMes = async (anio, mes, page = 1, perPage = 15, unidad = null, situacion = null, apellido = null) => {
  const params = { page, per_page: perPage };
  if (unidad) {
    params.unidad = unidad;
  }
  if (situacion) {
    params.situacion = situacion;
  }
  if (apellido) {
    params.apellido = apellido;
  }
  const response = await api.get(`/tareo/${mes}/${anio}`, { params });
  return response.data;
};

export const getTareoPorArea = async (anio, mes, areaId, page = 1, perPage = 15) => {
  const response = await api.get(`/tareo/${mes}/${anio}/area/${areaId}`, {
    params: { page, per_page: perPage }
  });
  return response.data;
};

export const getTareoMesPorArea = getTareoPorArea;

export const registrarAsistencia = async (data) => {
  const response = await api.post('/tareo/registrar', data);
  return response.data;
};

export const registrarMasivo = async (data) => {
  const response = await api.post('/tareo/registrar-masivo', data);
  return response.data;
};

export const eliminarMasivo = async (data) => {
  const response = await api.post('/tareo/eliminar-masivo', data);
  return response.data;
};

export const actualizarAsistencia = async (id, data) => {
  const response = await api.put(`/tareo/actualizar/${id}`, data);
  return response.data;
};

export const getResumenMensual = async (anio, mes) => {
  const response = await api.get(`/tareo/resumen/${mes}/${anio}`);
  return response.data;
};

export const getTareoEmpleado = async (empleadoId, anio, mes) => {
  const response = await api.get(`/tareo/empleado/${empleadoId}/${mes}/${anio}`);
  return response.data;
};

export const guardarExtras = async (data) => {
  const response = await api.post('/tareo/extras', data);
  return response.data;
};

export const guardarOtrosDescuentos = async (empleadoId, mes, anio, monto, descripcion) => {
  const response = await api.post('/tareo/extras', {
    empleado_id: empleadoId,
    mes,
    anio,
    otros_descuentos: monto,
    descripcion_otros_descuentos: descripcion || null,
  });
  return response.data;
};

export const acumularDias = async (data) => {
  const response = await api.post('/tareo/acumular-dias', data);
  return response.data;
};

export const usarDiasAcumulados = async (data) => {
  const response = await api.post('/tareo/usar-dias-acumulados', data);
  return response.data;
};

export const guardarHorasExtraDetalles = async (data) => {
  const response = await api.post('/tareo/horas-extra-detalles', data);
  return response.data;
};

export const guardarAdelantoDetalles = async (data) => {
  const response = await api.post('/tareo/adelanto-detalles', data);
  return response.data;
};

// ===== Nuevo sistema de adelantos con cuotas =====

export const crearAdelanto = async (data) => {
  const response = await api.post('/adelantos', data);
  return response.data;
};

export const getAdelantosEmpleado = async (empleadoId) => {
  const response = await api.get(`/adelantos/empleado/${empleadoId}`);
  return response.data;
};

export const getPagosAdelanto = async (empleadoId, mes, anio) => {
  const response = await api.get(`/adelantos/pagos/${empleadoId}/${mes}/${anio}`);
  return response.data;
};

export const eliminarAdelanto = async (id) => {
  const response = await api.delete(`/adelantos/${id}`);
  return response.data;
};

export const actualizarAdelanto = async (id, data) => {
  const response = await api.put(`/adelantos/${id}`, data);
  return response.data;
};

// ===== Cobro de Vacaciones =====

export const getVacacionesCobro = async (empleadoId, mes, anio) => {
  const response = await api.get(`/vacaciones-cobro/${empleadoId}/${mes}/${anio}`);
  return response.data;
};

export const guardarVacacionesCobro = async (data) => {
  const response = await api.post('/vacaciones-cobro', data);
  return response.data;
};

export const eliminarVacacionesCobro = async (empleadoId, mes, anio) => {
  const response = await api.delete(`/vacaciones-cobro/${empleadoId}/${mes}/${anio}`);
  return response.data;
};
