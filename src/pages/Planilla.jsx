import { useState, useEffect, useMemo } from 'react';
import { FiDollarSign, FiCheck, FiFileText, FiRefreshCw, FiSearch, FiX, FiDownload } from 'react-icons/fi';
import { getPlanillas, calcularPlanilla, getPlanillaDetalle, aprobarPlanilla, generarBoleta } from '../services/catalogoService';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';
import DataTable from '../components/common/DataTable';
import BoletaPago from '../components/BoletaPago';
import { formatMoney, getMesNombre } from '../utils/helpers';
import { UNIDADES } from '../utils/constants';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useThemeColors } from '../utils/darkColors';

function Planilla() {
  const { hasPermission } = useAuth();
  const { isDark, c } = useThemeColors();
  const canEdit = hasPermission('planilla.editar');
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [planillas, setPlanillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [planillaActual, setPlanillaActual] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalBoleta, setModalBoleta] = useState(false);
  const [boletaData, setBoletaData] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [busquedaApellido, setBusquedaApellido] = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState('');

  useEffect(() => {
    cargarPlanillas();
  }, []);

  const cargarPlanillas = async () => {
    setLoading(true);
    try {
      const data = await getPlanillas();
      setPlanillas(data || []);
    } catch (error) {
      toast.error('Error al cargar planillas');
    } finally {
      setLoading(false);
    }
  };

  const handleCalcular = async () => {
    const planillaAprobada = planillas.find(p => p.mes === mes && p.anio === anio && p.estado === 'APROBADO');
    if (planillaAprobada) {
      toast.error(`La planilla de ${getMesNombre(mes)} ${anio} ya fue APROBADA y no puede recalcularse. Comuníquese con soporte para realizar cambios.`);
      return;
    }
    if (!confirm(`¿Calcular planilla de ${getMesNombre(mes)} ${anio}?`)) return;
    setCalculating(true);
    try {
      const result = await calcularPlanilla(mes, anio);
      toast.success(`Planilla calculada: ${result.total_trabajadores || 0} empleados procesados`);
      cargarPlanillas();
      // Cargar automáticamente el detalle de la planilla recién calculada
      if (result.id) {
        handleVerDetalle(result);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al calcular planilla');
    } finally {
      setCalculating(false);
    }
  };

  const handleVerDetalle = async (planilla) => {
    setPlanillaActual(planilla);
    setBusquedaApellido('');
    setLoadingDetalle(true);
    try {
      const data = await getPlanillaDetalle(planilla.id);
      const detallesOrdenados = (data.detalles || data || []).sort((a, b) => {
        const nombreA = `${a.empleado?.apellidos || ''}, ${a.empleado?.nombres || ''}`;
        const nombreB = `${b.empleado?.apellidos || ''}, ${b.empleado?.nombres || ''}`;
        return nombreA.localeCompare(nombreB);
      });
      setDetalles(detallesOrdenados);
    } catch (error) {
      toast.error('Error al cargar detalles');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleBoleta = async (detalleId) => {
    try {
      const data = await generarBoleta(detalleId);
      setBoletaData(data);
      setModalBoleta(true);
    } catch (error) {
      toast.error('Error al generar boleta');
    }
  };

  const handleAprobar = async (planillaId) => {
    if (!confirm('¿Aprobar esta planilla? Esta acción no se puede deshacer.')) return;
    try {
      await aprobarPlanilla(planillaId);
      toast.success('Planilla aprobada');
      cargarPlanillas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al aprobar');
    }
  };

  const columnsPlanillas = [
    {
      header: 'Período',
      render: (row) => `${getMesNombre(row.mes)} ${row.anio}`
    },
    { header: 'Empleados', accessor: 'total_trabajadores', width: '100px' },
    { header: 'Total Ingresos', render: (row) => formatMoney(row.total_ingresos), width: '130px' },
    { header: 'Total Descuentos', render: (row) => formatMoney(row.total_descuentos), width: '130px' },
    { header: 'Total Neto', render: (row) => formatMoney(row.total_neto), width: '130px' },
    {
      header: 'Estado',
      render: (row) => (
        <span className={`badge ${row.estado === 'APROBADO' ? 'badge-success' : row.estado === 'PROCESADO' ? 'badge-info' : 'badge-warning'}`}>
          {row.estado}
        </span>
      ),
      width: '100px'
    },
    {
      header: 'Acciones',
      width: '180px',
      render: (row) => (
        <div className="table-actions">
          <button className="btn-sm btn-info" onClick={() => handleVerDetalle(row)}>
            <FiFileText size={14} /> Ver Detalle
          </button>
          {canEdit && row.estado === 'CALCULADO' && (
            <button className="btn-sm btn-success" onClick={() => handleAprobar(row.id)}>
              <FiCheck size={14} /> Aprobar
            </button>
          )}
        </div>
      )
    },
  ];

  const diasDelMes = planillaActual ? new Date(planillaActual.anio, planillaActual.mes, 0).getDate() : 30;

  const detallesFiltrados = useMemo(() => {
    let filtrados = detalles;
    if (unidadFiltro) {
      filtrados = filtrados.filter(d => (d.empleado?.unidad || '') === unidadFiltro);
    }
    if (busquedaApellido.trim()) {
      const term = busquedaApellido.toLowerCase().trim();
      filtrados = filtrados.filter(d => {
        const apellidos = (d.empleado?.apellidos || '').toLowerCase();
        const nombres = (d.empleado?.nombres || '').toLowerCase();
        const codigo = (d.empleado?.codigo_trabajador || '').toLowerCase();
        return apellidos.includes(term) || nombres.includes(term) || codigo.includes(term);
      });
    }
    return filtrados;
  }, [detalles, busquedaApellido, unidadFiltro]);

  const exportarExcelPlanilla = () => {
    const datos = detallesFiltrados;
    if (!datos.length) { toast.warning('No hay datos para exportar'); return; }

    const fmt = (v) => { const _v = parseFloat(v || 0); return _v === 0 ? '-' : _v.toFixed(2); };
    const fmtD = (v) => { const _v = parseFloat(v || 0); return _v === 0 ? '-' : _v.toFixed(1); };
    const mesNombre = getMesNombre(planillaActual.mes);
    const tituloUnidad = unidadFiltro ? ` - ${unidadFiltro}` : '';

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Planilla ${mesNombre} ${planillaActual.anio}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  td, th { text-align: center; vertical-align: middle; font-size: 9pt; font-family: Calibri; border: 1px solid #d1d5db; padding: 3px 5px; }
  .left { text-align: left; }
  .money { mso-number-format:"\\#\\,\\#\\#0\\.00"; }
  .num { mso-number-format:"0\\.0"; }
  .pct { mso-number-format:"0\\.00\\%"; }
</style>
</head><body><table border="1">`;

    // Título
    html += `<tr><td colspan="36" style="background:#1e293b;color:#fff;font-weight:bold;font-size:12pt;text-align:center;">PLANILLA DE REMUNERACIONES - ${mesNombre.toUpperCase()} ${planillaActual.anio}${tituloUnidad}</td></tr>`;

    // Headers
    const headers = [
      ['#', '#f1f5f9', 40],
      ['CÓDIGO', '#334155', 80],
      ['EMPLEADO', '#334155', 220],
      ['DNI', '#334155', 90],
      ['FECHA INGRESO', '#334155', 100],
      ['FECHA CESE', '#334155', 100],
      ['BANCO', '#334155', 120],
      ['CTA. BANCARIA', '#334155', 140],
      ['CCI', '#334155', 160],
      ['CARGO', '#475569', 130],
      ['ÁREA', '#475569', 120],
      ['UNIDAD', '#475569', 120],
      ['SUELDO BASE', '#0891b2', 100],
      ['DIAS MES', '#6366f1', 60],
      ['JORNAL', '#6366f1', 90],
      ['D.EXTRA', '#f59e0b', 70],
      ['DIAS NO TRAB.', '#f97316', 90],
      ['D.REDUCIDOS', '#ef4444', 90],
      ['TOTAL DIAS', '#1e293b', 80],
      ['S. TAREO', '#0891b2', 100],
      ['ASIG.FAM', '#10b981', 90],
      ['CANT. DÍAS VAC.', '#0ea5e9', 90],
      ['VACACIONES', '#0ea5e9', 90],
      ['HORAS EXTRA', '#f59e0b', 90],
      ['D. VAC. COBRADAS', '#0891b2', 100],
      ['VAC. COBRADAS', '#0891b2', 110],
      ['REM. BRUTA', '#10b981', 110],
      ['AFP/ONP', '#64748b', 90],
      ['APORTE S/.', '#7c3aed', 90],
      ['COMISIÓN S/.', '#7c3aed', 90],
      ['SEGURO S/.', '#7c3aed', 90],
      ['T. Desc. Seguro', '#dc2626', 100],
      ['PAGO ADELANTO', '#dc2626', 100],
      ['5TA CAT', '#f97316', 90],
      ['TOT. DESC.', '#ef4444', 100],
      ['BONO REG.', '#10b981', 90],
      ['BONO', '#10b981', 90],
      ['DETALLE BONO', '#6ee7b7', 140],
      ['MOVILIDAD', '#10b981', 90],
      ['DETALLE MOVILIDAD', '#6ee7b7', 140],
      ['ALIMENTACIÓN', '#10b981', 90],
      ['DETALLE ALIMENTACIÓN', '#6ee7b7', 140],
      ['DESC. JUDICIAL', '#7c3aed', 110],
      ['NETO A PAGAR', '#059669', 120],
      ['ESSALUD 9%', '#0ea5e9', 95],
      ['SCTR SALUD', '#0ea5e9', 95],
      ['SCTR PENSIÓN', '#0ea5e9', 100],
      ['VIDA LEY', '#0ea5e9', 90],
      ['OTROS DESCUENTOS', '#f97316', 120],
      ['DESC. OTROS DESCUENTOS', '#fed7aa', 160],
      ['MONTO NETO DEPOSITAR', '#0f766e', 150],
    ];

    html += '<tr>';
    headers.forEach(([name, bg, w]) => {
      const isLight = bg === '#f1f5f9';
      html += `<th style="background:${bg};color:${isLight ? '#334155' : '#fff'};font-weight:bold;width:${w}px;">${name}</th>`;
    });
    html += '</tr>';

    // Data rows
    let totalNeto = 0;
    datos.forEach((row, idx) => {
      const emp = row.empleado || {};
      const sp = emp.sistema_pension || {};
      const situacion = emp.situacion_contractual;
      const esCesadoXls = situacion === 'CESADO';
      const esSuspendidoXls = situacion === 'SUSPENDIDO';
      const esNuevoXls = situacion === 'NUEVO';
      // fecha_ingreso coincide con el mes de la planilla → verde
      const fmtFecha = (f) => {
        if (!f) return '';
        const d = new Date(f);
        if (isNaN(d.getTime())) return '';
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      };
      const ingresoDate = emp.fecha_ingreso ? new Date(emp.fecha_ingreso) : null;
      const esNuevoEsteMes = ingresoDate
        && ingresoDate.getMonth() + 1 === planillaActual.mes
        && ingresoDate.getFullYear() === planillaActual.anio;
      // Prioridad color: CESADO=rojo, SUSPENDIDO=naranja, NUEVO=amarillo, ingresó este mes=verde
      const bgEmpXls = esCesadoXls ? '#fef2f2'
        : esSuspendidoXls ? '#fff7ed'
        : esNuevoXls ? '#fefce8'
        : esNuevoEsteMes ? '#dcfce7'
        : '#f8fafc';
      const colorEmpXls = esCesadoXls ? 'color:#dc2626;'
        : esSuspendidoXls ? 'color:#ea580c;'
        : esNuevoXls ? 'color:#ca8a04;'
        : esNuevoEsteMes ? 'color:#16a34a;'
        : '';
      const sufijo = esCesadoXls ? ' [CESADO]' : esSuspendidoXls ? ' [SUSPENDIDO]' : esNuevoXls ? ' [NUEVO]' : esNuevoEsteMes ? ' [INGRESÓ]' : '';
      const sueldoBase = parseFloat(row.sueldo_base || 0);
      const jornal = sueldoBase / 30;
      const remBrutaDesc = parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0);
      const descuento = remBrutaDesc * (
        parseFloat(sp.aporte   || 0) / 100 +
        parseFloat(sp.comision || 0) / 100 +
        parseFloat(sp.seguro   || 0) / 100
      );
      // NETO A PAGAR visual: consistente con Rem.Bruta y Tot.Desc. visuales
      const totDescNeto = descuento + parseFloat(row.adelantos || 0) + parseFloat(row.quinta_categoria || 0) + parseFloat(row.judicial || 0);
      const neto = remBrutaDesc - totDescNeto + parseFloat(row.bono_regular || 0)
        + parseFloat(row.bonos || 0)
        + parseFloat(row.viaticos || 0)
        + parseFloat(row.alimentacion || 0);
      totalNeto += neto;

      html += '<tr>';
      html += `<td style="background:${bgEmpXls};">${idx + 1}</td>`;
      html += `<td class="left" style="background:${bgEmpXls};${colorEmpXls}">${emp.codigo_trabajador || ''}</td>`;
      html += `<td class="left" style="background:${bgEmpXls};font-weight:bold;${colorEmpXls}">${emp.apellidos || ''}, ${emp.nombres || ''}${sufijo}</td>`;
      html += `<td class="left" style="background:${bgEmpXls};mso-number-format:'@';${colorEmpXls}">${emp.dni || ''}</td>`;
      html += `<td class="left" style="background:${bgEmpXls};${esNuevoEsteMes ? 'color:#16a34a;font-weight:bold;' : ''}">${fmtFecha(emp.fecha_ingreso)}</td>`;
      html += `<td class="left" style="background:${esCesadoXls ? '#fef2f2' : '#f8fafc'};${esCesadoXls ? 'color:#dc2626;font-weight:bold;' : ''}">${fmtFecha(emp.fecha_cese)}</td>`;
      html += `<td class="left" style="background:#f8fafc;">${emp.banco || ''}</td>`;
      html += `<td class="left" style="background:#f8fafc;mso-number-format:'@';">${emp.cuenta_bancaria || ''}</td>`;
      html += `<td class="left" style="background:#f8fafc;mso-number-format:'@';">${emp.cci || ''}</td>`;
      html += `<td class="left">${row.cargo_nombre || ''}</td>`;
      html += `<td class="left">${row.area_nombre || ''}</td>`;
      html += `<td class="left">${emp.unidad || ''}</td>`;
      html += `<td class="money" style="background:#ecfeff;">${fmt(row.sueldo_base)}</td>`;
      html += `<td style="background:#e0e7ff;">${diasDelMes}</td>`;
      html += `<td class="money" style="background:#e0e7ff;">${jornal === 0 ? '-' : jornal.toFixed(2)}</td>`;
      html += `<td class="num" style="background:#fef3c7;">${fmtD(row.d_extra)}</td>`;
      html += `<td class="num" style="background:#ffedd5;">${fmtD(row.dias_no_trab)}</td>`;
      html += `<td class="num" style="background:#fee2e2;">${fmtD(row.d_reducidos)}</td>`;
      const totalDiasXls = parseFloat(row.dias_trabajados || 0);
      html += `<td class="num" style="background:#e2e8f0;font-weight:bold;">${totalDiasXls === 0 ? '-' : totalDiasXls.toFixed(1)}</td>`;
      html += `<td class="money" style="background:#ecfeff;">${fmt(row.remuneracion_basica)}</td>`;
      html += `<td class="money">${fmt(row.asignacion_familiar)}</td>`;
      html += `<td style="background:#e0f2fe;color:#0ea5e9;font-weight:600;">${parseInt(row.empleado?.empleado_extras?.[0]?.v || 0) || '-'}</td>`;
      html += `<td class="money">${fmt(row.monto_vacaciones)}</td>`;
      html += `<td class="money" style="background:#fffbeb;">${fmt(row.monto_horas_extra)}</td>`;
      const diasVacCob = parseInt(row.dias_vac_cobradas || 0);
      html += `<td style="background:#ecfeff;color:#0891b2;font-weight:600;">${diasVacCob === 0 ? '-' : diasVacCob}</td>`;
      html += `<td class="money" style="background:#ecfeff;color:#0891b2;font-weight:600;">${fmt(row.monto_vac_cobradas)}</td>`;
      html += `<td class="money" style="background:#ecfdf5;font-weight:bold;">${fmt(parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0))}</td>`;
      html += `<td class="left">${sp.nombre || '-'}</td>`;
      const remBrutaXls = parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0);
      const aporteS = (parseFloat(sp.aporte || 0) / 100) * remBrutaXls;
      const comisionS = (parseFloat(sp.comision || 0) / 100) * remBrutaXls;
      const seguroS = (parseFloat(sp.seguro || 0) / 100) * remBrutaXls;
      html += `<td class="money" style="background:#f5f3ff;color:#7c3aed;">${aporteS === 0 ? '-' : aporteS.toFixed(2)}</td>`;
      html += `<td class="money" style="background:#f5f3ff;color:#7c3aed;">${comisionS === 0 ? '-' : comisionS.toFixed(2)}</td>`;
      html += `<td class="money" style="background:#f5f3ff;color:#7c3aed;">${seguroS === 0 ? '-' : seguroS.toFixed(2)}</td>`;
      html += `<td class="money" style="background:#fef2f2;color:#dc2626;font-weight:bold;">${descuento === 0 ? '-' : descuento.toFixed(2)}</td>`;
      html += `<td class="money" style="background:#fef2f2;">${fmt(row.adelantos)}</td>`;
      html += `<td class="money" style="background:#fff7ed;">${fmt(row.quinta_categoria)}</td>`;
      const bonoRegRates = (parseFloat(sp.aporte || 0) + parseFloat(sp.comision || 0) + parseFloat(sp.seguro || 0)) / 100;
      const totDescXls = descuento + parseFloat(row.adelantos || 0) + parseFloat(row.quinta_categoria || 0) + parseFloat(row.judicial || 0);
      html += `<td class="money" style="background:#fee2e2;font-weight:bold;">${totDescXls === 0 ? '-' : totDescXls.toFixed(2)}</td>`;
      const empExtras = row.empleado?.empleado_extras?.[0];
      html += `<td class="money">${fmt(row.bono_regular)}</td>`;
      html += `<td class="money">${fmt(row.bonos)}</td>`;
      html += `<td class="left" style="background:#f0fdf4;">${empExtras?.detalle_bono || ''}</td>`;
      html += `<td class="money">${fmt(row.viaticos)}</td>`;
      html += `<td class="left" style="background:#f0fdf4;">${empExtras?.detalle_movilidad || ''}</td>`;
      html += `<td class="money">${fmt(row.alimentacion)}</td>`;
      html += `<td class="left" style="background:#f0fdf4;">${empExtras?.detalle_alimentacion || ''}</td>`;
      const judicialXls = parseFloat(row.judicial || 0);
      html += `<td class="money" style="background:#f5f3ff;color:#7c3aed;font-weight:bold;">${judicialXls === 0 ? '-' : judicialXls.toFixed(2)}</td>`;
      html += `<td class="money" style="background:#ecfdf5;font-weight:bold;font-size:10pt;">${neto === 0 ? '-' : neto.toFixed(2)}</td>`;
      const essaludXls = parseFloat(row.remuneracion_computable || 0) * 0.09;
      const sctrSaludXls = parseFloat(row.sueldo_base || 0) * 0.006 * 1.18;
      const sctrPensionXls = parseFloat(row.sueldo_base || 0) * 0.009 * 1.2154;
      const vidaLeyXls = parseFloat(row.sueldo_base || 0) * 0.0057 * 1.18;
      html += `<td class="money" style="background:#e0f2fe;color:#0ea5e9;">${essaludXls === 0 ? '-' : essaludXls.toFixed(2)}</td>`;
      html += `<td class="money" style="background:#e0f2fe;color:#0ea5e9;">${sctrSaludXls === 0 ? '-' : sctrSaludXls.toFixed(2)}</td>`;
      html += `<td class="money" style="background:#e0f2fe;color:#0ea5e9;">${sctrPensionXls === 0 ? '-' : sctrPensionXls.toFixed(2)}</td>`;
      html += `<td class="money" style="background:#e0f2fe;color:#0ea5e9;">${vidaLeyXls === 0 ? '-' : vidaLeyXls.toFixed(2)}</td>`;
      const otrosDescXls = parseFloat(empExtras?.otros_descuentos || 0);
      const netoDepositarXls = Math.max(0, neto - otrosDescXls);
      html += `<td class="money" style="background:#fff7ed;color:#f97316;font-weight:bold;">${otrosDescXls === 0 ? '-' : otrosDescXls.toFixed(2)}</td>`;
      html += `<td class="left" style="background:#fff7ed;">${empExtras?.descripcion_otros_descuentos || ''}</td>`;
      html += `<td class="money" style="background:#ccfbf1;color:#0f766e;font-weight:bold;font-size:10pt;">${netoDepositarXls === 0 ? '-' : netoDepositarXls.toFixed(2)}</td>`;
      html += '</tr>';
    });

    // Fila total
    html += '<tr>';
    html += `<td colspan="43" style="background:#1e293b;color:#fff;font-weight:bold;text-align:right;font-size:10pt;">TOTAL NETO:</td>`;
    html += `<td class="money" style="background:#059669;color:#fff;font-weight:bold;font-size:11pt;">${totalNeto.toFixed(2)}</td>`;
    html += `<td colspan="7" style="background:#1e293b;"></td>`;
    html += '</tr>';

    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Planilla_${mesNombre}_${planillaActual.anio}${unidadFiltro ? '_' + unidadFiltro.replace(/\s+/g, '_') : ''}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel exportado correctamente');
  };

  const columnsDetalle = [
    { header: 'Código', render: (row) => row.empleado?.codigo_trabajador, width: '80px' },
    {
      header: 'Empleado',
      render: (row) => {
        const nombre = `${row.empleado?.apellidos || ''}, ${row.empleado?.nombres || ''}`;
        const situacion = row.empleado?.situacion_contractual;
        const ingresoDate = row.empleado?.fecha_ingreso ? new Date(row.empleado.fecha_ingreso) : null;
        const esNuevoEsteMes = ingresoDate
          && planillaActual
          && ingresoDate.getMonth() + 1 === planillaActual.mes
          && ingresoDate.getFullYear() === planillaActual.anio;
        if (situacion === 'CESADO') return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ background: isDark ? 'rgba(220,38,38,.15)' : '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap', border: isDark ? '1px solid rgba(220,38,38,.3)' : '1px solid #fecaca' }}>CESADO</span>
            <span style={{ color: '#dc2626', fontWeight: 600 }}>{nombre}</span>
          </span>
        );
        if (situacion === 'SUSPENDIDO') return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ background: isDark ? 'rgba(234,88,12,.15)' : '#fff7ed', color: '#ea580c', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap', border: isDark ? '1px solid rgba(234,88,12,.3)' : '1px solid #fed7aa' }}>SUSPENDIDO</span>
            <span style={{ color: '#ea580c', fontWeight: 600 }}>{nombre}</span>
          </span>
        );
        if (situacion === 'NUEVO') return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ background: isDark ? 'rgba(202,138,4,.15)' : '#fefce8', color: isDark ? '#fde68a' : '#ca8a04', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap', border: isDark ? '1px solid rgba(202,138,4,.3)' : '1px solid #fde68a' }}>NUEVO</span>
            <span style={{ color: isDark ? '#fde68a' : '#ca8a04', fontWeight: 600 }}>{nombre}</span>
          </span>
        );
        if (esNuevoEsteMes) return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ background: isDark ? 'rgba(22,163,74,.15)' : '#dcfce7', color: isDark ? '#6ee7b7' : '#16a34a', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap', border: isDark ? '1px solid rgba(22,163,74,.3)' : '1px solid #bbf7d0' }}>INGRESÓ</span>
            <span style={{ color: isDark ? '#6ee7b7' : '#16a34a', fontWeight: 600 }}>{nombre}</span>
          </span>
        );
        return <span style={{ fontWeight: 500 }}>{nombre}</span>;
      },
      width: '220px'
    },
    { header: 'Cargo', render: (row) => row.cargo_nombre, width: '130px' },
    { header: 'Área', render: (row) => row.area_nombre, width: '120px' },
    { header: 'Sueldo Base', render: (row) => formatMoney(row.sueldo_base), width: '100px' },
    { 
      header: 'DIAS', 
      render: (row) => {
        return <span style={{color: '#6366f1', fontWeight: '500'}}>{diasDelMes}</span>;
      }, 
      width: '60px' 
    },
    { 
      header: 'Jornal', 
      render: (row) => {
        const sueldoBase = parseFloat(row.sueldo_base || 0);
        const jornal = sueldoBase / 30;
        return <span style={{color: '#6366f1', fontWeight: '500'}}>{formatMoney(jornal)}</span>;
      }, 
      width: '90px' 
    },
    { 
      header: 'D.EXTRA', 
      render: (row) => {
        const dExtra = parseFloat(row.d_extra || 0);
        return <span style={{color: '#f59e0b', fontWeight: '500'}}>{dExtra === 0 ? '-' : Number(dExtra).toFixed(1)}</span>;
      }, 
      width: '80px' 
    },
    { 
      header: 'DIAS NO TRAB.', 
      render: (row) => {
        const diasNoTrab = parseFloat(row.dias_no_trab || 0);
        return <span style={{color: '#f97316', fontWeight: '500'}}>{diasNoTrab === 0 ? '-' : Number(diasNoTrab).toFixed(1)}</span>;
      }, 
      width: '110px' 
    },
    { 
      header: 'D.REDUCIDOS', 
      render: (row) => {
        const dReducidos = parseFloat(row.d_reducidos || 0);
        return <span style={{color: '#ef4444', fontWeight: '500'}}>{dReducidos === 0 ? '-' : Number(dReducidos).toFixed(1)}</span>;
      }, 
      width: '100px' 
    },
    { 
      header: 'TOTAL', 
      render: (row) => {
        const totalDias = parseFloat(row.dias_trabajados || 0);
        return <strong style={{color: c.textPrimary}}>{totalDias === 0 ? '-' : Number(totalDias).toFixed(1)}</strong>;
      }, 
      width: '70px' 
    },
    { 
      header: 'S. Tareo', 
      render: (row) => {
        return <strong style={{color: '#0891b2'}}>{formatMoney(parseFloat(row.remuneracion_basica || 0))}</strong>;
      }, 
      width: '100px' 
    },
    { 
      header: 'Asig.Fam', 
      render: (row) => {
        return <span style={{color: '#10b981', fontWeight: '500'}}>{formatMoney(parseFloat(row.asignacion_familiar || 0))}</span>;
      }, 
      width: '90px' 
    },
    {
      header: 'Cant. Días Vac.',
      render: (row) => {
        const diasVac = parseInt(row.empleado?.empleado_extras?.[0]?.v || 0);
        return <span style={{ color: '#0ea5e9', fontWeight: '600' }}>{diasVac === 0 ? '-' : diasVac}</span>;
      },
      width: '90px'
    },
    { 
      header: 'Vacaciones', 
      render: (row) => {
        return <span style={{color: '#0ea5e9', fontWeight: '500'}}>{formatMoney(parseFloat(row.monto_vacaciones || 0))}</span>;
      }, 
      width: '100px' 
    },
    { 
      header: 'Horas Extra', 
      render: (row) => {
        return <span style={{color: '#f59e0b', fontWeight: '500'}}>{formatMoney(parseFloat(row.monto_horas_extra || 0))}</span>;
      }, 
      width: '100px' 
    },
    {
      header: 'D. Vac. Cobradas',
      render: (row) => {
        const dias = parseInt(row.dias_vac_cobradas || 0);
        return <span style={{ color: '#0891b2', fontWeight: '600' }}>{dias === 0 ? '-' : dias}</span>;
      },
      width: '100px'
    },
    {
      header: 'Vac. Cobradas',
      render: (row) => {
        return <span style={{ color: '#0891b2', fontWeight: '600' }}>{formatMoney(parseFloat(row.monto_vac_cobradas || 0))}</span>;
      },
      width: '110px'
    },
    { 
      header: 'Rem. Bruta', 
      render: (row) => {
        return <strong style={{color: '#10b981'}}>{formatMoney(parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0))}</strong>;
      }, 
      width: '110px' 
    },
    { 
      header: 'AFP/ONP', 
      render: (row) => {
        const sistemaPension = row.empleado?.sistema_pension?.nombre || '-';
        return <span style={{color: c.textSecondary, fontWeight: '500'}}>{sistemaPension}</span>;
      }, 
      width: '90px' 
    },
    { 
      header: 'Aporte S/.',
      render: (row) => {
        const aporte   = parseFloat(row.empleado?.sistema_pension?.aporte || 0) / 100;
        const remBruta = parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0);
        return <span style={{color: '#7c3aed', fontWeight: '500'}}>{formatMoney(remBruta * aporte)}</span>;
      }, 
      width: '90px' 
    },
    { 
      header: 'Comisión S/.',
      render: (row) => {
        const comision = parseFloat(row.empleado?.sistema_pension?.comision || 0) / 100;
        const remBruta = parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0);
        return <span style={{color: '#7c3aed', fontWeight: '500'}}>{formatMoney(remBruta * comision)}</span>;
      }, 
      width: '100px' 
    },
    { 
      header: 'Seguro S/.',
      render: (row) => {
        const seguro   = parseFloat(row.empleado?.sistema_pension?.seguro || 0) / 100;
        const remBruta = parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0);
        return <span style={{color: '#7c3aed', fontWeight: '500'}}>{formatMoney(remBruta * seguro)}</span>;
      }, 
      width: '90px' 
    },
    { 
      header: 'T. Desc. Seguro', 
      render: (row) => {
        const sp = row.empleado?.sistema_pension || {};
        const remBruta = parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0);
        const aporte   = parseFloat(sp.aporte   || 0) / 100;
        const comision = parseFloat(sp.comision || 0) / 100;
        const seguro   = parseFloat(sp.seguro   || 0) / 100;
        const descuento = remBruta * (aporte + comision + seguro);
        return <strong style={{color: '#dc2626'}}>{formatMoney(descuento)}</strong>;
      }, 
      width: '100px' 
    },
    { 
      header: 'Desc por Adelanto', 
      render: (row) => {
        return <span style={{color: '#dc2626', fontWeight: '500'}}>{formatMoney(parseFloat(row.adelantos || 0))}</span>;
      }, 
      width: '110px' 
    },
    { 
      header: '5ta Cat', 
      render: (row) => {
        const quintaCat = parseFloat(row.quinta_categoria || 0);
        return <span style={{color: '#f97316', fontWeight: '500'}}>{formatMoney(quintaCat)}</span>;
      }, 
      width: '90px' 
    },
    { 
      header: 'Tot.Desc.', 
      render: (row) => {
        const sp = row.empleado?.sistema_pension || {};
        const remBruta = parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0);
        const rates = (parseFloat(sp.aporte || 0) + parseFloat(sp.comision || 0) + parseFloat(sp.seguro || 0)) / 100;
        const totDesc = (remBruta * rates) + parseFloat(row.adelantos || 0) + parseFloat(row.quinta_categoria || 0) + parseFloat(row.judicial || 0);
        return <strong style={{color: '#ef4444'}}>{formatMoney(totDesc)}</strong>;
      }, 
      width: '100px' 
    },
    { 
      header: 'Bono Regular', 
      render: (row) => {
        return <span style={{color: '#10b981', fontWeight: '500'}}>{formatMoney(parseFloat(row.bono_regular || 0))}</span>;
      }, 
      width: '100px' 
    },
    { 
      header: 'Bono',
      render: (row) => {
        return <span style={{color: '#10b981', fontWeight: '500'}}>{formatMoney(parseFloat(row.bonos || 0))}</span>;
      }, 
      width: '90px' 
    },
    { 
      header: 'Movilidad', 
      render: (row) => {
        return <span style={{color: '#10b981', fontWeight: '500'}}>{formatMoney(parseFloat(row.viaticos || 0))}</span>;
      }, 
      width: '90px' 
    },
    { 
      header: 'Alimentación', 
      render: (row) => {
        return <span style={{color: '#10b981', fontWeight: '500'}}>{formatMoney(parseFloat(row.alimentacion || 0))}</span>;
      }, 
      width: '100px' 
    },
    { 
      header: 'Desc. Judicial',
      render: (row) => {
        const judicial = parseFloat(row.judicial || 0);
        if (judicial === 0) return <span style={{color: c.textMuted}}>—</span>;
        const descuentos = row.empleado?.descuentos_judiciales || [];
        const tooltip = descuentos.map(d =>
          `${d.apellidos_beneficiario}, ${d.nombre_beneficiario} — S/ ${parseFloat(d.monto).toFixed(2)}`
        ).join('\n');
        return (
          <span
            title={tooltip}
            style={{
              color: '#7c3aed',
              fontWeight: 700,
              background: isDark ? 'rgba(124,58,237,.15)' : '#f5f3ff',
              padding: '2px 6px',
              borderRadius: '6px',
              cursor: descuentos.length ? 'help' : 'default',
            }}
          >
            {formatMoney(judicial)}
          </span>
        );
      },
      width: '110px'
    },
    { 
      header: 'NETO A PAGAR', 
      render: (row) => {
        const sp = row.empleado?.sistema_pension || {};
        const remBruta = parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0);
        const rates = (parseFloat(sp.aporte || 0) + parseFloat(sp.comision || 0) + parseFloat(sp.seguro || 0)) / 100;
        const totDesc = (remBruta * rates) + parseFloat(row.adelantos || 0) + parseFloat(row.quinta_categoria || 0) + parseFloat(row.judicial || 0);
        const neto = remBruta - totDesc + parseFloat(row.bono_regular || 0)
          + parseFloat(row.bonos || 0)
          + parseFloat(row.viaticos || 0)
          + parseFloat(row.alimentacion || 0);
        return <strong style={{color: '#059669', fontSize: '0.95rem'}}>{formatMoney(neto)}</strong>;
      }, 
      width: '120px' 
    },
    { 
      header: 'EsSalud 9%', 
      render: (row) => {
        const val = parseFloat(row.essalud || 0);
        return <span style={{color: '#0ea5e9', fontWeight: '500'}}>{formatMoney(val)}</span>;
      }, 
      width: '95px' 
    },
    { 
      header: 'SCTR Salud', 
      render: (row) => {
        const val = parseFloat(row.sueldo_base || 0) * 0.006 * 1.18;
        return <span style={{color: '#0ea5e9', fontWeight: '500'}}>{formatMoney(val)}</span>;
      }, 
      width: '95px' 
    },
    { 
      header: 'SCTR Pensión', 
      render: (row) => {
        const val = parseFloat(row.sueldo_base || 0) * 0.009 * 1.2154;
        return <span style={{color: '#0ea5e9', fontWeight: '500'}}>{formatMoney(val)}</span>;
      }, 
      width: '100px' 
    },
    { 
      header: 'Vida Ley', 
      render: (row) => {
        const val = parseFloat(row.sueldo_base || 0) * 0.0057 * 1.18;
        return <span style={{color: '#0ea5e9', fontWeight: '500'}}>{formatMoney(val)}</span>;
      }, 
      width: '90px' 
    },
    // {
    //   header: 'Acciones',
    //   width: '80px',
    //   render: (row) => (
    //     <button className="btn-sm btn-outline" onClick={() => handleBoleta(row.id)}>
    //       Boleta
    //     </button>
    //   )
    // },
    {
      header: 'Otros Descuentos',
      render: (row) => {
        const extras = row.empleado?.empleado_extras?.[0];
        const val = parseFloat(extras?.otros_descuentos || 0);
        return val === 0
          ? <span style={{color: c.textMuted}}>—</span>
          : <span title={extras?.descripcion_otros_descuentos || ''} style={{color: '#f97316', fontWeight: '600', cursor: extras?.descripcion_otros_descuentos ? 'help' : 'default'}}>{formatMoney(val)}</span>;
      },
      width: '130px'
    },
    {
      header: 'MONTO NETO A DEPOSITAR',
      render: (row) => {
        const extras = row.empleado?.empleado_extras?.[0];
        const otrosDesc = parseFloat(extras?.otros_descuentos || 0);
        const spDep = row.empleado?.sistema_pension || {};
        const remBrutaDep = parseFloat(row.remuneracion_computable || 0) - parseFloat(row.bono_regular || 0);
        const ratesDep = (parseFloat(spDep.aporte || 0) + parseFloat(spDep.comision || 0) + parseFloat(spDep.seguro || 0)) / 100;
        const totDescDep = (remBrutaDep * ratesDep) + parseFloat(row.adelantos || 0) + parseFloat(row.quinta_categoria || 0) + parseFloat(row.judicial || 0);
        const netoDep = remBrutaDep - totDescDep + parseFloat(row.bono_regular || 0)
          + parseFloat(row.bonos || 0)
          + parseFloat(row.viaticos || 0)
          + parseFloat(row.alimentacion || 0);
        const val = Math.max(0, netoDep - otrosDesc);
        return <strong style={{color: isDark ? '#5eead4' : '#0f766e', fontSize: '0.95rem', background: isDark ? 'rgba(15,118,110,.15)' : '#ccfbf1', padding: '2px 8px', borderRadius: '6px'}}>{formatMoney(val)}</strong>;
      },
      width: '170px'
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Gestión de Planillas</h2>
      </div>

      {/* Calcular nueva */}
      {canEdit && (
      <div className="card planilla-calc">
        <h4>Calcular Planilla</h4>
        <div className="planilla-calc-controls">
          <select className="form-select" value={mes} onChange={(e) => setMes(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{getMesNombre(i + 1)}</option>
            ))}
          </select>
          <input type="number" className="form-input" value={anio}
            onChange={(e) => setAnio(parseInt(e.target.value))} min="2020" max="2030" />
          <button className="btn-primary" onClick={handleCalcular} disabled={calculating}>
            {calculating ? (
              <><FiRefreshCw size={16} className="spin" /> Calculando...</>
            ) : (
              <><FiDollarSign size={16} /> Calcular Planilla</>
            )}
          </button>
        </div>
      </div>
      )}

      {/* Lista de planillas */}
      <div className="card">
        <h4>Planillas Generadas</h4>
        <DataTable columns={columnsPlanillas} data={planillas} pageSize={10} />
      </div>

      {/* Detalle de empleados de la planilla seleccionada */}
      {planillaActual && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4>
              Detalle de Planilla - {getMesNombre(planillaActual.mes)} {planillaActual.anio}
              <span style={{ 
                marginLeft: '1rem', 
                fontSize: '0.9rem', 
                color: 'var(--text-secondary)' 
              }}>
                ({planillaActual.total_trabajadores} empleados)
              </span>
            </h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {canEdit && planillaActual.estado === 'CALCULADO' && (
                <button className="btn-success" onClick={() => handleAprobar(planillaActual.id)}>
                  <FiCheck size={16} /> Aprobar Planilla
                </button>
              )}
              <button className="btn-secondary" onClick={() => setPlanillaActual(null)}>
                Cerrar
              </button>
            </div>
          </div>
          
          {/* Resumen de totales */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1rem', 
            marginBottom: '1rem',
            padding: '1rem',
            background: 'var(--bg-tertiary)',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Ingresos</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--info)' }}>
                {formatMoney(planillaActual.total_ingresos)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Descuentos</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                {formatMoney(planillaActual.total_descuentos)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Aportes</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                {formatMoney(planillaActual.total_aportes)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Neto</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                {formatMoney(planillaActual.total_neto)}
              </div>
            </div>
          </div>

          {loadingDetalle ? (
            <Loading />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
                  <FiSearch style={{ position: 'absolute', left: 10, color: c.textMuted, pointerEvents: 'none' }} size={15} />
                  <input
                    type="text"
                    className="form-select"
                    placeholder="Buscar por apellido, nombre o código..."
                    value={busquedaApellido}
                    onChange={(e) => setBusquedaApellido(e.target.value)}
                    style={{ paddingLeft: 32, paddingRight: busquedaApellido ? 32 : 12, minWidth: 280 }}
                  />
                  {busquedaApellido && (
                    <button
                      onClick={() => setBusquedaApellido('')}
                      style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, display: 'flex', alignItems: 'center', padding: 0 }}
                      title="Limpiar búsqueda"
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>
                <select
                  className="form-select"
                  value={unidadFiltro}
                  onChange={(e) => setUnidadFiltro(e.target.value)}
                  style={{ minWidth: 180 }}
                >
                  <option value="">Todas las unidades</option>
                  {UNIDADES.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {(busquedaApellido || unidadFiltro) && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {detallesFiltrados.length} de {detalles.length} empleado(s)
                  </span>
                )}
                <button className="btn-secondary" onClick={exportarExcelPlanilla} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FiDownload size={15} /> Exportar Excel
                </button>
              </div>
              <DataTable columns={columnsDetalle} data={detallesFiltrados} searchable={false} pageSize={20} />
            </>
          )}
        </div>
      )}

      {/* Modal Detalle - Ya no lo usamos, pero lo dejamos por si acaso */}
      <Modal isOpen={modalDetalle} onClose={() => setModalDetalle(false)}
        title={planillaActual ? `Detalle - ${getMesNombre(planillaActual.mes)} ${planillaActual.anio}` : 'Detalle'}
        size="large">
        {loadingDetalle ? <Loading /> : (
          <DataTable columns={columnsDetalle} data={detalles} searchable pageSize={15} />
        )}
      </Modal>

      {/* Boleta de Pago */}
      {modalBoleta && boletaData && (
        <BoletaPago
          data={boletaData}
          onClose={() => { setModalBoleta(false); setBoletaData(null); }}
        />
      )}
    </div>
  );
}

export default Planilla;
