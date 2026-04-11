import { useState, useEffect } from 'react';
import {
  FiFileText, FiSearch, FiPlus, FiCheck, FiDollarSign,
  FiTrash2, FiDownload, FiEye, FiX, FiAlertTriangle, FiEdit2
} from 'react-icons/fi';
import api from '../services/api';
import Loading from '../components/common/Loading';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';
import { useAuth } from '../contexts/AuthContext';

const MOTIVOS_CESE = [
  { value: 'RENUNCIA', label: 'Renuncia voluntaria' },
  { value: 'DESPIDO', label: 'Despido arbitrario' },
  { value: 'MUTUO_ACUERDO', label: 'Mutuo acuerdo' },
  { value: 'FIN_CONTRATO', label: 'Fin de contrato' },
  { value: 'JUBILACION', label: 'Jubilación' },
];

// Normaliza el texto libre de motivo_cese del empleado al ENUM de liquidaciones
const normalizarMotivo = (motivo) => {
  if (!motivo) return 'RENUNCIA';
  const m = motivo.toUpperCase().trim();
  if (m.includes('RENUNCIA')) return 'RENUNCIA';
  if (m.includes('DESPIDO') || m.includes('ARBITRARIO')) return 'DESPIDO';
  if (m.includes('MUTUO') || m.includes('ACUERDO')) return 'MUTUO_ACUERDO';
  if (m.includes('FIN') || m.includes('CONTRATO') || m.includes('VENCIMIENTO')) return 'FIN_CONTRATO';
  if (m.includes('JUBILACI') || m.includes('JUBILAC')) return 'JUBILACION';
  return 'RENUNCIA';
};

const ESTADOS_BADGE = {
  BORRADOR: { bg: '#fef3c7', color: '#b45309', label: 'Borrador' },
  APROBADO: { bg: '#dbeafe', color: '#1d4ed8', label: 'Aprobado' },
  PAGADO:   { bg: '#dcfce7', color: '#15803d', label: 'Pagado' },
};

const formatMoney = (v) => `S/ ${parseFloat(v || 0).toFixed(2)}`;

