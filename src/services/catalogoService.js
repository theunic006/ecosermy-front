import api from './api';

export const calcularPlanilla = async (mes, anio) => {
  const response = await api.post('/planilla/calcular', { mes, anio });
  return response.data;
};

export const getPlanillas = async () => {
  const response = await api.get('/planilla');
  return response.data;
};

export const obtenerPlanilla = async (mes, anio) => {
  const response = await api.get(`/planilla/${mes}/${anio}`);
  return response.data;
};

export const getPlanillaDetalle = async (planillaId) => {
  const response = await api.get(`/planilla/detalle/${planillaId}`);
  return response.data;
};

export const generarBoleta = async (detalleId) => {
  const response = await api.get(`/planilla/boleta/${detalleId}`);
  return response.data;
};

export const ajustarDetalle = async (detalleId, data) => {
  const response = await api.put(`/planilla/ajustar/${detalleId}`, data);
  return response.data;
};

export const aprobarPlanilla = async (planillaId) => {
  const response = await api.post('/planilla/aprobar', { planilla_id: planillaId });
  return response.data;
};

// Catálogos
export const getAreas = async () => {
  const response = await api.get('/areas');
  return response.data;
};

export const getCargos = async () => {
  const response = await api.get('/cargos');
  return response.data;
};

export const getTurnos = async () => {
  const response = await api.get('/turnos');
  return response.data;
};

export const getAfps = async () => {
  const response = await api.get('/configuracion/afps');
  return response.data;
};

export const getSistemasPensiones = async () => {
  const response = await api.get('/sistemas-pensiones');
  return response.data;
};

// Dashboard
export const getDashboard = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getRankingLeyendas = async (periodoId) => {
  const response = await api.get(`/dashboard/ranking-leyendas?periodo_id=${periodoId}`);
  return response.data;
};

export const getPorUnidad = async (planillaId) => {
  const response = await api.get(`/dashboard/por-unidad?planilla_id=${planillaId}`);
  return response.data;
};

export const getEstadisticas = async () => {
  const response = await api.get('/dashboard/estadisticas');
  return response.data;
};

export const getRankingAmonestaciones = async (params = {}) => {
  const qs = new URLSearchParams();
  if (params.anio) qs.set('anio', params.anio);
  if (params.mes)  qs.set('mes',  params.mes);
  const response = await api.get(`/dashboard/ranking-amonestaciones${qs.toString() ? '?' + qs.toString() : ''}`);
  return response.data;
};

// ── Boletas ────────────────────────────────────────────────────────────────

/** PÚBLICO: Empleado consulta su boleta con código + DNI */
export const obtenerBoletaPublica = async (codigo, dni, mes, anio) => {
  const response = await api.get('/boleta-publica', {
    params: { codigo, dni, mes, anio },
  });
  return response.data;
};

/** PÚBLICO: Visitante obtiene sus meses disponibles (año en curso) */
export const visitanteMeses = async (codigo, dni) => {
  const response = await api.get('/visitante/meses', { params: { codigo, dni } });
  return response.data;
};

/** ADMIN: Lista empleados con estado de boleta para el período */
export const listarBoletas = async (mes, anio) => {
  const response = await api.get(`/boletas/listar/${mes}/${anio}`);
  return response.data;
};

/** ADMIN: Obtener boleta de un empleado específico */
export const obtenerBoletaEmpleado = async (empleadoId, mes, anio) => {
  const response = await api.get(`/boletas/empleado/${empleadoId}/${mes}/${anio}`);
  return response.data;
};

/** ADMIN: Obtener todas las boletas de un período para exportación masiva */
export const obtenerBoletasMasivo = async (mes, anio) => {
  const response = await api.get(`/boletas/masivo/${mes}/${anio}`);
  return response.data;
};

