import { useState, useEffect, useMemo, Fragment } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiDownload, FiSearch, FiX, FiUser, FiSun, FiChevronDown, FiChevronUp, FiPlus, FiEdit2, FiTrash2, FiSave, FiList } from 'react-icons/fi';
import { getVacacionesResumen, getVacacionesEmpleado, getVacacionesRegistros, getVacacionesRegistrosEmpleado, createVacacionesRegistro, updateVacacionesRegistro, deleteVacacionesRegistro } from '../services/vacacionesService';
import { formatMoney } from '../utils/helpers';
import { MESES } from '../utils/constants';
import { useCatalogos } from '../contexts/CatalogosContext';
import { useThemeColors } from '../utils/darkColors';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/common/Loading';
import { toast } from 'react-toastify';

const getMesNombre = (m) => MESES[m - 1] || '';

function Vacaciones() {
  const hoy = new Date();
  const { isDark, c } = useThemeColors();
  const { hasPermission } = useAuth();

  // Estilos de tabla dependientes del tema
  const thStyle = {
    padding: '8px 10px',
    fontWeight: 600,
    fontSize: '0.73rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    borderBottom: `2px solid ${c.tableBorder}`,
    borderRight: `1px solid ${isDark ? 'rgba(99,118,163,.08)' : 'rgba(255,255,255,.15)'}`,
    position: 'sticky',
    top: 0,
    color: isDark ? '#c4ccdb' : '#fff',
  };

  const tdStyle = {
    padding: '5px 6px',
    textAlign: 'center',
    borderBottom: `1px solid ${c.borderSubtle}`,
    whiteSpace: 'nowrap',
  };

  const thCalHd = {
    padding: '8px 10px',
    fontWeight: 700,
    fontSize: '0.72rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    borderBottom: `1px solid ${c.tableBorder}`,
    borderRight: `1px solid ${isDark ? 'rgba(99,118,163,.08)' : 'rgba(255,255,255,.15)'}`,
    color: isDark ? '#c4ccdb' : '#fff',
  };

  const thCalSub = {
    padding: '6px 6px',
    fontWeight: 700,
    fontSize: '0.65rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    borderBottom: `2px solid ${c.tableBorder}`,
    borderRight: `1px solid ${isDark ? 'rgba(99,118,163,.08)' : 'rgba(255,255,255,.15)'}`,
    color: '#fff',
  };

  const tdCalStyle = {
    padding: '4px 4px',
    textAlign: 'center',
    borderBottom: `1px solid ${c.borderSubtle}`,
    whiteSpace: 'nowrap',
    fontSize: '0.72rem',
  };

  const [anio, setAnio] = useState(hoy.getFullYear());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState('');
  const [situacionFiltro, setSituacionFiltro] = useState('');
  const [modalDetalle, setModalDetalle] = useState({ show: false, empleado: null, historial: [], loading: false });
  const { catalogos } = useCatalogos();

  useEffect(() => {
    cargarResumen();
  }, [anio]);

  const cargarResumen = async () => {
    setLoading(true);
    try {
      const result = await getVacacionesResumen(anio);
      setData(result);
    } catch (error) {
      toast.error('Error al cargar vacaciones: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const [expandedAnios, setExpandedAnios] = useState({});

  // ─ Estados tab Calendario ──────────────────────────────────────────────
  const [tab, setTab] = useState('resumen');
  const [anioInicioCal, setAnioInicioCal] = useState(hoy.getFullYear() - 3);
  const [anioFinCal, setAnioFinCal] = useState(hoy.getFullYear());
  const [calData, setCalData] = useState({ empleados: [], registros: [] });
  const [loadingCal, setLoadingCal] = useState(false);
  const [modalReg, setModalReg] = useState({
    show: false, empleado: null,
    editId: null, fecha_inicio: '', fecha_fin: '', dias: '', descripcion: '',
    saving: false, celdaLabel: '',
  });
  const [modalRegRows, setModalRegRows] = useState([]);
  const [modalRegRowsLoading, setModalRegRowsLoading] = useState(false);
  const [modalQuick, setModalQuick] = useState({
    show: false, empleado_id: '', busqueda: '',
    anio: new Date().getFullYear(), mes: new Date().getMonth() + 1,
    dias: '', descripcion: '', saving: false,
  });
  const calLoaded = calData.empleados.length > 0;

  const toggleAnio = (anio) => setExpandedAnios(prev => ({ ...prev, [anio]: !prev[anio] }));

  // ─ Calendario: funciones ────────────────────────────────────────────────
  const cargarCalendario = async (inicio, fin) => {
    const _inicio = inicio ?? anioInicioCal;
    const _fin    = fin    ?? anioFinCal;
    setLoadingCal(true);
    try {
      const result = await getVacacionesRegistros(_inicio, _fin);
      setCalData(result);
    } catch (err) {
      toast.error('Error al cargar el calendario de vacaciones');
    } finally {
      setLoadingCal(false);
    }
  };

  // Reparte los días de un registro entre los meses que abarca el período
  const splitDiasPorMes = (fechaInicio, fechaFin, diasTotal) => {
    if (!fechaInicio || !fechaFin) return [];
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin    = new Date(fechaFin    + 'T00:00:00');
    const dias   = parseInt(diasTotal) || 0;
    if (inicio.getFullYear() === fin.getFullYear() && inicio.getMonth() === fin.getMonth())
      return [{ anio: inicio.getFullYear(), mes: inicio.getMonth() + 1, dias }];
    const totalCal = Math.round((fin - inicio) / 86400000) + 1;
    const splits = [];
    let remaining = dias;
    let current   = new Date(inicio);
    while (current <= fin && remaining > 0) {
      const a   = current.getFullYear();
      const m   = current.getMonth() + 1;
      const eom = new Date(a, m, 0);
      const pe  = fin < eom ? fin : eom;
      const calInMonth = Math.round((pe - current) / 86400000) + 1;
      const isLast = pe >= fin;
      const d = isLast
        ? remaining
        : Math.max(1, Math.min(Math.round((calInMonth / totalCal) * dias), remaining - 1));
      splits.push({ anio: a, mes: m, dias: d });
      remaining -= d;
      current = new Date(a, m, 1);
    }
    return splits;
  };

  const buildGrid = (registros) => {
    const g = {};
    (registros || []).forEach(r => {
      splitDiasPorMes(r.fecha_inicio, r.fecha_fin, r.dias).forEach(({ anio, mes, dias }) => {
        if (!g[r.empleado_id])        g[r.empleado_id] = {};
        if (!g[r.empleado_id][anio])  g[r.empleado_id][anio] = {};
        g[r.empleado_id][anio][mes] = (g[r.empleado_id][anio][mes] || 0) + dias;
      });
    });
    return g;
  };

  const calcDiasAuto = (fi, ff) => {
    if (!fi || !ff) return '';
    const i = new Date(fi + 'T00:00:00'), f = new Date(ff + 'T00:00:00');
    return f < i ? '' : String(Math.round((f - i) / 86400000) + 1);
  };

  const cargarModalRegRows = async (empId) => {
    if (!empId) return;
    setModalRegRows([]);
    setModalRegRowsLoading(true);
    try {
      const rows = await getVacacionesRegistrosEmpleado(empId);
      setModalRegRows(Array.isArray(rows) ? rows : []);
    } catch {
      setModalRegRows([]);
    } finally {
      setModalRegRowsLoading(false);
    }
  };

  const handleOpenModalRegistro = (emp) => {
    setModalReg({ show: true, empleado: emp, editId: null, fecha_inicio: '', fecha_fin: '', dias: '', descripcion: '', saving: false, celdaLabel: '' });
    cargarModalRegRows(emp.empleado_id);
  };

  const handleClickCelda = (emp, anio, mes) => {
    const mm = String(mes).padStart(2, '0');
    const fechaInicio = `${anio}-${mm}-01`;
    const lastDay = new Date(anio, mes, 0).getDate();
    const fechaFin = `${anio}-${mm}-${String(lastDay).padStart(2, '0')}`;
    const dias = calcDiasAuto(fechaInicio, fechaFin);
    const MSHORT = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    setModalReg({
      show: true, empleado: emp, editId: null,
      fecha_inicio: fechaInicio, fecha_fin: fechaFin,
      dias: dias || '', descripcion: '',
      saving: false,
      celdaLabel: `${MSHORT[mes - 1]} ${anio}`,
    });
    cargarModalRegRows(emp.empleado_id);
  };

  const handleGuardarRegistro = async () => {
    if (!modalReg.fecha_inicio || !modalReg.fecha_fin || !modalReg.dias) {
      toast.warning('Completa fecha inicio, fecha fin y días'); return;
    }
    if (parseInt(modalReg.dias) <= 0) { toast.warning('Los días deben ser mayor a 0'); return; }
    // Validar que la fecha no sea anterior a la fecha de ingreso del empleado
    const fechaIngreso = modalReg.empleado?.fecha_ingreso;
    if (fechaIngreso && modalReg.fecha_inicio < fechaIngreso) {
      toast.error(`No se puede registrar vacaciones antes de la fecha de ingreso (${fechaIngreso})`);
      return;
    }
    // Calcular rango correcto ANTES de los setState (que son asíncronos)
    const anioRegistro = parseInt(modalReg.fecha_inicio.substring(0, 4));
    const nuevoInicio = Math.min(anioInicioCal, anioRegistro);
    const nuevoFin   = Math.max(anioFinCal,    anioRegistro);
    if (nuevoInicio !== anioInicioCal) setAnioInicioCal(nuevoInicio);
    if (nuevoFin    !== anioFinCal)    setAnioFinCal(nuevoFin);
    setModalReg(prev => ({ ...prev, saving: true }));
    try {
      const payload = {
        empleado_id:  modalReg.empleado.empleado_id,
        fecha_inicio: modalReg.fecha_inicio,
        fecha_fin:    modalReg.fecha_fin,
        dias:         parseInt(modalReg.dias),
        descripcion:  modalReg.descripcion,
      };
      if (modalReg.editId) {
        await updateVacacionesRegistro(modalReg.editId, payload);
        toast.success('Registro actualizado');
      } else {
        await createVacacionesRegistro(payload);
        toast.success('Registro guardado');
      }
      setModalReg(prev => ({ ...prev, editId: null, fecha_inicio: '', fecha_fin: '', dias: '', descripcion: '', saving: false, celdaLabel: '' }));
      cargarModalRegRows(modalReg.empleado?.empleado_id);
      // Recargar ambas fuentes para reflejar el cambio en cualquier tab
      cargarResumen();
      cargarCalendario(nuevoInicio, nuevoFin);
    } catch (err) {
      toast.error('Error al guardar el registro');
      setModalReg(prev => ({ ...prev, saving: false }));
    }
  };

  const handleEliminarRegistro = async (id) => {
    if (!confirm('¿Eliminar este registro de vacaciones?')) return;
    try {
      await deleteVacacionesRegistro(id);
      toast.success('Registro eliminado');
      cargarModalRegRows(modalReg.empleado?.empleado_id);
      cargarResumen();
      cargarCalendario();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const handleGuardarQuick = async () => {
    if (!modalQuick.empleado_id) { toast.warning('Selecciona un empleado'); return; }
    if (!modalQuick.dias || parseInt(modalQuick.dias) <= 0) { toast.warning('Ingresa una cantidad de días válida'); return; }
    // Validar fecha de ingreso
    const empSel = data?.empleados?.find(e => e.empleado_id === parseInt(modalQuick.empleado_id));
    const mm = String(modalQuick.mes).padStart(2, '0');
    const fechaInicio = `${modalQuick.anio}-${mm}-01`;
    const lastDay = new Date(modalQuick.anio, modalQuick.mes, 0).getDate();
    const fechaFin = `${modalQuick.anio}-${mm}-${String(lastDay).padStart(2, '0')}`;
    if (empSel?.fecha_ingreso && fechaInicio < empSel.fecha_ingreso) {
      toast.error(`Fecha anterior al ingreso del empleado (${empSel.fecha_ingreso})`); return;
    }
    setModalQuick(prev => ({ ...prev, saving: true }));
    try {
      await createVacacionesRegistro({
        empleado_id:  parseInt(modalQuick.empleado_id),
        fecha_inicio: fechaInicio,
        fecha_fin:    fechaFin,
        dias:         parseInt(modalQuick.dias),
        descripcion:  modalQuick.descripcion,
      });
      toast.success('Registro guardado');
      setModalQuick(prev => ({ ...prev, dias: '', descripcion: '', saving: false }));
      const nuevoInicio = Math.min(anioInicioCal, modalQuick.anio);
      const nuevoFin   = Math.max(anioFinCal,    modalQuick.anio);
      if (nuevoInicio !== anioInicioCal) setAnioInicioCal(nuevoInicio);
      if (nuevoFin    !== anioFinCal)    setAnioFinCal(nuevoFin);
      cargarResumen();
      cargarCalendario(nuevoInicio, nuevoFin);
    } catch (err) {
      toast.error('Error al guardar');
      setModalQuick(prev => ({ ...prev, saving: false }));
    }
  };

  const handleVerDetalle = async (empId) => {
    setModalDetalle({ show: true, empleado: null, historial: [], loading: true });
    try {
      const result = await getVacacionesEmpleado(empId);
      setModalDetalle({ show: true, empleado: result.empleado, historial: result.historial, loading: false });
    } catch (error) {
      toast.error('Error al cargar detalle');
      setModalDetalle(prev => ({ ...prev, loading: false }));
    }
  };

  // Obtener unidades únicas
  const unidades = useMemo(() => {
    if (!data?.empleados) return [];
    const set = new Set(data.empleados.map(e => e.unidad).filter(Boolean));
    return [...set].sort();
  }, [data]);

  // Filtrar empleados
  const empleadosFiltrados = useMemo(() => {
    if (!data?.empleados) return [];
    let filtered = data.empleados;
    if (unidadFiltro) {
      filtered = filtered.filter(e => e.unidad === unidadFiltro);
    }
    if (situacionFiltro) {
      filtered = filtered.filter(e => e.situacion === situacionFiltro);
    }
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      filtered = filtered.filter(e =>
        (e.apellidos || '').toLowerCase().includes(term) ||
        (e.nombres || '').toLowerCase().includes(term) ||
        (e.codigo || '').toLowerCase().includes(term) ||
        (e.dni || '').toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [data, busqueda, unidadFiltro, situacionFiltro]);

  // Totales filtrados
  const totalesFiltrados = useMemo(() => {
    return {
      empleados: empleadosFiltrados.length,
      derecho: empleadosFiltrados.reduce((s, e) => s + e.derecho_total, 0),
      gozados: empleadosFiltrados.reduce((s, e) => s + e.gozados_totales, 0),
      gozados_anio: empleadosFiltrados.reduce((s, e) => s + e.gozados_anio, 0),
      dias_vacaciones: empleadosFiltrados.reduce((s, e) => s + (e.antiguedad_anios || 0) * 30, 0),
      saldo: empleadosFiltrados.reduce((s, e) => s + e.saldo, 0),
      monto: empleadosFiltrados.reduce((s, e) => s + e.monto_saldo, 0),
    };
  }, [empleadosFiltrados]);

  // Exportar Excel – una fila por empleado, columnas: datos fijos + [año: ENE…DIC + resumen] × 5
  const exportarExcel = async () => {
    const ANIO_INICIO  = 2022;
    const ANIO_FIN     = 2026;
    const AÑOS         = Array.from({ length: ANIO_FIN - ANIO_INICIO + 1 }, (_, i) => ANIO_INICIO + i);
    const MESES_HDR    = Array.from({ length: 12 }, (_, i) => getMesNombre(i + 1).substring(0, 3).toUpperCase());
    const COL_YEAR     = 16; // 12 meses + Total Anual + Días Vac + Total Gral + Pendiente
    const TOTAL_COLS   = 7 + AÑOS.length * COL_YEAR;
    const YEAR_COLORS  = ['#1e40af', '#6d28d9', '#065f46', '#92400e', '#991b1b'];

    const toastId = toast.loading('Preparando exportación…');
    try {
      // ── Cargar datos de todos los años ───────────────────────────────────
      const dataByAnio = {};
      for (const a of AÑOS) {
        toast.update(toastId, { render: `Cargando ${a}…`, isLoading: true });
        const result = await getVacacionesResumen(a);
        dataByAnio[a] = {};
        (result.empleados || []).forEach(emp => { dataByAnio[a][emp.empleado_id] = emp; });
      }

      // ── Lista maestra de empleados (info fija del año más reciente) ───────
      const empMap = {};
      for (const a of [...AÑOS].reverse()) {
        Object.values(dataByAnio[a]).forEach(emp => {
          if (!empMap[emp.empleado_id]) empMap[emp.empleado_id] = emp;
        });
      }
      const empleados = Object.values(empMap)
        .sort((a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`));

      // ── HTML ──────────────────────────────────────────────────────────────
      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Vacaciones ${ANIO_INICIO}-${ANIO_FIN}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  td, th { text-align:center; vertical-align:middle; font-size:8pt; font-family:Calibri; border:1px solid #d1d5db; padding:2px 4px; white-space:nowrap; }
  .left { text-align:left; }
</style>
</head><body><table border="1">`;

      // Fila título principal
      html += `<tr><td colspan="${TOTAL_COLS}" style="background:#0e7490;color:#fff;font-weight:bold;font-size:13pt;text-align:center;padding:8px;">CONTROL DE VACACIONES ${ANIO_INICIO} – ${ANIO_FIN}</td></tr>`;

      // ── Fila 1 cabeceras: cols fijas (rowspan=2) + año (colspan=COL_YEAR) ──
      html += '<tr>';
      [['#', 32], ['CÓDIGO', 70], ['EMPLEADO', 220], ['CARGO', 120], ['UNIDAD', 85], ['F. INGRESO', 85], ['F. CESE', 85], ['ANTIGÜEDAD', 95]]
        .forEach(([label, w]) => {
          html += `<th rowspan="2" style="background:#334155;color:#fff;font-weight:bold;width:${w}px;">${label}</th>`;
        });
      AÑOS.forEach((a, i) => {
        html += `<th colspan="${COL_YEAR}" style="background:${YEAR_COLORS[i]};color:#fff;font-weight:bold;font-size:11pt;">${a}</th>`;
      });
      html += '</tr>';

      // ── Fila 2 cabeceras: meses + resumen por año ─────────────────────────
      html += '<tr>';
      AÑOS.forEach(() => {
        MESES_HDR.forEach(m => {
          html += `<th style="background:#6366f1;color:#fff;font-weight:bold;width:40px;">${m}</th>`;
        });
        html += `<th style="background:#ea580c;color:#fff;font-weight:bold;width:76px;">Total del Año</th>`;
        html += `<th style="background:#7c3aed;color:#fff;font-weight:bold;width:86px;">Días Acumulados</th>`;
        html += `<th style="background:#d97706;color:#fff;font-weight:bold;width:76px;">Total Cobrado</th>`;
        html += `<th style="background:#be185d;color:#fff;font-weight:bold;width:76px;">Por Cobrar</th>`;
      });
      html += '</tr>';

      // ── Filas de empleados ────────────────────────────────────────────────
      empleados.forEach((empBase, idx) => {
        const esCesado = empBase.situacion === 'CESADO';
        const bgRow    = esCesado ? '#fef2f2' : idx % 2 === 0 ? '#fff' : '#f8fafc';
        const colorEmp = esCesado ? 'color:#dc2626;' : '';

        html += '<tr>';
        html += `<td style="background:${bgRow};">${idx + 1}</td>`;
        html += `<td class="left" style="background:${bgRow};font-weight:600;${colorEmp}">${empBase.codigo || ''}</td>`;
        html += `<td class="left" style="background:${bgRow};font-weight:bold;${colorEmp}">${empBase.apellidos || ''}, ${empBase.nombres || ''}</td>`;
        html += `<td class="left" style="font-size:7.5pt;">${empBase.cargo || ''}</td>`;
        html += `<td class="left" style="font-size:7.5pt;">${empBase.unidad || ''}</td>`;
        html += `<td style="color:#0891b2;font-weight:500;">${empBase.fecha_ingreso || '-'}</td>`;
        html += `<td style="color:${empBase.fecha_cese ? '#dc2626' : '#94a3b8'};font-weight:${empBase.fecha_cese ? '600' : '400'};">${empBase.fecha_cese || '-'}</td>`;
        html += `<td style="color:#0891b2;font-weight:600;">${empBase.antiguedad_texto || ''}</td>`;

        AÑOS.forEach(a => {
          const emp = dataByAnio[a][empBase.empleado_id];
          if (!emp) {
            for (let k = 0; k < COL_YEAR; k++) html += `<td style="background:#f1f5f9;color:#94a3b8;">–</td>`;
            return;
          }
          for (let m = 1; m <= 12; m++) {
            const dias = emp.desglose_mensual?.[m] || 0;
            html += `<td style="background:${dias > 0 ? '#e0e7ff' : 'transparent'};${dias > 0 ? 'font-weight:bold;color:#4338ca;' : 'color:#cbd5e1;'}">${dias || '·'}</td>`;
          }
          const diasVac   = (emp.antiguedad_anios || 0) * 30;
          const pendiente = diasVac - (emp.gozados_totales || 0);
          const pendColor = pendiente < 0 ? '#dc2626' : pendiente > 0 ? '#059669' : '#64748b';
          html += `<td style="background:#fff7ed;font-weight:800;color:#ea580c;">${emp.gozados_anio || 0}</td>`;
          html += `<td style="background:#f5f3ff;font-weight:800;color:#7c3aed;">${diasVac}</td>`;
          html += `<td style="background:#fef3c7;font-weight:800;color:#d97706;">${emp.gozados_totales || 0}</td>`;
          html += `<td style="background:#fdf2f8;font-weight:800;color:${pendColor};">${pendiente}</td>`;
        });
        html += '</tr>';
      });

      html += '</table></body></html>';

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Vacaciones_${ANIO_INICIO}-${ANIO_FIN}.xls`;
      link.click();
      URL.revokeObjectURL(url);
      toast.update(toastId, { render: `Excel exportado (${ANIO_INICIO}–${ANIO_FIN})`, type: 'success', isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error(err);
      toast.update(toastId, { render: 'Error al exportar: ' + (err.message || 'Error desconocido'), type: 'error', isLoading: false, autoClose: 4000 });
    }
  };


  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}><FiSun size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />Vacaciones</h2>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 8, background: isDark ? 'rgba(148,163,184,.08)' : '#f1f5f9', borderRadius: 8, padding: 3 }}>
            <button onClick={() => setTab('resumen')} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: tab === 'resumen' ? (isDark ? c.tableHeaderBg : '#0e7490') : 'transparent', color: tab === 'resumen' ? '#fff' : c.textSecondary, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}>
              <FiList size={13} />Resumen
            </button>
            <button
              onClick={() => { setTab('calendario'); if (!calLoaded) cargarCalendario(); }}
              style={{ padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: tab === 'calendario' ? (isDark ? c.tableHeaderBg : '#0e7490') : 'transparent', color: tab === 'calendario' ? '#fff' : c.textSecondary, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <FiCalendar size={13} />Calendario
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {tab === 'resumen' && (<>
            <button className="btn-icon" onClick={() => setAnio(anio - 1)}><FiChevronLeft size={20} /></button>
            <span style={{ fontWeight: 700, fontSize: '1.3rem', minWidth: '60px', textAlign: 'center' }}>{anio}</span>
            <button className="btn-icon" onClick={() => setAnio(anio + 1)}><FiChevronRight size={20} /></button>
            <button className="btn-secondary" onClick={exportarExcel} title={`Exportar todos los años (2022 – ${new Date().getFullYear()}) como .xlsx`}>
              <FiDownload size={16} /> Excel (todos)
            </button>
            <button
              onClick={() => setModalQuick(prev => ({ ...prev, show: true }))}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
              title="Registro rápido de vacaciones">
              <FiPlus size={15} /> Reg. Rápido
            </button>
          </>)}
          {tab === 'calendario' && (
            <button className="btn btn-primary" onClick={cargarCalendario} disabled={loadingCal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiCalendar size={15} />{loadingCal ? 'Cargando...' : 'Actualizar'}
            </button>
          )}
        </div>
      </div>

      {/* ───────────── TAB RESUMEN ───────────── */}
      {tab === 'resumen' && (<>
      {/* Tarjetas resumen */}
      {data?.totales && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{totalesFiltrados.empleados}</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Empleados</div>
            </div>
          </div>
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid #0891b2' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0891b2', lineHeight: 1 }}>{totalesFiltrados.derecho.toFixed(0)}</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Derecho Total</div>
              <div style={{ fontSize: '0.68rem', color: c.textMuted }}>días acumulados</div>
            </div>
          </div>
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid #d97706' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{totalesFiltrados.gozados}</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gozados</div>
              <div style={{ fontSize: '0.68rem', color: c.textMuted }}>días totales</div>
            </div>
          </div>
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid #ea580c' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ea580c', lineHeight: 1 }}>{totalesFiltrados.gozados_anio}</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gozados {anio}</div>
              <div style={{ fontSize: '0.68rem', color: c.textMuted }}>este año</div>
            </div>
          </div>
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid #dc2626' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>{totalesFiltrados.saldo.toFixed(0)}</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Saldo Pendiente</div>
              <div style={{ fontSize: '0.68rem', color: c.textMuted }}>días por gozar</div>
            </div>
          </div>
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid #16a34a' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{formatMoney(totalesFiltrados.monto)}</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: c.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Provisión</div>
              <div style={{ fontSize: '0.68rem', color: c.textMuted }}>monto pendiente</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: c.textSecondary }}>Filtrar:</span>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nombre, código o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', paddingLeft: 34 }}
            />
            {busqueda && (
              <FiX style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: c.textMuted }} onClick={() => setBusqueda('')} />
            )}
          </div>
          <select className="form-select" value={unidadFiltro} onChange={(e) => setUnidadFiltro(e.target.value)} style={{ width: 180 }}>
            <option value="">Todas las unidades</option>
            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select className="form-select" value={situacionFiltro} onChange={(e) => setSituacionFiltro(e.target.value)} style={{ width: 160 }}>
            <option value="">Todas las situaciones</option>
            <option value="VIGENTE">Vigente</option>
            <option value="CESADO">Cesado</option>
          </select>
          <span style={{ color: c.textMuted, fontSize: '0.82rem' }}>
            {empleadosFiltrados.length} empleado(s)
          </span>
        </div>
      </div>

      {/* Tabla principal */}
      <div className="card" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 10, background: c.tableHeaderBg, color: isDark ? '#c4ccdb' : '#fff' }}>
              <th style={{ ...thStyle, minWidth: '35px' }}>#</th>
              <th style={{ ...thStyle, minWidth: '70px' }}>Código</th>
              <th style={{ ...thStyle, minWidth: '200px', textAlign: 'left' }}>Empleado</th>
              <th style={{ ...thStyle, minWidth: '90px' }}>Cargo</th>
              <th style={{ ...thStyle, minWidth: '80px' }}>Unidad</th>
              <th style={{ ...thStyle, background: isDark ? 'rgba(8,145,178,.15)' : '#0e6e87', minWidth: '90px' }}>F. Ingreso</th>
              <th style={{ ...thStyle, background: isDark ? 'rgba(220,38,38,.15)' : '#b91c1c', minWidth: '90px' }}>F. Cese</th>
              <th style={{ ...thStyle, background: isDark ? 'rgba(8,145,178,.15)' : '#0e6e87', minWidth: '100px' }}>Antigüedad</th>
              {Array.from({ length: 12 }, (_, i) => (
                <th key={i} style={{ ...thStyle, background: isDark ? 'rgba(99,102,241,.2)' : '#4f46e5', minWidth: '38px', fontSize: '0.65rem', padding: '4px 2px' }}>
                  {getMesNombre(i + 1).substring(0, 3).toUpperCase()}
                </th>
              ))}
              <th style={{ ...thStyle, background: isDark ? 'rgba(234,88,12,.2)' : '#c2410c', minWidth: '80px' }}>Vac. Gozadas en el Año</th>
              <th style={{ ...thStyle, background: isDark ? 'rgba(124,58,237,.2)' : '#6d28d9', minWidth: '90px' }}>Días Acumulados 30 x Año</th>
              <th style={{ ...thStyle, background: isDark ? 'rgba(217,119,6,.2)' : '#b45309', minWidth: '80px' }}>Total Gozados</th>
              <th style={{ ...thStyle, background: isDark ? 'rgba(190,24,93,.2)' : '#9d174d', minWidth: '80px' }}>Por Cobrar</th>
              <th style={{ ...thStyle, minWidth: '60px' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {empleadosFiltrados.length > 0 ? empleadosFiltrados.map((emp, idx) => {
              const esCesado = emp.situacion === 'CESADO';
              return (
                <tr key={emp.empleado_id} style={{ background: esCesado ? (isDark ? 'rgba(248,113,113,.06)' : '#fef2f2') : idx % 2 === 0 ? c.tableRowEven : c.tableRowOdd }}>
                  <td style={tdStyle}>{idx + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: esCesado ? '#dc2626' : c.textSecondary }}>{emp.codigo}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: esCesado ? '#dc2626' : c.textPrimary }}>
                    {emp.apellidos}, {emp.nombres}
                    {esCesado && <span style={{ fontSize: '0.6rem', marginLeft: '4px', background: '#dc2626', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>CESADO</span>}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '0.7rem', color: c.textSecondary }}>{emp.cargo}</td>
                  <td style={{ ...tdStyle, fontSize: '0.7rem', color: c.textSecondary }}>{emp.unidad}</td>
                  <td style={{ ...tdStyle, color: isDark ? '#38bdf8' : '#0891b2', fontWeight: 500 }}>{emp.fecha_ingreso || '-'}</td>
                  <td style={{ ...tdStyle, color: emp.fecha_cese ? '#f87171' : c.textMuted, fontWeight: emp.fecha_cese ? 600 : 400 }}>{emp.fecha_cese || '-'}</td>
                  <td style={{ ...tdStyle, color: isDark ? '#38bdf8' : '#0891b2', fontWeight: 600 }}>{emp.antiguedad_texto}</td>
                  {Array.from({ length: 12 }, (_, i) => {
                    const dias = emp.desglose_mensual?.[i + 1] || 0;
                    const mes = i + 1;
                    return (
                      <td key={i}
                        onClick={() => handleClickCelda(emp, anio, mes)}
                        title={`Registrar vacaciones en ${getMesNombre(mes).substring(0, 3).toUpperCase()} ${anio}`}
                        style={{ ...tdStyle, background: dias > 0 ? '#e0e7ff' : 'transparent', color: dias > 0 ? '#4338ca' : '#cbd5e1', fontWeight: dias > 0 ? 700 : 400, fontSize: '0.72rem', cursor: 'pointer' }}>
                        {dias || '·'}
                      </td>
                    );
                  })}
                  <td style={{ ...tdStyle, background: isDark ? 'rgba(234,88,12,.08)' : '#fff7ed', fontWeight: 800, color: isDark ? '#fb923c' : '#ea580c', fontSize: '0.85rem', borderLeft: `2px solid ${c.borderSubtle}` }}>
                    {emp.gozados_anio || '-'}
                  </td>
                  <td style={{ ...tdStyle, background: isDark ? 'rgba(124,58,237,.08)' : '#f5f3ff', fontWeight: 800, color: isDark ? '#a78bfa' : '#7c3aed', fontSize: '0.85rem' }}>
                    {(emp.antiguedad_anios || 0) * 30}
                  </td>
                  <td style={{ ...tdStyle, background: isDark ? 'rgba(217,119,6,.08)' : '#fef3c7', fontWeight: 800, color: isDark ? '#fbbf24' : '#d97706', fontSize: '0.85rem' }}>
                    {emp.gozados_totales || '-'}
                  </td>
                  {(() => {
                    const diasVac = (emp.antiguedad_anios || 0) * 30;
                    const pendiente = diasVac - emp.gozados_totales;
                    const pendColor = pendiente < 0 ? '#dc2626' : pendiente > 0 ? '#059669' : '#64748b';
                    return (
                      <td style={{ ...tdStyle, background: isDark ? 'rgba(190,24,93,.08)' : '#fdf2f8', fontWeight: 800, color: pendColor, fontSize: '0.85rem' }}>
                        {pendiente}
                      </td>
                    );
                  })()}
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleVerDetalle(emp.empleado_id)}
                      style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
                      title="Ver historial detallado"
                    >
                      <FiUser size={12} />
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={24} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  No hay datos de vacaciones para mostrar
                </td>
              </tr>
            )}
          </tbody>
          {empleadosFiltrados.length > 0 && (
            <tfoot>
              <tr style={{ background: isDark ? 'rgba(6,10,20,.95)' : '#0f172a' }}>
                <td colSpan={7} style={{ ...tdStyle, color: '#fff', fontWeight: 700, textAlign: 'right', fontSize: '0.85rem' }}>TOTALES:</td>
                <td colSpan={12} style={{ ...tdStyle, background: '#0f172a' }}></td>
                <td style={{ ...tdStyle, background: '#ea580c', color: '#fff', fontWeight: 800 }}>{totalesFiltrados.gozados_anio}</td>
                <td style={{ ...tdStyle, background: '#7c3aed', color: '#fff', fontWeight: 800 }}>{totalesFiltrados.dias_vacaciones}</td>
                <td style={{ ...tdStyle, background: '#d97706', color: '#fff', fontWeight: 800 }}>{totalesFiltrados.gozados}</td>
                <td style={{ ...tdStyle, background: '#be185d', color: '#fff', fontWeight: 800 }}>{totalesFiltrados.dias_vacaciones - totalesFiltrados.gozados}</td>
                <td style={{ ...tdStyle, background: '#0f172a' }}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      </>)}

      {/* ───────────── TAB CALENDARIO ───────────── */}
      {tab === 'calendario' && (() => {
        const aniosRange = [];
        for (let a = anioInicioCal; a <= anioFinCal; a++) aniosRange.push(a);
        const MSHORT = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
        const grid = buildGrid(calData.registros);
        const empsCal = (calData.empleados || []).filter(e => {
          if (!busqueda.trim()) return true;
          const t = busqueda.toLowerCase();
          return e.apellidos?.toLowerCase().includes(t) || e.nombres?.toLowerCase().includes(t) || e.codigo?.toLowerCase().includes(t);
        });
        return (
          <>
            {/* Controles año inicio/fin */}
            <div className="card" style={{ padding: '12px 16px', marginBottom: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Desde:</label>
                <select value={anioInicioCal} onChange={e => setAnioInicioCal(+e.target.value)} className="form-select" style={{ width: 90 }}>
                  {Array.from({ length: 10 }, (_, i) => hoy.getFullYear() - 9 + i).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Hasta:</label>
                <select value={anioFinCal} onChange={e => setAnioFinCal(+e.target.value)} className="form-select" style={{ width: 90 }}>
                  {Array.from({ length: 10 }, (_, i) => hoy.getFullYear() - 9 + i).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={cargarCalendario} disabled={loadingCal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCalendar size={14} />{loadingCal ? 'Cargando...' : 'Cargar'}
              </button>
              {calLoaded && (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {calData.registros?.length || 0} registros — {calData.empleados?.length} empleados
                </span>
              )}
              {/* Buscador */}
              <div style={{ position: 'relative', flex: '1 1 220px', marginLeft: 'auto' }}>
                <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Buscar empleado..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px 7px 34px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }} />
                {busqueda && <FiX style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }} onClick={() => setBusqueda('')} />}
              </div>
            </div>

            {/* Grid año×mes */}
            <div className="card" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 230px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.71rem' }}>
                <thead>
                  {/* Fila 1: headers de año */}
                  <tr style={{ position: 'sticky', top: 0, zIndex: 12 }}>
                    <th colSpan={5} style={{ ...thCalHd, background: c.tableHeaderBg, minWidth: 380, textAlign: 'center' }}>Datos del Trabajador</th>
                    {aniosRange.map((a, ai) => (
                      <th key={a} colSpan={12} style={{ ...thCalHd, background: ANIO_COLORS[ai % ANIO_COLORS.length].bg, color: ANIO_COLORS[ai % ANIO_COLORS.length].fg, borderLeft: '3px solid #94a3b8', fontSize: '0.8rem', fontWeight: 800 }}>
                        {a}
                      </th>
                    ))}
                    <th style={{ ...thCalHd, background: isDark ? 'rgba(245,158,11,.2)' : '#b45309', borderLeft: `3px solid ${c.tableBorder}`, minWidth: 64, whiteSpace: 'nowrap' }}>TOTAL VAC.</th>
                    <th style={{ ...thCalHd, background: isDark ? 'rgba(99,102,241,.2)' : '#4f46e5', minWidth: 42 }}></th>
                  </tr>
                  {/* Fila 2: headers de mes */}
                  <tr style={{ position: 'sticky', top: 28, zIndex: 11 }}>
                    <th style={{ ...thCalSub, background: c.tableHeaderBg, minWidth: 34 }}>#</th>
                    <th style={{ ...thCalSub, background: c.tableHeaderBg, minWidth: 70 }}>Código</th>
                    <th style={{ ...thCalSub, background: c.tableHeaderBg, minWidth: 200, textAlign: 'left' }}>Empleado</th>
                    <th style={{ ...thCalSub, background: isDark ? 'rgba(8,145,178,.15)' : '#0e6e87', minWidth: 92 }}>F.Ingreso</th>
                    <th style={{ ...thCalSub, background: isDark ? 'rgba(220,38,38,.15)' : '#b91c1c', minWidth: 92 }}>F.Cese</th>
                    {aniosRange.map((a, ai) => (
                      MSHORT.map((ms, mi) => (
                        <th key={`${a}-${mi}`} style={{ ...thCalSub, background: ANIO_COLORS[ai % ANIO_COLORS.length].sub, color: '#1e293b', fontSize: '0.63rem', minWidth: 38, borderLeft: mi === 0 ? '3px solid #94a3b8' : undefined }}>
                          {ms}
                        </th>
                      ))
                    ))}
                    <th style={{ ...thCalSub, background: isDark ? 'rgba(217,119,6,.2)' : '#b45309', borderLeft: `3px solid ${c.tableBorder}`, minWidth: 64 }}>Total</th>
                    <th style={{ ...thCalSub, background: isDark ? 'rgba(99,102,241,.2)' : '#4f46e5', minWidth: 42 }}>+</th>
                  </tr>
                </thead>
                <tbody>
                  {!calLoaded ? (
                    <tr><td colSpan={5 + aniosRange.length * 12 + 2} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Selecciona el rango y presiona “Cargar”
                    </td></tr>
                  ) : empsCal.length === 0 ? (
                    <tr><td colSpan={5 + aniosRange.length * 12 + 2} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Sin resultados
                    </td></tr>
                  ) : empsCal.map((emp, idx) => {
                    const empGrid = grid[emp.empleado_id] || {};
                    const totalEmp = (calData.registros || []).filter(r => r.empleado_id === emp.empleado_id).reduce((s, r) => s + (parseInt(r.dias) || 0), 0);
                    return (
                      <tr key={emp.empleado_id} style={{ background: idx % 2 === 0 ? c.tableRowEven : c.tableRowOdd }}>
                        <td style={tdCalStyle}>{idx + 1}</td>
                        <td style={{ ...tdCalStyle, fontFamily: 'monospace', fontWeight: 600, color: c.textSecondary }}>{emp.codigo}</td>
                        <td style={{ ...tdCalStyle, textAlign: 'left', fontWeight: 600, color: c.textPrimary, whiteSpace: 'nowrap' }}>
                          {emp.apellidos}, {emp.nombres}
                          {emp.situacion === 'CESADO' && <span style={{ fontSize: '0.6rem', marginLeft: 4, background: '#dc2626', color: '#fff', padding: '1px 4px', borderRadius: 3 }}>CESADO</span>}
                        </td>
                        <td style={{ ...tdCalStyle, color: isDark ? '#38bdf8' : '#0891b2', fontWeight: 500 }}>{emp.fecha_ingreso || '-'}</td>
                        <td style={{ ...tdCalStyle, color: emp.fecha_cese ? '#f87171' : c.textMuted, fontWeight: emp.fecha_cese ? 600 : 400 }}>{emp.fecha_cese || '-'}</td>
                        {aniosRange.map((a, ai) => (
                          [1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                            const d = empGrid[a]?.[m] || 0;
                            const colorPal = ANIO_COLORS[ai % ANIO_COLORS.length];
                            return (
                              <td
                                key={`${a}-${m}`}
                                onClick={() => handleClickCelda(emp, a, m)}
                                title={d > 0
                                  ? `${MSHORT[m-1]} ${a}: ${d} días — clic para agregar más`
                                  : `Agregar vacaciones en ${MSHORT[m-1]} ${a}`}
                                style={{
                                  ...tdCalStyle,
                                  background: d > 0 ? colorPal.cell : 'transparent',
                                  color: d > 0 ? colorPal.cellFg : '#e2e8f0',
                                  fontWeight: d > 0 ? 800 : 400,
                                  borderLeft: m === 1 ? '3px solid #e2e8f0' : undefined,
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = d > 0 ? colorPal.bg : '#f1f5f9';
                                  e.currentTarget.style.color = d > 0 ? '#fff' : '#334155';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = d > 0 ? colorPal.cell : 'transparent';
                                  e.currentTarget.style.color = d > 0 ? colorPal.cellFg : '#e2e8f0';
                                }}
                              >
                                {d > 0 ? d : '·'}
                              </td>
                            );
                          })
                        ))}
                        <td style={{ ...tdCalStyle, background: totalEmp > 0 ? '#fef3c7' : 'transparent', fontWeight: 800, color: '#d97706', borderLeft: '3px solid #e2e8f0' }}>
                          {totalEmp > 0 ? totalEmp : '-'}
                        </td>
                        <td style={tdCalStyle}>
                          <button onClick={() => handleOpenModalRegistro(emp)}
                            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}
                            title="Agregar/ver vacaciones">
                            <FiPlus size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      {/* Modal Detalle Empleado */}
      {modalDetalle.show && (
        <div className="modal-overlay" onClick={() => setModalDetalle({ show: false, empleado: null, historial: [], loading: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '85vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCalendar />
                Historial de Vacaciones
              </h3>
              <button className="btn-close" onClick={() => setModalDetalle({ show: false, empleado: null, historial: [], loading: false })}>×</button>
            </div>
            {modalDetalle.loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}><Loading /></div>
            ) : (
              <>
                {/* Info empleado */}
                {modalDetalle.empleado && (
                  <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><strong>Nombre:</strong> {modalDetalle.empleado.nombre_completo}</div>
                    <div><strong>Cargo:</strong> {modalDetalle.empleado.cargo}</div>
                    <div><strong>F. Ingreso:</strong> {modalDetalle.empleado.fecha_ingreso || '-'}</div>
                    <div><strong>Sueldo:</strong> {formatMoney(modalDetalle.empleado.sueldo_base)}</div>
                    <div><strong>Situación:</strong> <span style={{ color: modalDetalle.empleado.situacion === 'CESADO' ? '#dc2626' : '#059669', fontWeight: 700 }}>{modalDetalle.empleado.situacion}</span></div>
                    {modalDetalle.empleado.fecha_cese && <div><strong>F. Cese:</strong> <span style={{ color: '#dc2626' }}>{modalDetalle.empleado.fecha_cese}</span></div>}
                  </div>
                )}
                {/* Tabla historial */}
                <div style={{ padding: '16px 20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: c.tableHeaderBg, color: isDark ? '#c4ccdb' : '#fff' }}>
                        <th style={{ ...thStyle, width: '32px' }}></th>
                        <th style={{ ...thStyle }}>Año</th>
                        <th style={{ ...thStyle, background: isDark ? 'rgba(217,119,6,.2)' : '#b45309' }}>Gozados Año</th>
                        <th style={{ ...thStyle, background: isDark ? 'rgba(234,88,12,.2)' : '#c2410c' }}>Goz. Acum.</th>
                        <th style={{ ...thStyle, background: isDark ? 'rgba(99,102,241,.2)' : '#4f46e5' }}>Meses con Vacaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalDetalle.historial.map((h, i) => {
                        const saldoColor = h.saldo < 0 ? '#dc2626' : h.saldo > 30 ? '#ea580c' : '#059669';
                        const isExpanded = expandedAnios[h.anio];
                        const tieneDetalle = h.desglose_mensual.length > 0;
                        return (
                          <Fragment key={h.anio}>
                            <tr style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', cursor: tieneDetalle ? 'pointer' : 'default' }}
                              onClick={() => tieneDetalle && toggleAnio(h.anio)}>
                              <td style={{ ...tdStyle, color: '#6366f1' }}>
                                {tieneDetalle && (isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}
                              </td>
                              <td style={{ ...tdStyle, fontWeight: 700 }}>{h.anio}</td>
                              <td style={{ ...tdStyle, color: '#d97706', fontWeight: 600 }}>{h.gozados_anio}</td>
                              <td style={{ ...tdStyle, color: '#ea580c', fontWeight: 600 }}>{h.gozados_acumulado}</td>
                              <td style={{ ...tdStyle, textAlign: 'left', fontSize: '0.75rem' }}>
                                {h.desglose_mensual.length > 0
                                  ? h.desglose_mensual.map(m => (
                                      <span key={m.mes} style={{ display: 'inline-block', background: '#e0e7ff', color: '#4338ca', borderRadius: '4px', padding: '1px 6px', margin: '1px 3px 1px 0', fontWeight: 700, fontSize: '0.72rem' }}>
                                        {getMesNombre(m.mes).substring(0, 3)} ({m.dias}d)
                                      </span>
                                    ))
                                  : <span style={{ color: '#cbd5e1' }}>Sin vacaciones</span>
                                }
                              </td>
                            </tr>
                            {/* Fila expandida: detalle de fechas por mes */}
                            {isExpanded && tieneDetalle && (
                              <tr key={`${h.anio}-detail`}>
                                <td colSpan={5} style={{ padding: '0 0 0 40px', background: '#f0f4ff', borderBottom: '2px solid #c7d2fe' }}>
                                  <div style={{ padding: '10px 12px' }}>
                                    <div style={{ fontWeight: 700, color: '#4338ca', marginBottom: '8px', fontSize: '0.78rem' }}>
                                      📅 Fechas de vacaciones en {h.anio} — {h.gozados_anio} días en total
                                    </div>
                                    {h.desglose_mensual.map(m => (
                                      <div key={m.mes} style={{ marginBottom: '8px' }}>
                                        <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.75rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                                          {getMesNombre(m.mes)} — {m.dias} día{m.dias !== 1 ? 's' : ''}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                          {m.fechas && m.fechas.length > 0
                                            ? m.fechas.map(f => {
                                                const d = new Date(f + 'T00:00:00');
                                                const diaSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()];
                                                const dia = String(d.getDate()).padStart(2, '0');
                                                return (
                                                  <span key={f} style={{
                                                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                                                    background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '6px',
                                                    padding: '3px 8px', minWidth: '44px',
                                                  }}>
                                                    <span style={{ fontSize: '0.6rem', color: '#1e40af', fontWeight: 600 }}>{diaSemana}</span>
                                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1 }}>{dia}</span>
                                                  </span>
                                                );
                                              })
                                            : m.manual
                                            ? (
                                              <span style={{ fontSize: '0.72rem', color: '#7c3aed', fontStyle: 'italic', background: '#f5f3ff', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                                                📋 {m.dias} días — registrado manualmente
                                              </span>
                                            )
                                            : (
                                              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                {m.dias} días registrados (fechas exactas no disponibles en histórico)
                                              </span>
                                            )
                                          }
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal Registro Vacaciones Goce */}
      {modalReg.show && (
        <div className="modal-overlay" onClick={() => setModalReg(prev => ({ ...prev, show: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '88vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
                <FiCalendar size={17} />
                Vacaciones — {modalReg.empleado?.apellidos}, {modalReg.empleado?.nombres}
                {modalReg.celdaLabel && (
                  <span style={{ background: '#6366f1', color: '#fff', borderRadius: 5, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700, marginLeft: 6 }}>
                    {modalReg.celdaLabel}
                  </span>
                )}
              </h3>
              <button className="btn-close" onClick={() => setModalReg(prev => ({ ...prev, show: false }))}>×</button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {/* Formulario nuevo / editar */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 12 }}>
                  {modalReg.editId ? '✏️ Editar registro' : '➕ Nuevo registro de vacaciones'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Fecha Inicio *</label>
                    <input type="date" value={modalReg.fecha_inicio}
                      onChange={e => {
                        const fi = e.target.value;
                        const d = calcDiasAuto(fi, modalReg.fecha_fin);
                        setModalReg(prev => ({ ...prev, fecha_inicio: fi, dias: d !== '' ? d : prev.dias }));
                      }}
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Fecha Fin *</label>
                    <input type="date" value={modalReg.fecha_fin}
                      onChange={e => {
                        const ff = e.target.value;
                        const d = calcDiasAuto(modalReg.fecha_inicio, ff);
                        setModalReg(prev => ({ ...prev, fecha_fin: ff, dias: d !== '' ? d : prev.dias }));
                      }}
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Días *</label>
                    <input type="number" min="1" max="365" value={modalReg.dias}
                      onChange={e => setModalReg(prev => ({ ...prev, dias: e.target.value }))}
                      placeholder="Auto-calculado desde fechas"
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>Se calcula automáticamente pero puedes editarlo</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Descripción</label>
                    <input type="text" value={modalReg.descripcion}
                      onChange={e => setModalReg(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Ej: Vacaciones 2023 primer tramo"
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button onClick={handleGuardarRegistro} disabled={modalReg.saving}
                    style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiSave size={14} />{modalReg.saving ? 'Guardando...' : modalReg.editId ? 'Actualizar' : 'Guardar'}
                  </button>
                  {modalReg.editId && (
                    <button onClick={() => setModalReg(prev => ({ ...prev, editId: null, fecha_inicio: '', fecha_fin: '', dias: '', descripcion: '', celdaLabel: '' }))}
                      style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>
                      Cancelar edición
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de registros existentes */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiCalendar size={14} /> Registros guardados
                </div>
                {(() => {
                  if (modalRegRowsLoading) return (
                    <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '24px' }}>Cargando registros...</div>
                  );
                  const regs = [...modalRegRows].sort((a, b) => a.fecha_inicio < b.fecha_inicio ? 1 : -1);
                  if (regs.length === 0) return (
                    <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #e2e8f0' }}>
                      Sin registros aún. Agrega el primer período arriba.
                    </div>
                  );
                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, background: '#334155', color: '#fff' }}>F. Inicio</th>
                          <th style={{ ...thStyle, background: '#334155', color: '#fff' }}>F. Fin</th>
                          <th style={{ ...thStyle, background: '#059669', color: '#fff', minWidth: 52 }}>Días</th>
                          <th style={{ ...thStyle, background: '#475569', color: '#fff', textAlign: 'left' }}>Descripción</th>
                          <th style={{ ...thStyle, background: '#475569', color: '#fff', minWidth: 80 }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regs.map((r, i) => (
                          <tr key={r.id} style={{ background: modalReg.editId === r.id ? '#fef9c3' : i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                            <td style={{ ...tdStyle, color: '#0891b2', fontWeight: 600 }}>{r.fecha_inicio}</td>
                            <td style={{ ...tdStyle, color: '#0891b2', fontWeight: 600 }}>{r.fecha_fin}</td>
                            <td style={{ ...tdStyle, background: '#ecfdf5', fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>{r.dias}</td>
                            <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', maxWidth: 180 }}>{r.descripcion || <span style={{ color: '#cbd5e1' }}>-</span>}</td>
                            <td style={{ ...tdStyle }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <button onClick={() => setModalReg(prev => ({ ...prev, editId: r.id, fecha_inicio: r.fecha_inicio, fecha_fin: r.fecha_fin, dias: String(r.dias), descripcion: r.descripcion || '' }))}
                                  style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }} title="Editar">
                                  <FiEdit2 size={11} />
                                </button>
                                <button onClick={() => handleEliminarRegistro(r.id)}
                                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }} title="Eliminar">
                                  <FiTrash2 size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc' }}>
                          <td colSpan={2} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#334155', paddingRight: 12 }}>TOTAL:</td>
                          <td style={{ ...tdStyle, background: '#dcfce7', fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>
                            {regs.reduce((s, r) => s + (parseInt(r.dias) || 0), 0)} días
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Registro Rápido */}
      {modalQuick.show && (() => {
        const MSHORT = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
        const anioActual = new Date().getFullYear();
        const empsFiltrados = (data?.empleados || []).filter(e => {
          if (!modalQuick.busqueda.trim()) return true;
          const t = modalQuick.busqueda.toLowerCase();
          return (e.apellidos + ' ' + e.nombres).toLowerCase().includes(t) ||
                 (e.codigo || '').toLowerCase().includes(t);
        });
        const empSel = (data?.empleados || []).find(e => e.empleado_id === parseInt(modalQuick.empleado_id));
        return (
          <div className="modal-overlay" onClick={() => setModalQuick(prev => ({ ...prev, show: false }))}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
                  <FiCalendar size={17} />
                  Registro Rápido de Vacaciones
                </h3>
                <button className="btn-close" onClick={() => setModalQuick(prev => ({ ...prev, show: false }))}>×</button>
              </div>
              <div style={{ padding: '20px' }}>
                {/* Buscador empleado */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Buscar empleado</label>
                  <input
                    type="text"
                    placeholder="Nombre o código..."
                    value={modalQuick.busqueda}
                    onChange={e => setModalQuick(prev => ({ ...prev, busqueda: e.target.value, empleado_id: '' }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                  {modalQuick.busqueda && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, maxHeight: 160, overflowY: 'auto', marginTop: 4, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                      {empsFiltrados.slice(0, 8).map(e => (
                        <div key={e.empleado_id}
                          onClick={() => setModalQuick(prev => ({ ...prev, empleado_id: e.empleado_id, busqueda: `${e.apellidos}, ${e.nombres}` }))}
                          style={{ padding: '7px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem', display: 'flex', gap: 8, alignItems: 'center' }}
                          onMouseEnter={ev => ev.currentTarget.style.background = '#f0f4ff'}
                          onMouseLeave={ev => ev.currentTarget.style.background = '#fff'}
                        >
                          <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem', minWidth: 60 }}>{e.codigo}</span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{e.apellidos}, {e.nombres}</span>
                          {e.situacion === 'CESADO' && <span style={{ fontSize: '0.6rem', background: '#dc2626', color: '#fff', padding: '1px 4px', borderRadius: 3 }}>CESADO</span>}
                        </div>
                      ))}
                      {empsFiltrados.length === 0 && <div style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.82rem' }}>Sin resultados</div>}
                    </div>
                  )}
                  {empSel && (
                    <div style={{ marginTop: 6, padding: '6px 10px', background: '#f0f4ff', borderRadius: 6, fontSize: '0.78rem', color: '#4338ca', fontWeight: 600 }}>
                      ✓ {empSel.apellidos}, {empSel.nombres} — Ingreso: {empSel.fecha_ingreso || '-'}
                    </div>
                  )}
                </div>
                {/* Año, Mes, Días */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Año *</label>
                    <select value={modalQuick.anio} onChange={e => setModalQuick(prev => ({ ...prev, anio: +e.target.value }))}
                      style={{ width: '100%', padding: '7px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem' }}>
                      {Array.from({ length: 15 }, (_, i) => anioActual - 12 + i).map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Mes *</label>
                    <select value={modalQuick.mes} onChange={e => setModalQuick(prev => ({ ...prev, mes: +e.target.value }))}
                      style={{ width: '100%', padding: '7px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem' }}>
                      {MSHORT.map((ms, i) => <option key={i+1} value={i+1}>{ms}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Días *</label>
                    <input type="number" min="1" max="365" value={modalQuick.dias}
                      onChange={e => setModalQuick(prev => ({ ...prev, dias: e.target.value }))}
                      placeholder="Ej: 15"
                      style={{ width: '100%', padding: '7px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                {/* Descripción */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Descripción</label>
                  <input type="text" value={modalQuick.descripcion}
                    onChange={e => setModalQuick(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Ej: Vacaciones periodo 2023"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                {/* Info del periodo seleccionado */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontSize: '0.78rem', color: '#64748b' }}>
                  📅 Periodo: <strong style={{ color: '#334155' }}>{MSHORT[modalQuick.mes - 1]} {modalQuick.anio}</strong>
                  {' '}(1/{String(modalQuick.mes).padStart(2,'0')}/{modalQuick.anio} — {new Date(modalQuick.anio, modalQuick.mes, 0).getDate()}/{String(modalQuick.mes).padStart(2,'0')}/{modalQuick.anio})
                </div>
                <button onClick={handleGuardarQuick} disabled={modalQuick.saving || !modalQuick.empleado_id || !modalQuick.dias}
                  style={{ width: '100%', background: modalQuick.saving || !modalQuick.empleado_id || !modalQuick.dias ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: modalQuick.saving || !modalQuick.empleado_id || !modalQuick.dias ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FiSave size={15} />{modalQuick.saving ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─ Estilos de tabla se generan dentro del componente (ver Vacaciones component) ─

// Colores por año (alterna entre paletas)
const ANIO_COLORS = [
  { bg: '#1e40af', fg: '#fff', sub: '#bfdbfe', cell: '#dbeafe', cellFg: '#1e3a8a' }, // azul
  { bg: '#7e22ce', fg: '#fff', sub: '#e9d5ff', cell: '#ede9fe', cellFg: '#6b21a8' }, // violeta
  { bg: '#065f46', fg: '#fff', sub: '#a7f3d0', cell: '#d1fae5', cellFg: '#064e3b' }, // verde
  { bg: '#9a3412', fg: '#fff', sub: '#fed7aa', cell: '#ffedd5', cellFg: '#7c2d12' }, // naranja
  { bg: '#0e7490', fg: '#fff', sub: '#a5f3fc', cell: '#cffafe', cellFg: '#155e75' }, // cyan
  { bg: '#be123c', fg: '#fff', sub: '#fecdd3', cell: '#ffe4e6', cellFg: '#9f1239' }, // rojo
];

export default Vacaciones;