function Liquidaciones() {
  // ===== ESTADOS =====
  const { isDark, c } = useThemeColors();
  const { hasPermission } = useAuth();
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');

  // Panel cesados pendientes
  const [cesadosPendientes, setCesadosPendientes] = useState([]);
  const [loadingCesados, setLoadingCesados] = useState(false);
  const [mostrarPendientes, setMostrarPendientes] = useState(true);
  const [filtroCesadoMes, setFiltroCesadoMes] = useState('');
  const [filtroCesadoAnio, setFiltroCesadoAnio] = useState('');

  // Form nueva liquidación
  const [showForm, setShowForm] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [soloSituacion, setSoloSituacion] = useState('CESADO'); // filtro en búsqueda
  const [empleadoSel, setEmpleadoSel] = useState(null);
  const [motivoCese, setMotivoCese] = useState('RENUNCIA');
  const [fechaCese, setFechaCese] = useState(new Date().toISOString().split('T')[0]);
  const [otrosDescuentos, setOtrosDescuentos] = useState(0);
  const [promGratificacion, setPromGratificacion] = useState(0);
  const [otrosIngresos, setOtrosIngresos] = useState(0);
  const [otrosIngresosDesc, setOtrosIngresosDesc] = useState('');
  const [calculando, setCalculando] = useState(false);
  
  // Vacaciones pendientes
  const [vacacionesPendientes, setVacacionesPendientes] = useState([]);
  const [incluirVacaciones, setIncluirVacaciones] = useState(true);
  const [vacacionesDias, setVacacionesDias] = useState(0);
  const [vacacionesDiasDisponibles, setVacacionesDiasDisponibles] = useState(0);
  const [loadingVacaciones, setLoadingVacaciones] = useState(false);
  
  // Datos reales de vacaciones del empleado (como en página de vacaciones)
  const [vacAntiguedadAnios, setVacAntiguedadAnios] = useState(0);
  const [vacDiasAcumulados, setVacDiasAcumulados] = useState(0); // antigüedad × 30
  const [vacTotalGozados, setVacTotalGozados] = useState(0); // editable
  const [vacPorCobrar, setVacPorCobrar] = useState(0); // calculado: acumulados - gozados
  const [vacJornalDiario, setVacJornalDiario] = useState(0); // para multiplicar

  // Detalle / vista
  const [showDetalle, setShowDetalle] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Edición manual
  const [editando, setEditando] = useState(false);
  const [editVacDias, setEditVacDias] = useState(0);
  const [editVacMonto, setEditVacMonto] = useState(0);
  const [editOtrosDesc, setEditOtrosDesc] = useState(0);
  const [editOtrosIngresos, setEditOtrosIngresos] = useState(0);
  const [editOtrosIngresosDesc, setEditOtrosIngresosDesc] = useState('');
  const [editObs, setEditObs] = useState('');

  useEffect(() => { cargarLiquidaciones(); }, [filtroEstado]);
  useEffect(() => { cargarCesadosPendientes(); }, []);

  // ===== API CALLS =====
  const cargarLiquidaciones = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      const resp = await api.get('/liquidaciones', { params });
      setLiquidaciones(resp.data || []);
    } catch {
      toast.error('Error al cargar liquidaciones');
    } finally {
      setLoading(false);
    }
  };

  // Carga cesados que aún no tienen liquidación
  const cargarCesadosPendientes = async () => {
    setLoadingCesados(true);
    try {
      const [cesadosResp, liqResp] = await Promise.all([
        api.get('/empleados-cesados'),
        api.get('/liquidaciones'),
      ]);
      const cesados = cesadosResp.data || [];
      const yaLiquidados = new Set((liqResp.data || []).map(l => l.empleado_id));
      setCesadosPendientes(cesados.filter(e => !yaLiquidados.has(e.id)));
    } catch {
      // silencioso
    } finally {
      setLoadingCesados(false);
    }
  };

  const cargarVacacionesPendientes = async (empleadoId) => {
    setLoadingVacaciones(true);
    try {
      console.log('📊 Cargando vacaciones para empleado:', empleadoId);
      console.log('📊 Empleado seleccionado:', empleadoSel);
      
      // Calcular antigüedad hasta la fecha apropiada:
      // - Si está CESADO: usar fecha de cese real del empleado
      // - Si está VIGENTE: usar fecha de hoy (o fecha de cese del formulario si se está liquidando)
      const fechaIngresoEmp = empleadoSel?.fecha_ingreso;
      if (!fechaIngresoEmp) {
        console.warn('⚠️ Empleado sin fecha de ingreso');
        setLoadingVacaciones(false);
        return;
      }
      
      const esCesado = empleadoSel?.situacion_contractual === 'CESADO' || empleadoSel?.situacion === 'CESADO';
      const fechaIng = new Date(fechaIngresoEmp);
      
      // Determinar fecha de corte
      let fechaCorte;
      if (esCesado && empleadoSel?.fecha_cese) {
        // Si ya está cesado, usar su fecha de cese real
        fechaCorte = new Date(empleadoSel.fecha_cese);
        console.log('✓ Empleado CESADO, usando fecha de cese real:', empleadoSel.fecha_cese);
      } else {
        // Si está vigente, usar fecha de hoy
        fechaCorte = new Date();
        console.log('✓ Empleado VIGENTE, usando fecha de hoy');
      }
      
      // Calcular años completos hasta la fecha de corte
      let antiguedadAnios = fechaCorte.getFullYear() - fechaIng.getFullYear();
      const mesIngreso = fechaIng.getMonth();
      const mesCorte = fechaCorte.getMonth();
      const diaIngreso = fechaIng.getDate();
      const diaCorte = fechaCorte.getDate();
      
      // Ajustar si no ha cumplido el año completo
      if (mesCorte < mesIngreso || (mesCorte === mesIngreso && diaCorte < diaIngreso)) {
        antiguedadAnios--;
      }
      
      console.log('📊 Cálculo manual de antigüedad:', {
        fechaIngreso: fechaIngresoEmp,
        fechaCese: fechaCese,
        antiguedadAnios
      });
      
      const diasAcumulados = antiguedadAnios * 30;
      
      // Obtener gozados totales desde el endpoint de vacaciones
      const anioActual = new Date().getFullYear();
      let gozadosTotales = 0;
      
      try {
        const respResumen = await api.get('/vacaciones/resumen', { params: { anio: anioActual } });
        const empleados = respResumen.data?.empleados || [];
        const empleadoData = empleados.find(emp => emp.empleado_id === empleadoId);
        
        if (empleadoData) {
          gozadosTotales = empleadoData.gozados_totales || 0;
          console.log('📊 Gozados totales desde API:', gozadosTotales);
        }
      } catch (err) {
        console.warn('⚠️ No se pudieron obtener gozados totales:', err);
      }
      
      const porCobrar = diasAcumulados - gozadosTotales;
      
      // Jornal diario = (Sueldo Base + Asignación Familiar) / 30 según ley peruana
      const sueldoBase = empleadoSel?.sueldo_base || 0;
      const asigFamiliar = empleadoSel?.tiene_asignacion_familiar ? (empleadoSel?.val_asig_familiar || 113) : 0;
      const baseVacacional = sueldoBase + asigFamiliar;
      const jornalDiario = baseVacacional / 30;
      
      console.log('📊 Cálculo final de vacaciones:', {
        antiguedadAnios,
        diasAcumulados,
        gozadosTotales,
        porCobrar,
        sueldoBase,
        asigFamiliar,
        baseVacacional,
        jornalDiario
      });
      
      setVacAntiguedadAnios(antiguedadAnios);
      setVacDiasAcumulados(diasAcumulados);
      setVacTotalGozados(gozadosTotales);
      setVacPorCobrar(Math.max(0, porCobrar));
      setVacJornalDiario(jornalDiario);
      
      // Cargar periodos pendientes para detalle (opcional)
      try {
        let resp = await api.get(`/vacaciones-control/${empleadoId}`);
        let periodos = [];
        if (resp.data && Array.isArray(resp.data.vacaciones)) {
          periodos = resp.data.vacaciones;
        } else if (Array.isArray(resp.data)) {
          periodos = resp.data;
        }
        
        const pendientes = periodos.filter(p => ['PENDIENTE', 'PARCIAL'].includes(p.estado));
        setVacacionesPendientes(pendientes);
        
        const totalDias = pendientes.reduce((sum, p) => sum + (p.dias_pendientes || 0), 0);
        setVacacionesDiasDisponibles(totalDias);
      } catch (err) {
        console.warn('⚠️ No se pudieron cargar periodos pendientes:', err);
        setVacacionesPendientes([]);
        setVacacionesDiasDisponibles(0);
      }
    } catch (err) {
      console.error('❌ Error al cargar vacaciones:', err);
      setVacacionesPendientes([]);
      setVacacionesDiasDisponibles(0);
      setVacDiasAcumulados(0);
      setVacTotalGozados(0);
      setVacPorCobrar(0);
      setVacJornalDiario(0);
    } finally {
      setLoadingVacaciones(false);
    }
  };

  const buscarEmpleados = async (term) => {
    // Si no hay término y está en modo CESADO, mostrar cesados pendientes directamente
    if (term.length < 2) {
      if (soloSituacion === 'CESADO' && term.length === 0) {
        setEmpleados(cesadosPendientes.slice(0, 15));
      } else {
        setEmpleados([]);
      }
      return;
    }
    try {
      const resp = await api.get(`/empleados/buscar/${term}`);
      let lista = resp.data || [];
      if (soloSituacion === 'CESADO') {
        lista = lista.filter(e => e.situacion_contractual === 'CESADO');
      }
      setEmpleados(lista);
    } catch {
      setEmpleados([]);
    }
  };

  const calcularLiquidacion = async () => {
    if (!empleadoSel) { toast.warning('Seleccione un empleado'); return; }
    setCalculando(true);
    try {
      const resp = await api.post('/liquidaciones/calcular', {
        empleado_id: empleadoSel.id,
        motivo_cese: motivoCese,
        fecha_cese: fechaCese,
        otros_descuentos: parseFloat(otrosDescuentos) || 0,
        prom_gratificacion: parseFloat(promGratificacion) || 0,
        otros_ingresos: parseFloat(otrosIngresos) || 0,
        otros_ingresos_descripcion: otrosIngresosDesc || '',
        incluir_vacaciones_pendientes: incluirVacaciones,
        // Enviar los días "Por Cobrar" = días acumulados - total gozados
        vacaciones_dias_pendientes: incluirVacaciones ? vacPorCobrar : 0,
      });
      toast.success('Liquidación calculada');
      setShowForm(false);
      resetForm();
      cargarLiquidaciones();
      // Abrir detalle inmediato
      verDetalle(resp.data.data.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al calcular');
    } finally {
      setCalculando(false);
    }
  };

  const verDetalle = async (id) => {
    setLoadingDetalle(true);
    setShowDetalle(true);
    try {
      const resp = await api.get(`/liquidaciones/${id}`);
      setDetalle(resp.data);
    } catch {
      toast.error('Error al cargar detalle');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const aprobarLiquidacion = async (id) => {
    if (!confirm('¿Aprobar esta liquidación?')) return;
    try {
      await api.put(`/liquidaciones/${id}/aprobar`);
      toast.success('Liquidación aprobada');
      verDetalle(id);
      cargarLiquidaciones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al aprobar');
    }
  };

  const pagarLiquidacion = async (id) => {
    if (!confirm('¿Marcar como pagada?')) return;
    try {
      await api.put(`/liquidaciones/${id}/pagar`);
      toast.success('Liquidación pagada');
      verDetalle(id);
      cargarLiquidaciones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const eliminarLiquidacion = async (id) => {
    if (!confirm('¿Eliminar esta liquidación? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/liquidaciones/${id}`);
      toast.success('Liquidación eliminada');
      setShowDetalle(false);
      cargarLiquidaciones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const descargarPDF = (id) => {
    const token = localStorage.getItem('auth_token');
    const baseURL = api.defaults.baseURL;
    window.open(`${baseURL}/liquidaciones/${id}/pdf?token=${token}`, '_blank');
  };

  const iniciarEdicion = () => {
    setEditando(true);
    setEditVacDias(detalle.vacaciones_dias_pendientes || 0);
    setEditVacMonto(detalle.vacaciones_no_gozadas || 0);
    setEditOtrosDesc(detalle.otros_descuentos || 0);
    setEditOtrosIngresos(detalle.otros_ingresos || 0);
    setEditOtrosIngresosDesc(detalle.otros_ingresos_descripcion || '');
    setEditObs(detalle.observaciones || '');
  };

  const guardarEdicion = async () => {
    try {
      await api.put(`/liquidaciones/${detalle.id}`, {
        vacaciones_dias_pendientes: parseInt(editVacDias) || 0,
        vacaciones_no_gozadas: parseFloat(editVacMonto) || 0,
        otros_descuentos: parseFloat(editOtrosDesc) || 0,
        otros_ingresos: parseFloat(editOtrosIngresos) || 0,
        otros_ingresos_descripcion: editOtrosIngresosDesc || '',
        observaciones: editObs,
      });
      toast.success('Liquidación actualizada');
      setEditando(false);
      verDetalle(detalle.id);
      cargarLiquidaciones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    }
  };

  const resetForm = () => {
    setEmpleadoSel(null);
    setBusqueda('');
    setEmpleados([]);
    setMotivoCese('RENUNCIA');
    setFechaCese(new Date().toISOString().split('T')[0]);
    setOtrosDescuentos(0);
    setPromGratificacion(0);
    setOtrosIngresos(0);
    setOtrosIngresosDesc('');
    setSoloSituacion('CESADO');
    setVacacionesPendientes([]);
    setIncluirVacaciones(true);
    setVacacionesDias(0);
    setVacacionesDiasDisponibles(0);
    setVacAntiguedadAnios(0);
    setVacDiasAcumulados(0);
    setVacTotalGozados(0);
    setVacPorCobrar(0);
    setVacJornalDiario(0);
    cargarCesadosPendientes();
  };

  // Abre el form con un empleado pre-seleccionado (desde panel de pendientes)
  const liquidarDirecto = (emp) => {
    resetForm();
    setEmpleadoSel(emp);
    setBusqueda(`${emp.apellidos}, ${emp.nombres}`);
    if (emp.fecha_cese) setFechaCese(emp.fecha_cese.split('T')[0]);
    if (emp.motivo_cese) setMotivoCese(normalizarMotivo(emp.motivo_cese));
    cargarVacacionesPendientes(emp.id); // Cargar vacaciones
    setShowForm(true);
  };

  const exportarExcel = () => {
    if (liquidaciones.length === 0) {
      toast.warning('No hay liquidaciones para exportar');
      return;
    }
    const fd = (d) => d ? d.split('T')[0] : '—';
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"/></head><body>
<table border="1" style="font-family:Calibri,Arial,sans-serif;font-size:11pt;border-collapse:collapse;">
<tr style="background:#1e293b;color:#fff;font-weight:bold;">
  <th style="padding:8px 14px;">N°</th>
  <th style="padding:8px 14px;">Empleado</th>
  <th style="padding:8px 14px;">DNI</th>
  <th style="padding:8px 14px;">Fecha Ingreso</th>
  <th style="padding:8px 14px;">Motivo Cese</th>
  <th style="padding:8px 14px;">Fecha Cese</th>
  <th style="padding:8px 14px;background:#7c3aed;">Años</th>
  <th style="padding:8px 14px;background:#7c3aed;">Meses</th>
  <th style="padding:8px 14px;background:#7c3aed;">Días</th>
  <th style="padding:8px 14px;">CTS Trunca</th>
  <th style="padding:8px 14px;">Vacaciones</th>
  <th style="padding:8px 14px;">Gratificación</th>
  <th style="padding:8px 14px;">Otros Ingresos</th>
  <th style="padding:8px 14px;">Total Ingresos</th>
  <th style="padding:8px 14px;">Total Descuentos</th>
  <th style="padding:8px 14px;">Neto a Pagar</th>
  <th style="padding:8px 14px;">Estado</th>
</tr>`;
    liquidaciones.forEach((liq, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      html += `<tr style="background:${bg};">
  <td style="padding:6px 12px;text-align:center;">${idx + 1}</td>
  <td style="padding:6px 12px;font-weight:600;">${liq.empleado?.apellidos || ''}, ${liq.empleado?.nombres || ''}</td>
  <td style="padding:6px 12px;text-align:center;font-family:monospace;">${liq.empleado?.dni || ''}</td>
  <td style="padding:6px 12px;text-align:center;">${fd(liq.empleado?.fecha_ingreso)}</td>
  <td style="padding:6px 12px;">${liq.motivo_cese || ''}</td>
  <td style="padding:6px 12px;text-align:center;">${fd(liq.fecha_cese)}</td>
  <td style="padding:6px 12px;text-align:center;font-weight:700;color:#6d28d9;">${liq.tiempo_servicio_anos ?? 0}</td>
  <td style="padding:6px 12px;text-align:center;font-weight:700;color:#6d28d9;">${liq.tiempo_servicio_meses ?? 0}</td>
  <td style="padding:6px 12px;text-align:center;font-weight:700;color:#6d28d9;">${liq.tiempo_servicio_dias ?? 0}</td>
  <td style="padding:6px 12px;text-align:right;">S/ ${parseFloat(liq.cts_trunca || 0).toFixed(2)}</td>
  <td style="padding:6px 12px;text-align:right;">S/ ${parseFloat(liq.vacaciones_neto ?? liq.vacaciones_truncas ?? 0).toFixed(2)}</td>
  <td style="padding:6px 12px;text-align:right;">S/ ${parseFloat(liq.gratificacion_trunca || 0).toFixed(2)}</td>
  <td style="padding:6px 12px;text-align:right;">S/ ${parseFloat(liq.otros_ingresos || 0).toFixed(2)}</td>
  <td style="padding:6px 12px;text-align:right;">S/ ${parseFloat(liq.total_ingresos || 0).toFixed(2)}</td>
  <td style="padding:6px 12px;text-align:right;">S/ ${parseFloat(liq.total_descuentos || 0).toFixed(2)}</td>
  <td style="padding:6px 12px;text-align:right;font-weight:700;">S/ ${parseFloat(liq.total_neto || 0).toFixed(2)}</td>
  <td style="padding:6px 12px;text-align:center;">${ESTADOS_BADGE[liq.estado]?.label || liq.estado}</td>
</tr>`;
    });
    html += `</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquidaciones_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`✓ ${liquidaciones.length} liquidación(es) exportadas`);
  };

  const exportarExcelPendientes = () => {
    const lista = cesadosFiltrados;
    if (lista.length === 0) {
      toast.warning('No hay empleados cesados pendientes para exportar');
      return;
    }
    const fd = (d) => d ? d.split('T')[0] : '—';
    const ts = calcTiempoServicio;
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"/></head><body>
<table border="1" style="font-family:Calibri,Arial,sans-serif;font-size:11pt;border-collapse:collapse;">
<tr style="background:#92400e;color:#fff;font-weight:bold;">
  <th style="padding:8px 14px;">N°</th>
  <th style="padding:8px 14px;">Empleado</th>
  <th style="padding:8px 14px;">DNI</th>
  <th style="padding:8px 14px;">Cargo</th>
  <th style="padding:8px 14px;">Fecha Ingreso</th>
  <th style="padding:8px 14px;">Fecha Cese</th>
  <th style="padding:8px 14px;">Motivo Cese</th>
  <th style="padding:8px 14px;background:#166534;">Años</th>
  <th style="padding:8px 14px;background:#166534;">Meses</th>
  <th style="padding:8px 14px;background:#166534;">Días</th>
  <th style="padding:8px 14px;">Sueldo Base</th>
  <th style="padding:8px 14px;">Situación</th>
</tr>`;
    lista.forEach((emp, idx) => {
      const { anos, meses, dias } = ts(emp);
      const cumpleAnio = anos >= 1;
      const bg = cumpleAnio ? '#dcfce7' : (idx % 2 === 0 ? '#ffffff' : '#fef9f0');
      const tsColor = cumpleAnio ? '#15803d' : '#6d28d9';
      html += `<tr style="background:${bg};${ cumpleAnio ? 'font-weight:bold;' : ''}">
  <td style="padding:6px 12px;text-align:center;">${idx + 1}</td>
  <td style="padding:6px 12px;font-weight:600;">${emp.apellidos || ''}, ${emp.nombres || ''}</td>
  <td style="padding:6px 12px;text-align:center;font-family:monospace;">${emp.dni || ''}</td>
  <td style="padding:6px 12px;">${emp.cargo?.nombre || '—'}</td>
  <td style="padding:6px 12px;text-align:center;">${fd(emp.fecha_ingreso)}</td>
  <td style="padding:6px 12px;text-align:center;">${fd(emp.fecha_cese)}</td>
  <td style="padding:6px 12px;">${emp.motivo_cese || '—'}</td>
  <td style="padding:6px 12px;text-align:center;font-weight:700;color:${tsColor};">${anos}</td>
  <td style="padding:6px 12px;text-align:center;font-weight:700;color:${tsColor};">${meses}</td>
  <td style="padding:6px 12px;text-align:center;font-weight:700;color:${tsColor};">${dias}</td>
  <td style="padding:6px 12px;text-align:right;">S/ ${parseFloat(emp.sueldo_base || 0).toFixed(2)}</td>
  <td style="padding:6px 12px;text-align:center;font-weight:700;color:#dc2626;">${emp.situacion_contractual || 'CESADO'}</td>
</tr>`;
    });
    html += `</table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cesados_sin_liquidacion_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`✓ ${lista.length} empleado(s) exportados`);
  };

  // Lista filtrada de cesados por mes/año de fecha_cese
  const MESES_NOMBRE = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const aniosDisponibles = [...new Set(
    cesadosPendientes
      .filter(e => e.fecha_cese)
      .map(e => new Date(e.fecha_cese.split('T')[0]).getFullYear())
  )].sort((a, b) => b - a);

  const cesadosFiltrados = cesadosPendientes.filter(emp => {
    if (!filtroCesadoMes && !filtroCesadoAnio) return true;
    if (!emp.fecha_cese) return false;
    const d = new Date(emp.fecha_cese.split('T')[0]);
    const mesOk = !filtroCesadoMes || (d.getMonth() + 1) === parseInt(filtroCesadoMes);
    const anioOk = !filtroCesadoAnio || d.getFullYear() === parseInt(filtroCesadoAnio);
    return mesOk && anioOk;
  });

  // Calcula años/meses/días entre fecha_ingreso y fecha_cese (o hoy)
  const calcTiempoServicio = (emp) => {
    if (!emp.fecha_ingreso) return { anos: 0, meses: 0, dias: 0 };
    const inicio = new Date(emp.fecha_ingreso.split('T')[0]);
    const fin = emp.fecha_cese ? new Date(emp.fecha_cese.split('T')[0]) : new Date();
    let anos = fin.getFullYear() - inicio.getFullYear();
    let meses = fin.getMonth() - inicio.getMonth();
    let dias = fin.getDate() - inicio.getDate();
    if (dias < 0) { meses -= 1; dias += new Date(fin.getFullYear(), fin.getMonth(), 0).getDate(); }
    if (meses < 0) { anos -= 1; meses += 12; }
    return { anos: Math.max(0, anos), meses: Math.max(0, meses), dias: Math.max(0, dias) };
  };
  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><FiFileText size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />Liquidaciones</h2>
        {hasPermission('liquidaciones.editar') && (
          <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            <FiPlus size={15} /> Nueva Liquidación
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: c.textSecondary }}>Filtrar:</span>
          <select className="form-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: 160 }}>
            <option value="">Todos</option>
            <option value="BORRADOR">Borrador</option>
            <option value="APROBADO">Aprobado</option>
            <option value="PAGADO">Pagado</option>
          </select>
          <span style={{ color: c.textMuted, fontSize: '0.82rem' }}>
            {liquidaciones.length} liquidación(es)
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={exportarExcel}
              disabled={liquidaciones.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: liquidaciones.length === 0 ? (isDark ? 'rgba(148,163,184,.08)' : '#f1f5f9') : '#166534', color: liquidaciones.length === 0 ? c.textMuted : '#fff', border: 'none', borderRadius: 6, cursor: liquidaciones.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
              title="Exportar toda la tabla a Excel"
            >
              <FiDownload size={15} /> Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Panel: Empleados CESADOS sin liquidación */}
      <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        <div
          onClick={() => setMostrarPendientes(!mostrarPendientes)}
          style={{ padding: '12px 20px', background: isDark ? 'rgba(251,191,36,.08)' : '#fef3c7', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: mostrarPendientes ? `1px solid ${isDark ? 'rgba(251,191,36,.15)' : '#fde68a'}` : 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiAlertTriangle size={16} color={isDark ? '#fbbf24' : '#b45309'} />
            <span style={{ fontWeight: 700, color: isDark ? '#fbbf24' : '#92400e', fontSize: '0.85rem' }}>
              Empleados CESADOS sin liquidación
            </span>
            {!loadingCesados && (
              <>
                <span style={{ background: '#b45309', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {cesadosPendientes.length} total
                </span>
                {(filtroCesadoMes || filtroCesadoAnio) && (
                  <span style={{ background: '#1d4ed8', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {cesadosFiltrados.length} filtrado(s)
                  </span>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Filtros de mes y año — evitamos que el click cierre el panel */}
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={filtroCesadoAnio}
                onChange={e => setFiltroCesadoAnio(e.target.value)}
                style={{ padding: '3px 8px', borderRadius: 5, border: `1px solid ${isDark ? 'rgba(251,191,36,.3)' : '#fde68a'}`, background: isDark ? 'rgba(251,191,36,.08)' : '#fff', color: isDark ? '#fbbf24' : '#92400e', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                title="Filtrar por año de cese"
              >
                <option value="">Todos los años</option>
                {aniosDisponibles.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select
                value={filtroCesadoMes}
                onChange={e => setFiltroCesadoMes(e.target.value)}
                style={{ padding: '3px 8px', borderRadius: 5, border: `1px solid ${isDark ? 'rgba(251,191,36,.3)' : '#fde68a'}`, background: isDark ? 'rgba(251,191,36,.08)' : '#fff', color: isDark ? '#fbbf24' : '#92400e', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                title="Filtrar por mes de cese"
              >
                <option value="">Todos los meses</option>
                {MESES_NOMBRE.map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
              {(filtroCesadoMes || filtroCesadoAnio) && (
                <button
                  onClick={() => { setFiltroCesadoMes(''); setFiltroCesadoAnio(''); }}
                  style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: isDark ? 'rgba(239,68,68,.2)' : '#fee2e2', color: isDark ? '#f87171' : '#dc2626', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  title="Limpiar filtros"
                >
                  <FiX size={11} /> Limpiar
                </button>
              )}
            </div>
            {cesadosPendientes.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); exportarExcelPendientes(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: '#92400e', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                title="Exportar lista de cesados sin liquidación a Excel"
              >
                <FiDownload size={13} /> Exportar Excel
              </button>
            )}
            <span style={{ color: isDark ? '#fbbf24' : '#92400e', fontSize: '0.75rem' }}>{mostrarPendientes ? '▲ Ocultar' : '▼ Ver'}</span>
          </div>
        </div>
        {mostrarPendientes && (
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {loadingCesados ? (
              <div style={{ padding: 20, textAlign: 'center', color: c.textMuted, fontSize: '0.82rem' }}>Cargando...</div>
            ) : cesadosFiltrados.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: c.textMuted, fontSize: '0.82rem' }}>
                {cesadosPendientes.length === 0
                  ? '✓ Todos los empleados cesados ya tienen liquidación'
                  : '🔍 No hay empleados cesados para el período seleccionado'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: isDark ? c.tableHeaderBg : '#f8fafc' }}>
                    {['Empleado', 'DNI', 'Situación', 'Fecha Ingreso', 'Fecha Cese', 'Motivo Cese', 'Cargo', 'Años', 'Meses', 'Días', ''].map(h => (
                      <th key={h} style={{ padding: '7px 12px', fontWeight: 600, color: c.textSecondary, textAlign: 'left', fontSize: '0.72rem', borderBottom: `1px solid ${c.tableBorder}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cesadosFiltrados.map((emp, idx) => {
                    const { anos, meses, dias } = calcTiempoServicio(emp);
                    const cumpleAnio = anos >= 1;
                    const rowBg = cumpleAnio
                      ? (isDark ? 'rgba(52,211,153,.06)' : '#dcfce7')
                      : (idx % 2 === 0 ? c.tableRowEven : c.tableRowOdd);
                    const tsColor = cumpleAnio ? (isDark ? '#6ee7b7' : '#15803d') : (isDark ? '#a78bfa' : '#6d28d9');
                    return (
                    <tr key={emp.id} style={{ background: rowBg, borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{emp.apellidos}, {emp.nombres}</td>
                      <td style={{ padding: '7px 12px', fontFamily: 'monospace' }}>{emp.dni}</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{ padding: '1px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>
                          {emp.situacion_contractual}
                        </span>
                      </td>
                      <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: '0.78rem', color: c.textSecondary }}>
                        {emp.fecha_ingreso ? emp.fecha_ingreso.split('T')[0] : '—'}
                      </td>
                      <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: '0.78rem', color: c.textSecondary }}>
                        {emp.fecha_cese ? emp.fecha_cese.split('T')[0] : '—'}
                      </td>
                      <td style={{ padding: '7px 12px', color: c.textMuted }}>{emp.motivo_cese || '—'}</td>
                      <td style={{ padding: '7px 12px', color: c.textMuted }}>{emp.cargo?.nombre || '—'}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700, color: tsColor }}>
                        {cumpleAnio ? <span style={{ background: '#bbf7d0', borderRadius: 4, padding: '1px 7px' }}>{anos}</span> : anos}
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700, color: tsColor }}>{meses}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700, color: tsColor }}>{dias}</td>
                      <td style={{ padding: '7px 12px' }}>
                        <button
                          onClick={() => liquidarDirecto(emp)}
                          style={{ background: isDark ? 'rgba(99,102,241,.2)' : '#1e293b', color: isDark ? '#a5b4fc' : '#fff', border: isDark ? '1px solid rgba(99,102,241,.3)' : 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        >
                          <FiPlus size={12} style={{ marginRight: 4 }} />Liquidar
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Tabla de liquidaciones */}
      {loading ? <Loading /> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: c.tableHeaderBg, color: isDark ? '#c4ccdb' : '#fff' }}>
                  {['#', 'Empleado', 'DNI', 'F. Ingreso', 'Motivo', 'Fecha Cese', 'Años', 'Meses', 'Días', 'Total Ingresos', 'Total Desc.', 'Neto a Pagar', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liquidaciones.length === 0 ? (
                  <tr>
                    <td colSpan={14} style={{ textAlign: 'center', padding: 40, color: c.textMuted }}>
                      No hay liquidaciones registradas
                    </td>
                  </tr>
                ) : liquidaciones.map((liq, idx) => {
                  const badge = ESTADOS_BADGE[liq.estado] || ESTADOS_BADGE.BORRADOR;
                  return (
                    <tr key={liq.id} style={{ background: idx % 2 === 0 ? c.tableRowEven : c.tableRowOdd, borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: c.textMuted }}>{idx + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{liq.empleado?.apellidos}, {liq.empleado?.nombres}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace' }}>{liq.empleado?.dni}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.78rem', color: c.textSecondary }}>
                        {liq.empleado?.fecha_ingreso ? liq.empleado.fecha_ingreso.split('T')[0] : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.78rem' }}>{liq.motivo_cese}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.8rem' }}>{liq.fecha_cese}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6d28d9' }}>{liq.tiempo_servicio_anos ?? '—'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6d28d9' }}>{liq.tiempo_servicio_meses ?? '—'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#6d28d9' }}>{liq.tiempo_servicio_dias ?? '—'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0891b2', fontWeight: 600 }}>{formatMoney(liq.total_ingresos)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#dc2626' }}>{formatMoney(liq.total_descuentos)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>{formatMoney(liq.total_neto)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 4, fontWeight: 700, fontSize: '0.73rem', background: badge.bg, color: badge.color }}>{badge.label}</span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button onClick={() => verDetalle(liq.id)} title="Ver detalle" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: '#2563eb' }}>
                            <FiEye size={14} />
                          </button>
                          {liq.estado !== 'BORRADOR' && (
                            <button onClick={() => descargarPDF(liq.id)} title="Descargar PDF" style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: '#b45309' }}>
                              <FiDownload size={14} />
                            </button>
                          )}
                          {(liq.estado === 'BORRADOR' || liq.estado === 'APROBADO' || liq.estado === 'PAGADO') && (
                            <button onClick={() => eliminarLiquidacion(liq.id)} title="Eliminar" style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: '#dc2626' }}>
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODAL: NUEVA LIQUIDACIÓN ===== */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 560, maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}><FiPlus size={18} style={{ marginRight: 6 }} />Nueva Liquidación</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}><FiX size={20} /></button>
            </div>

            {/* Buscar empleado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontWeight: 600, fontSize: '0.82rem', color: c.textSecondary }}>Buscar empleado</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => { setSoloSituacion('CESADO'); setBusqueda(''); setEmpleados(cesadosPendientes.slice(0, 15)); }}
                  style={{ padding: '2px 10px', borderRadius: 4, border: '1px solid', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', background: soloSituacion === 'CESADO' ? (isDark ? 'rgba(239,68,68,.12)' : '#fee2e2') : (isDark ? 'rgba(148,163,184,.06)' : '#f1f5f9'), color: soloSituacion === 'CESADO' ? (isDark ? '#f87171' : '#dc2626') : c.textSecondary, borderColor: soloSituacion === 'CESADO' ? (isDark ? 'rgba(239,68,68,.2)' : '#fca5a5') : c.borderSubtle }}
                >
                  Solo CESADOS
                </button>
                <button
                  onClick={() => { setSoloSituacion('TODOS'); setEmpleados([]); }}
                  style={{ padding: '2px 10px', borderRadius: 4, border: '1px solid', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', background: soloSituacion === 'TODOS' ? (isDark ? 'rgba(99,102,241,.12)' : '#dbeafe') : (isDark ? 'rgba(148,163,184,.06)' : '#f1f5f9'), color: soloSituacion === 'TODOS' ? (isDark ? '#a5b4fc' : '#1d4ed8') : c.textSecondary, borderColor: soloSituacion === 'TODOS' ? (isDark ? 'rgba(99,102,241,.2)' : '#bfdbfe') : c.borderSubtle }}
                >
                  Todos
                </button>
              </div>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                className="form-input"
                placeholder="Buscar por nombre, DNI o código..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); buscarEmpleados(e.target.value); }}
                style={{ width: '100%', paddingLeft: 34 }}
              />
              <FiSearch size={16} style={{ position: 'absolute', left: 10, top: 10, color: c.textMuted }} />
              {empleados.length > 0 && !empleadoSel && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: isDark ? '#1a2340' : '#fff', border: `1px solid ${c.borderSubtle}`, borderRadius: 6, boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto', zIndex: 10 }}>
                  {empleados.map(emp => (
                    <div key={emp.id}
                      onClick={() => {
                        setEmpleadoSel(emp);
                        setEmpleados([]);
                        setBusqueda(`${emp.apellidos}, ${emp.nombres}`);
                        // Pre-cargar fecha y motivo de cese desde el registro del empleado
                        if (emp.fecha_cese) {
                          setFechaCese(emp.fecha_cese.split('T')[0]);
                        }
                        if (emp.motivo_cese) {
                          setMotivoCese(normalizarMotivo(emp.motivo_cese));
                        }
                        // Cargar vacaciones pendientes
                        cargarVacacionesPendientes(emp.id);
                      }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${c.borderSubtle}`, fontSize: '0.82rem' }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(99,102,241,.06)' : '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <strong>{emp.apellidos}, {emp.nombres}</strong>
                          <span style={{ marginLeft: 8, color: c.textMuted }}>DNI: {emp.dni}</span>
                        </span>
                        {emp.situacion_contractual && (
                          <span style={{
                            fontSize: '0.7rem', padding: '1px 6px', borderRadius: 3, fontWeight: 700, marginLeft: 8,
                            background: emp.situacion_contractual === 'CESADO' ? '#fee2e2' : '#dcfce7',
                            color: emp.situacion_contractual === 'CESADO' ? '#dc2626' : '#15803d',
                          }}>{emp.situacion_contractual}</span>
                        )}
                      </div>
                      {emp.situacion_contractual === 'CESADO' && emp.fecha_cese && (
                        <div style={{ color: c.textMuted, fontSize: '0.72rem', marginTop: 2 }}>
                          Cese: {emp.fecha_cese.split('T')[0]} — {emp.motivo_cese || '—'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info empleado seleccionado */}
            {empleadoSel && (
              <div style={{ background: isDark ? 'rgba(52,211,153,.06)' : '#f0fdf4', border: `1px solid ${isDark ? 'rgba(52,211,153,.15)' : '#bbf7d0'}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ color: isDark ? '#6ee7b7' : '#15803d' }}>{empleadoSel.apellidos}, {empleadoSel.nombres}</strong>
                  <button onClick={() => { setEmpleadoSel(null); setBusqueda(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}><FiX size={14} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, color: c.textSecondary, marginBottom: 8 }}>
                  <span>DNI: <strong>{empleadoSel.dni}</strong></span>
                  <span>Sueldo base: <strong>S/ {empleadoSel.sueldo_base}</strong></span>
                  <span>Fecha ingreso: <strong>{empleadoSel.fecha_ingreso}</strong></span>
                  <span>Contrato: <strong>{empleadoSel.tipo_contrato || '—'}</strong></span>
                </div>
                {/* Badge de situación contractual - visible para cualquier valor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', color: c.textSecondary }}>Situación:</span>
                  <span style={{
                    padding: '2px 10px', borderRadius: 5, fontSize: '0.75rem', fontWeight: 700,
                    background: empleadoSel.situacion_contractual === 'CESADO' ? '#fee2e2' : '#dcfce7',
                    color: empleadoSel.situacion_contractual === 'CESADO' ? '#dc2626' : '#15803d',
                    border: `1px solid ${empleadoSel.situacion_contractual === 'CESADO' ? '#fca5a5' : '#86efac'}`
                  }}>
                    {empleadoSel.situacion_contractual || 'VIGENTE'}
                  </span>
                  {empleadoSel.cargo?.nombre && (
                    <span style={{ fontSize: '0.75rem', color: c.textSecondary }}>— {empleadoSel.cargo.nombre}</span>
                  )}
                </div>
                {/* Alerta según situación */}
                {empleadoSel.situacion_contractual === 'CESADO' ? (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#92400e' }}>
                    <FiAlertTriangle size={13} />
                    <span>Registrado como CESADO — fecha y motivo precargados del sistema</span>
                  </div>
                ) : (
                  <div style={{ background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 10px', fontSize: '0.78rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiAlertTriangle size={13} />
                    Empleado aún VIGENTE en el sistema — verifica que el cese esté registrado correctamente
                  </div>
                )}
              </div>
            )}

            {/* Campos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: c.textSecondary, display: 'block', marginBottom: 4 }}>Motivo de cese</label>
                <select className="form-select" value={motivoCese} onChange={e => setMotivoCese(e.target.value)} style={{ width: '100%' }}>
                  {MOTIVOS_CESE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: c.textSecondary, display: 'block', marginBottom: 4 }}>Fecha de cese</label>
                <input type="date" className="form-input" value={fechaCese} onChange={e => setFechaCese(e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: c.textSecondary, display: 'block', marginBottom: 4 }}>Prom. Gratificación Percibida (1/6) S/</label>
                <input
                  type="number"
                  className="form-input"
                  value={promGratificacion}
                  onChange={e => setPromGratificacion(e.target.value)}
                  min="0" step="0.01"
                  style={{ width: '100%', background: isDark ? 'rgba(251,191,36,.06)' : '#fffbeb', borderColor: isDark ? 'rgba(251,191,36,.15)' : '#fde68a' }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: c.textSecondary, display: 'block', marginBottom: 4 }}>Otros descuentos (S/)</label>
                <input type="number" className="form-input" value={otrosDescuentos} onChange={e => setOtrosDescuentos(e.target.value)} min="0" step="0.01" style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: c.textSecondary, display: 'block', marginBottom: 4 }}>
                  Otros ingresos (S/)&nbsp;<span style={{ fontWeight: 400, fontSize: '0.75rem', color: c.textMuted }}></span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={otrosIngresos}
                  onChange={e => setOtrosIngresos(e.target.value)}
                  min="0" step="0.01"
                  style={{ width: '100%', background: isDark ? 'rgba(52,211,153,.06)' : '#f0fdf4', borderColor: isDark ? 'rgba(52,211,153,.15)' : '#86efac' }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.82rem', color: c.textSecondary, display: 'block', marginBottom: 4 }}>
                  Descripción del ingreso&nbsp;<span style={{ fontWeight: 400, fontSize: '0.75rem', color: c.textMuted }}>— ej: días no pagados, bono, etc.</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={otrosIngresosDesc}
                  onChange={e => setOtrosIngresosDesc(e.target.value)}
                  maxLength={255}
                  style={{ width: '100%', background: isDark ? 'rgba(52,211,153,.04)' : '#f7fdf9', borderColor: isDark ? 'rgba(52,211,153,.10)' : '#bbf7d0' }}
                  placeholder="Motivo o concepto del ingreso adicional"
                />
              </div>
            </div>

            {/* NUEVO: Panel de Vacaciones (como página de vacaciones) */}
            {empleadoSel && (
              <div style={{ background: isDark ? 'rgba(168,85,247,.06)' : '#faf5ff', border: `1px solid ${isDark ? 'rgba(168,85,247,.15)' : '#e9d5ff'}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ margin: 0, color: isDark ? '#c084fc' : '#7c3aed', fontSize: '0.85rem', fontWeight: 700 }}>
                      📅 VACACIONES
                    </h4>
                    {loadingVacaciones && <span style={{ fontSize: '0.75rem', color: c.textMuted }}>Cargando...</span>}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={incluirVacaciones}
                      onChange={e => setIncluirVacaciones(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: incluirVacaciones ? (isDark ? '#c084fc' : '#7c3aed') : c.textMuted }}>
                      Incluir en liquidación
                    </span>
                  </label>
                </div>

                {/* Tabla principal con 3 columnas como página vacaciones */}
                <div style={{ background: isDark ? 'rgba(15,22,41,.4)' : '#fff', borderRadius: 6, padding: '12px', marginBottom: 10 }}>
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${c.borderSubtle}` }}>
                        <th style={{ padding: '8px', textAlign: 'center', color: isDark ? '#a78bfa' : '#7c3aed', fontWeight: 700, background: isDark ? 'rgba(124,58,237,.08)' : '#f5f3ff' }}>
                          Días Acumulados<br/><span style={{ fontSize: '0.65rem', fontWeight: 500 }}>(30 × año)</span>
                        </th>
                        <th style={{ padding: '8px', textAlign: 'center', color: isDark ? '#fbbf24' : '#d97706', fontWeight: 700, background: isDark ? 'rgba(217,119,6,.08)' : '#fef3c7' }}>
                          Total Gozados<br/><span style={{ fontSize: '0.65rem', fontWeight: 500 }}>(informativo)</span>
                        </th>
                        <th style={{ padding: '8px', textAlign: 'center', color: isDark ? '#fb7185' : '#be185d', fontWeight: 700, background: isDark ? 'rgba(190,24,93,.08)' : '#fdf2f8' }}>
                          Por Cobrar<br/><span style={{ fontSize: '0.65rem', fontWeight: 500 }}>(editable)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 800, color: isDark ? '#a78bfa' : '#7c3aed', background: isDark ? 'rgba(124,58,237,.05)' : '#faf5ff' }}>
                          {vacDiasAcumulados}
                          <div style={{ fontSize: '0.65rem', fontWeight: 500, marginTop: 2, color: c.textMuted }}>
                            {vacAntiguedadAnios} años × 30
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 800, color: isDark ? '#fbbf24' : '#d97706', background: isDark ? 'rgba(217,119,6,.05)' : '#fffbeb' }}>
                          {vacTotalGozados}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', background: isDark ? 'rgba(190,24,93,.05)' : '#fef2f8' }}>
                          <input
                            type="number"
                            value={vacPorCobrar}
                            onChange={e => {
                              const nuevoPorCobrar = Math.max(0, parseInt(e.target.value) || 0);
                              setVacPorCobrar(nuevoPorCobrar);
                            }}
                            min="0"
                            max={vacDiasAcumulados}
                            style={{
                              width: '100px',
                              fontSize: '1.3rem',
                              fontWeight: 800,
                              textAlign: 'center',
                              padding: '6px',
                              border: `2px solid ${isDark ? 'rgba(190,24,93,.3)' : '#fb7185'}`,
                              borderRadius: 6,
                              background: isDark ? 'rgba(251,113,133,.1)' : '#fff',
                              color: isDark ? '#fb7185' : '#be185d'
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Cálculo del monto */}
                {incluirVacaciones && vacPorCobrar > 0 && (
                  <div style={{ background: isDark ? 'rgba(52,211,153,.06)' : '#f0fdf4', border: `1px solid ${isDark ? 'rgba(52,211,153,.15)' : '#86efac'}`, borderRadius: 6, padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.75rem', color: isDark ? '#6ee7b7' : '#15803d', fontWeight: 600, marginBottom: 4 }}>
                      ✓ Cálculo de pago por vacaciones:
                    </div>
                    <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: isDark ? 'rgba(52,211,153,.08)' : '#dcfce7', borderRadius: 4 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: isDark ? '#34d399' : '#059669' }}>{vacPorCobrar} días</span>
                        <span style={{ margin: '0 6px', color: c.textMuted }}>×</span>
                        <span style={{ fontWeight: 700, color: isDark ? '#34d399' : '#059669' }}>S/ {vacJornalDiario.toFixed(2)}</span>
                        <span style={{ fontSize: '0.7rem', color: c.textMuted, marginLeft: 4 }}>(base vacacional / 30)</span>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isDark ? '#34d399' : '#059669' }}>
                        = S/ {(vacPorCobrar * vacJornalDiario).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: c.textMuted, marginTop: 6, fontStyle: 'italic' }}>
                      Base vacacional: Sueldo Base + Asig. Familiar (ley peruana)
                    </div>
                  </div>
                )}

                {!incluirVacaciones && (
                  <div style={{ fontSize: '0.75rem', color: c.textMuted, textAlign: 'center', padding: '8px', fontStyle: 'italic' }}>
                    Las vacaciones no se incluirán en el cálculo de la liquidación
                  </div>
                )}

                {/* Detalle de periodos pendientes (colapsable) */}
                {vacacionesPendientes.length > 0 && (
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: c.textSecondary, fontWeight: 600, padding: '6px 0' }}>
                      Ver detalle de periodos pendientes ({vacacionesPendientes.length})
                    </summary>
                    <div style={{ background: isDark ? 'rgba(15,22,41,.4)' : '#fff', borderRadius: 6, padding: '8px 10px', marginTop: 6, maxHeight: 150, overflowY: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                            <th style={{ padding: '4px 6px', textAlign: 'left', color: c.textSecondary, fontWeight: 600 }}>Año</th>
                            <th style={{ padding: '4px 6px', textAlign: 'left', color: c.textSecondary, fontWeight: 600 }}>Periodo</th>
                            <th style={{ padding: '4px 6px', textAlign: 'center', color: c.textSecondary, fontWeight: 600 }}>Días Pend.</th>
                            <th style={{ padding: '4px 6px', textAlign: 'center', color: c.textSecondary, fontWeight: 600 }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vacacionesPendientes.map((p, idx) => (
                            <tr key={idx} style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                              <td style={{ padding: '4px 6px', fontWeight: 600 }}>Año {p.anio_laboral}</td>
                              <td style={{ padding: '4px 6px', fontSize: '0.68rem', color: c.textSecondary }}>
                                {p.periodo_inicio ? new Date(p.periodo_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' }) : ''} - {p.periodo_fin ? new Date(p.periodo_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: isDark ? '#c084fc' : '#7c3aed' }}>
                                {p.dias_pendientes} {p.doble_pago && <span style={{ color: '#fbbf24', fontSize: '0.6rem' }}>×2</span>}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                <span style={{ 
                                  padding: '1px 6px', borderRadius: 3, fontSize: '0.65rem', fontWeight: 600,
                                  background: p.estado === 'VENCIDO' ? '#fee2e2' : '#fef3c7',
                                  color: p.estado === 'VENCIDO' ? '#dc2626' : '#b45309'
                                }}>
                                  {p.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Preview remuneración computable en tiempo real */}
            {empleadoSel && (
              <div style={{ background: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', border: `1px solid ${c.borderSubtle}`, borderRadius: 8, marginBottom: 16, overflow: 'hidden', fontSize: '0.82rem' }}>
                <div style={{ background: '#0891b2', color: '#fff', padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  1. REMUNERACIÓN COMPUTABLE
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '6px 12px', color: c.textSecondary }}>Sueldo Básico</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>
                        S/ {parseFloat(empleadoSel.sueldo_base || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding: '6px 12px', color: c.textSecondary }}>Asignación Familiar</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>
                        S/ {parseFloat(empleadoSel.tiene_asignacion_familiar ? (empleadoSel.val_asig_familiar || 113) : 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: `2px solid ${isDark ? 'rgba(251,191,36,.15)' : '#fde68a'}`, background: isDark ? 'rgba(251,191,36,.06)' : '#fffbeb' }}>
                      <td style={{ padding: '6px 12px', color: '#92400e', fontWeight: 600 }}>Promedio de Gratificación Percibida (1/6)</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, color: parseFloat(promGratificacion || 0) > 0 ? '#92400e' : c.textMuted }}>
                        S/ {parseFloat(promGratificacion || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {parseFloat(otrosIngresos || 0) > 0 && (
                      <tr style={{ borderBottom: `1px solid ${isDark ? 'rgba(52,211,153,.15)' : '#86efac'}`, background: isDark ? 'rgba(52,211,153,.06)' : '#f0fdf4' }}>
                        <td style={{ padding: '6px 12px', color: '#15803d', fontWeight: 600 }}>Otros ingresos</td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                          S/ {parseFloat(otrosIngresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr style={{ background: '#e0f2fe' }}>
                      <td style={{ padding: '7px 12px', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>TOTAL REMUNERACIÓN</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 800, color: '#0891b2', fontSize: '0.95rem' }}>
                        S/ {(
                          parseFloat(empleadoSel.sueldo_base || 0) +
                          parseFloat(empleadoSel.tiene_asignacion_familiar ? (empleadoSel.val_asig_familiar || 113) : 0) +
                          parseFloat(promGratificacion || 0) +
                          parseFloat(otrosIngresos || 0)
                        ).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {motivoCese === 'DESPIDO' && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiAlertTriangle size={16} />
                Se calculará indemnización por despido arbitrario
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={calcularLiquidacion} disabled={calculando || !empleadoSel}>
                {calculando ? 'Calculando...' : <><FiDollarSign size={15} /> Calcular Liquidación</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: DETALLE LIQUIDACIÓN ===== */}
      {showDetalle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 780, maxHeight: '92vh', overflow: 'auto', padding: 0 }}>
            {loadingDetalle ? <div style={{ padding: 60, textAlign: 'center' }}><Loading /></div> : detalle && (
              <>
                {/* Header */}
                <div style={{ background: isDark ? 'rgba(13,20,37,.9)' : '#1e293b', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Liquidación #{detalle.id}</h3>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{detalle.empleado?.apellidos}, {detalle.empleado?.nombres} — DNI: {detalle.empleado?.dni}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(() => { const b = ESTADOS_BADGE[detalle.estado]; return <span style={{ padding: '3px 12px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', background: b.bg, color: b.color }}>{b.label}</span>; })()}
                    <button onClick={() => setShowDetalle(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}><FiX size={20} /></button>
                  </div>
                </div>

                <div style={{ padding: 24 }}>
                  {/* Info general */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12, fontSize: '0.82rem' }}>
                    <div style={{ background: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', padding: 10, borderRadius: 6 }}>
                      <div style={{ color: c.textMuted, fontSize: '0.72rem', marginBottom: 2 }}>FECHA INGRESO</div>
                      <div style={{ fontWeight: 600 }}>{(detalle.fecha_ingreso || '').split('T')[0]}</div>
                    </div>
                    <div style={{ background: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', padding: 10, borderRadius: 6 }}>
                      <div style={{ color: c.textMuted, fontSize: '0.72rem', marginBottom: 2 }}>FECHA CESE</div>
                      <div style={{ fontWeight: 600 }}>{(detalle.fecha_cese || '').split('T')[0]}</div>
                    </div>
                    <div style={{ background: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', padding: 10, borderRadius: 6 }}>
                      <div style={{ color: c.textMuted, fontSize: '0.72rem', marginBottom: 2 }}>MOTIVO</div>
                      <div style={{ fontWeight: 600 }}>{detalle.motivo_cese}</div>
                    </div>
                    <div style={{ background: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', padding: 10, borderRadius: 6, gridColumn: 'span 3' }}>
                      <div style={{ color: c.textMuted, fontSize: '0.72rem', marginBottom: 2 }}>SISTEMA DE PENSIÓN</div>
                      <div style={{ fontWeight: 600, color: c.textPrimary }}>{detalle.empleado?.sistema_pension?.nombre ?? detalle.empleado?.sistemaPension?.nombre ?? '—'}</div>
                    </div>
                  </div>

                  {/* Tiempo de servicio y remuneración — fila destacada */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {/* Tiempo de servicio */}
                    <div style={{ background: isDark ? 'rgba(13,20,37,.9)' : '#1e293b', borderRadius: 8, padding: '12px 16px', color: '#fff' }}>
                      <div style={{ fontSize: '0.7rem', color: c.textMuted, marginBottom: 6, letterSpacing: '0.05em' }}>TIEMPO DE SERVICIO TOTAL</div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>{detalle.tiempo_servicio_anos ?? 0}</div>
                          <div style={{ fontSize: '0.68rem', color: c.textMuted, marginTop: 2 }}>AÑO{detalle.tiempo_servicio_anos !== 1 ? 'S' : ''}</div>
                        </div>
                        <div style={{ color: c.textSecondary, fontSize: '1.2rem' }}>·</div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', lineHeight: 1 }}>{detalle.tiempo_servicio_meses ?? 0}</div>
                          <div style={{ fontSize: '0.68rem', color: c.textMuted, marginTop: 2 }}>MES{detalle.tiempo_servicio_meses !== 1 ? 'ES' : ''}</div>
                        </div>
                        <div style={{ color: c.textSecondary, fontSize: '1.2rem' }}>·</div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7dd3fc', lineHeight: 1 }}>{detalle.tiempo_servicio_dias ?? 0}</div>
                          <div style={{ fontSize: '0.68rem', color: c.textMuted, marginTop: 2 }}>DÍA{detalle.tiempo_servicio_dias !== 1 ? 'S' : ''}</div>
                        </div>
                      </div>
                      {/* Nota sobre antigüedad */}
                      <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(251,191,36,.15)', borderRadius: 4, fontSize: '0.68rem', color: '#fbbf24' }}>
                        💡 Para vacaciones se usan años completos: <strong>{detalle.tiempo_servicio_anos ?? 0} años = {(detalle.tiempo_servicio_anos ?? 0) * 30} días acumulados</strong>
                      </div>
                    </div>
                    {/* Remuneración y períodos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ background: isDark ? 'rgba(56,189,248,.06)' : '#f0f9ff', border: `1px solid ${isDark ? 'rgba(56,189,248,.15)' : '#bae6fd'}`, borderRadius: 6, padding: '8px 12px', fontSize: '0.8rem' }}>
                        <div style={{ color: '#0369a1', fontWeight: 700, marginBottom: 4, fontSize: '0.72rem' }}>REMUNERACIÓN COMPUTABLE</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0891b2' }}>{formatMoney(detalle.remuneracion_computable)}</div>
                        <div style={{ color: c.textSecondary, fontSize: '0.72rem', marginTop: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                          <div>Sueldo base<br /><strong style={{ color: c.textPrimary }}>{formatMoney(detalle.remuneracion_basica)}</strong></div>
                          <div>Asig. Familiar<br /><strong style={{ color: c.textPrimary }}>{formatMoney(detalle.asignacion_familiar)}</strong></div>
                          <div>Prom. Grat. 1/6<br /><strong style={{ color: parseFloat(detalle.prom_gratificacion || 0) > 0 ? '#0891b2' : c.textMuted }}>{formatMoney(detalle.prom_gratificacion || 0)}</strong></div>
                        </div>
                      </div>
                      <div style={{ background: isDark ? 'rgba(148,163,184,.04)' : '#fafafa', border: `1px solid ${c.borderSubtle}`, borderRadius: 6, padding: '6px 12px', fontSize: '0.75rem', color: c.textSecondary }}>
                        <span style={{ fontWeight: 600, color: c.textSecondary }}>Base vacacional: </span>
                        {formatMoney(detalle.vacaciones_base ?? (parseFloat(detalle.remuneracion_basica || 0) + parseFloat(detalle.asignacion_familiar || 0)))}
                        <span style={{ marginLeft: 8, opacity: 0.7 }}>(Sueldo + AF, sin Prom. Grat.)</span>
                      </div>
                    </div>
                  </div>

                  {/* NUEVO: Panel de Vacaciones por Cobrar */}
                  {detalle.incluir_vacaciones_pendientes && detalle.vacaciones_dias_disponibles > 0 && (
                    <div style={{ background: isDark ? 'rgba(168,85,247,.08)' : '#faf5ff', border: `2px solid ${isDark ? 'rgba(168,85,247,.25)' : '#e9d5ff'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, color: isDark ? '#c084fc' : '#7c3aed', marginBottom: 10, fontSize: '0.8rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📅</span> VACACIONES POR COBRAR
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 10 }}>
                        <div style={{ textAlign: 'center', background: isDark ? 'rgba(124,58,237,.08)' : '#f5f3ff', padding: '10px', borderRadius: 6 }}>
                          <div style={{ fontSize: '0.68rem', color: c.textSecondary, marginBottom: 4 }}>Días Acumulados</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isDark ? '#a78bfa' : '#7c3aed' }}>
                            {(detalle.tiempo_servicio_anos ?? 0) * 30}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: c.textMuted, marginTop: 2 }}>
                            {detalle.tiempo_servicio_anos ?? 0} años × 30
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', background: isDark ? 'rgba(217,119,6,.08)' : '#fef3c7', padding: '10px', borderRadius: 6 }}>
                          <div style={{ fontSize: '0.68rem', color: c.textSecondary, marginBottom: 4 }}>Total Gozados</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isDark ? '#fbbf24' : '#d97706' }}>
                            {((detalle.tiempo_servicio_anos ?? 0) * 30) - (detalle.vacaciones_dias_disponibles ?? 0)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', background: isDark ? 'rgba(190,24,93,.08)' : '#fdf2f8', padding: '10px', borderRadius: 6 }}>
                          <div style={{ fontSize: '0.68rem', color: c.textSecondary, marginBottom: 4 }}>Por Cobrar</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isDark ? '#fb7185' : '#be185d' }}>
                            {detalle.vacaciones_dias_disponibles ?? 0}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: c.textMuted, marginTop: 2 }}>días pendientes</div>
                        </div>
                        <div style={{ textAlign: 'center', background: isDark ? 'rgba(52,211,153,.08)' : '#d1fae5', padding: '10px', borderRadius: 6 }}>
                          <div style={{ fontSize: '0.68rem', color: c.textSecondary, marginBottom: 4 }}>Jornal Diario</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: isDark ? '#34d399' : '#059669' }}>
                            S/ {((parseFloat(detalle.remuneracion_basica || 0) + parseFloat(detalle.asignacion_familiar || 0)) / 30).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div style={{ background: isDark ? 'rgba(52,211,153,.12)' : '#dcfce7', border: `1px solid ${isDark ? 'rgba(52,211,153,.25)' : '#86efac'}`, borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: isDark ? '#6ee7b7' : '#15803d' }}>
                          <strong>{detalle.vacaciones_dias_disponibles ?? 0} días</strong> × S/ {((parseFloat(detalle.remuneracion_basica || 0) + parseFloat(detalle.asignacion_familiar || 0)) / 30).toFixed(2)} (jornal)
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#34d399' : '#059669' }}>
                          = S/ {((detalle.vacaciones_dias_disponibles ?? 0) * ((parseFloat(detalle.remuneracion_basica || 0) + parseFloat(detalle.asignacion_familiar || 0)) / 30)).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: c.textMuted, marginTop: 8, fontStyle: 'italic', textAlign: 'center' }}>
                        Este monto está incluido en "Vacaciones no gozadas" del desglose abajo
                      </div>
                    </div>
                  )}

                  {/* Desglose de períodos por beneficio */}
                  <div style={{ background: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', border: `1px solid ${c.borderSubtle}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 700, color: c.textSecondary, marginBottom: 8, fontSize: '0.72rem', letterSpacing: '0.05em' }}>PERÍODOS POR BENEFICIO</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {/* CTS */}
                      <div style={{ background: isDark ? 'rgba(15,22,41,.4)' : '#fff', borderRadius: 6, padding: '8px 10px', border: `1px solid ${c.borderSubtle}` }}>
                        <div style={{ fontSize: '0.68rem', color: c.textMuted, marginBottom: 4, fontWeight: 700 }}>CTS TRUNCA</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: c.textPrimary }}>{detalle.cts_meses ?? 0}<span style={{ color: c.textMuted, fontWeight: 400 }}>m</span></span>
                          <span style={{ color: c.borderSubtle }}>+</span>
                          <span style={{ fontWeight: 700, color: c.textPrimary }}>{detalle.cts_dias ?? 0}<span style={{ color: c.textMuted, fontWeight: 400 }}>d</span></span>
                        </div>
                        <div style={{ color: '#0891b2', fontWeight: 700, marginTop: 4 }}>{formatMoney(detalle.cts_trunca)}</div>
                      </div>
                      {/* Vacaciones truncas */}
                      <div style={{ background: isDark ? 'rgba(15,22,41,.4)' : '#fff', borderRadius: 6, padding: '8px 10px', border: `1px solid ${c.borderSubtle}` }}>
                        <div style={{ fontSize: '0.68rem', color: c.textMuted, marginBottom: 4, fontWeight: 700 }}>VACACIONES TRUNCAS</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: c.textPrimary }}>{detalle.vacaciones_truncas_meses ?? 0}<span style={{ color: c.textMuted, fontWeight: 400 }}>m</span></span>
                          <span style={{ color: c.borderSubtle }}>+</span>
                          <span style={{ fontWeight: 700, color: c.textPrimary }}>{detalle.vacaciones_truncas_dias ?? 0}<span style={{ color: c.textMuted, fontWeight: 400 }}>d</span></span>
                        </div>
                        {parseFloat(detalle.vacaciones_descuento_pension || 0) > 0 ? (
                          <>
                            <div style={{ fontSize: '0.7rem', color: c.textSecondary }}>Bruto: <span style={{ fontWeight: 600 }}>{formatMoney(detalle.vacaciones_truncas)}</span></div>
                            <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                              {detalle.empleado?.sistemaPension?.tipo ?? detalle.empleado?.sistema_pension?.tipo ?? 'AFP/ONP'}
                              {' '}
                              {detalle.empleado?.sistemaPension?.tipo === 'ONP' || detalle.empleado?.sistema_pension?.tipo === 'ONP'
                                ? `${parseFloat(detalle.empleado?.sistemaPension?.aporte ?? detalle.empleado?.sistema_pension?.aporte ?? 13).toFixed(2)}%`
                                : `${(parseFloat(detalle.empleado?.sistemaPension?.aporte ?? detalle.empleado?.sistema_pension?.aporte ?? 10) + parseFloat(detalle.empleado?.sistemaPension?.comision ?? detalle.empleado?.sistema_pension?.comision ?? 0) + parseFloat(detalle.empleado?.sistemaPension?.seguro ?? detalle.empleado?.sistema_pension?.seguro ?? 0)).toFixed(2)}%`
                              }:{' '}
                              <span style={{ fontWeight: 600 }}>-{formatMoney(detalle.vacaciones_descuento_pension)}</span>
                            </div>
                            <div style={{ color: '#0891b2', fontWeight: 700, marginTop: 2 }}>Neto: {formatMoney(detalle.vacaciones_neto ?? detalle.vacaciones_truncas)}</div>
                          </>
                        ) : (
                          <div style={{ color: '#0891b2', fontWeight: 700, marginTop: 4 }}>{formatMoney(detalle.vacaciones_truncas)}</div>
                        )}
                      </div>
                      {/* Gratificación trunca */}
                      <div style={{ background: isDark ? 'rgba(15,22,41,.4)' : '#fff', borderRadius: 6, padding: '8px 10px', border: `1px solid ${c.borderSubtle}` }}>
                        <div style={{ fontSize: '0.68rem', color: c.textMuted, marginBottom: 4, fontWeight: 700 }}>GRATIFICACIÓN ({detalle.gratificacion_semestre})</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: c.textPrimary }}>{detalle.gratificacion_meses ?? 0}<span style={{ color: c.textMuted, fontWeight: 400 }}>m</span></span>
                          {(detalle.gratificacion_dias ?? 0) > 0 && (
                            <>
                              <span style={{ color: c.borderSubtle }}>+</span>
                              <span style={{ fontWeight: 700, color: c.textMuted }}>{detalle.gratificacion_dias}<span style={{ fontWeight: 400 }}>d*</span></span>
                            </>
                          )}
                        </div>
                        <div style={{ color: '#0891b2', fontWeight: 700, marginTop: 4 }}>{formatMoney(detalle.gratificacion_trunca)}</div>
                        {(detalle.gratificacion_dias ?? 0) > 0 && (
                          <div style={{ color: c.textMuted, fontSize: '0.65rem', marginTop: 2 }}>*días no computan por ley</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resumen por concepto — estilo Excel */}
                  <div style={{ background: isDark ? 'rgba(52,211,153,.06)' : '#f0fdf4', border: `1px solid ${isDark ? 'rgba(52,211,153,.15)' : '#bbf7d0'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, color: isDark ? '#6ee7b7' : '#15803d', marginBottom: 8, fontSize: '0.72rem', letterSpacing: '0.05em' }}>RESUMEN LIQUIDACIÓN</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.8rem', alignItems: 'stretch' }}>
                      <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                        <div style={{ color: c.textSecondary, fontSize: '0.68rem', marginBottom: 2 }}>CTS TRUNCA</div>
                        <div style={{ fontWeight: 700, color: '#0891b2' }}>{formatMoney(detalle.cts_trunca)}</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                        <div style={{ color: c.textSecondary, fontSize: '0.68rem', marginBottom: 2 }}>VACACIONES NETO</div>
                        <div style={{ fontWeight: 700, color: '#0891b2' }}>{formatMoney(detalle.vacaciones_neto ?? detalle.vacaciones_truncas)}</div>
                      </div>
                      <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                        <div style={{ color: c.textSecondary, fontSize: '0.68rem', marginBottom: 2 }}>GRATIFICACIÓN</div>
                        <div style={{ fontWeight: 700, color: '#0891b2' }}>{formatMoney(detalle.gratificacion_trunca)}</div>
                      </div>
                      {parseFloat(detalle.otros_ingresos || 0) > 0 && (
                        <div style={{ textAlign: 'center', flex: '1 1 100px' }}>
                          <div style={{ color: c.textSecondary, fontSize: '0.68rem', marginBottom: 2 }}>OTROS INGRESOS</div>
                          <div style={{ fontWeight: 700, color: '#15803d' }}>{formatMoney(detalle.otros_ingresos)}</div>
                          {detalle.otros_ingresos_descripcion && (
                            <div style={{ fontSize: '0.65rem', color: c.textMuted, marginTop: 2, fontStyle: 'italic' }}>{detalle.otros_ingresos_descripcion}</div>
                          )}
                        </div>
                      )}
                      <div style={{ textAlign: 'center', flex: '1 1 110px', borderLeft: '2px solid #86efac', paddingLeft: 8 }}>
                        <div style={{ color: isDark ? '#6ee7b7' : '#15803d', fontSize: '0.68rem', marginBottom: 2, fontWeight: 700 }}>TOTAL</div>
                        <div style={{ fontWeight: 800, color: isDark ? '#6ee7b7' : '#15803d', fontSize: '1rem' }}>{formatMoney(detalle.total_neto)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Tabla detalles */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: 20 }}>
                    <thead>
                      <tr style={{ background: isDark ? 'rgba(148,163,184,.06)' : '#f1f5f9' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Concepto</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>Tipo</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Base</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detalle.detalles || []).map((d, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                          <td style={{ padding: '8px 12px' }}>
                            {d.concepto}
                            {d.formula_aplicada && <div style={{ fontSize: '0.7rem', color: c.textMuted, marginTop: 2 }}>{d.formula_aplicada}</div>}
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '1px 8px', borderRadius: 4, fontWeight: 600, fontSize: '0.72rem',
                              background: d.tipo === 'INGRESO' ? '#dcfce7' : '#fee2e2',
                              color: d.tipo === 'INGRESO' ? '#15803d' : '#dc2626',
                            }}>{d.tipo}</span>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: c.textSecondary }}>{d.base_calculo ? formatMoney(d.base_calculo) : '—'}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: d.tipo === 'INGRESO' ? '#15803d' : '#dc2626' }}>
                            {d.tipo === 'DESCUENTO' ? '-' : ''}{formatMoney(d.monto)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Resumen totales */}
                  <div style={{ background: isDark ? 'rgba(13,20,37,.9)' : '#1e293b', borderRadius: 8, padding: 16, color: '#fff', marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: 4 }}>TOTAL INGRESOS</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>{formatMoney(detalle.total_ingresos)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: 4 }}>TOTAL DESCUENTOS</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171' }}>-{formatMoney(detalle.total_descuentos)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: 4 }}>NETO A PAGAR</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>{formatMoney(detalle.total_neto)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Edición manual (solo borrador) */}
                  {detalle.estado === 'BORRADOR' && editando && (
                    <div style={{ background: isDark ? 'rgba(251,191,36,.06)' : '#fffbeb', border: `1px solid ${isDark ? 'rgba(251,191,36,.15)' : '#fde68a'}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                      <h4 style={{ margin: '0 0 12px', color: '#92400e' }}>Ajustes manuales</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.82rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Días vacaciones pendientes</label>
                          <input type="number" className="form-input" value={editVacDias} onChange={e => setEditVacDias(e.target.value)} min="0" style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Vacaciones no gozadas (S/)</label>
                          <input type="number" className="form-input" value={editVacMonto} onChange={e => setEditVacMonto(e.target.value)} min="0" step="0.01" style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Otros descuentos (S/)</label>
                          <input type="number" className="form-input" value={editOtrosDesc} onChange={e => setEditOtrosDesc(e.target.value)} min="0" step="0.01" style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Otros ingresos (S/)</label>
                          <input
                            type="number" className="form-input"
                            value={editOtrosIngresos}
                            onChange={e => setEditOtrosIngresos(e.target.value)}
                            min="0" step="0.01"
                            style={{ width: '100%', background: isDark ? 'rgba(52,211,153,.06)' : '#f0fdf4', borderColor: isDark ? 'rgba(52,211,153,.15)' : '#86efac' }}
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Descripción del ingreso adicional</label>
                          <input
                            type="text" className="form-input"
                            value={editOtrosIngresosDesc}
                            onChange={e => setEditOtrosIngresosDesc(e.target.value)}
                            maxLength={255}
                            style={{ width: '100%' }}
                            placeholder="Motivo o concepto del ingreso adicional"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Observaciones</label>
                          <input className="form-input" value={editObs} onChange={e => setEditObs(e.target.value)} style={{ width: '100%' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                        <button className="btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={guardarEdicion}>Guardar cambios</button>
                      </div>
                    </div>
                  )}

                  {/* Observaciones */}
                  {detalle.observaciones && (
                    <div style={{ background: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', borderRadius: 6, padding: 12, marginBottom: 16, fontSize: '0.82rem' }}>
                      <strong>Observaciones:</strong> {detalle.observaciones}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {detalle.estado === 'BORRADOR' && !editando && (
                      <>
                        <button className="btn-secondary" onClick={iniciarEdicion}>
                          <FiEdit2 size={14} /> Ajustar
                        </button>
                        <button style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => eliminarLiquidacion(detalle.id)}>
                          <FiTrash2 size={14} /> Eliminar
                        </button>
                        <button className="btn-primary" onClick={() => aprobarLiquidacion(detalle.id)}>
                          <FiCheck size={14} /> Aprobar
                        </button>
                      </>
                    )}
                    {detalle.estado === 'APROBADO' && (
                      <>
                        <button style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => eliminarLiquidacion(detalle.id)}>
                          <FiTrash2 size={14} /> Eliminar
                        </button>
                        <button className="btn-success" onClick={() => pagarLiquidacion(detalle.id)}>
                          <FiDollarSign size={14} /> Marcar como Pagada
                        </button>
                        <button className="btn-primary" onClick={() => descargarPDF(detalle.id)}>
                          <FiDownload size={14} /> Descargar PDF
                        </button>
                      </>
                    )}
                    {detalle.estado === 'PAGADO' && (
                      <>
                        <button style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => eliminarLiquidacion(detalle.id)}>
                          <FiTrash2 size={14} /> Eliminar
                        </button>
                        <button className="btn-primary" onClick={() => descargarPDF(detalle.id)}>
                          <FiDownload size={14} /> Descargar PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Liquidaciones;
