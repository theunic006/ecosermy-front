import { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSearch, FiRefreshCw, FiCopy, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FACTORES = [12, 12, 12, 9, 8, 8, 8, 5, 4, 4, 4, 1];

// ==================== FUNCIONES DE CÁLCULO ====================

function calcularIRTramos(rentaNeta, uit) {
  const tramosConfig = [
    { hasta_uit: 5, tasa: 0.08 },
    { hasta_uit: 20, tasa: 0.14 },
    { hasta_uit: 35, tasa: 0.17 },
    { hasta_uit: 45, tasa: 0.20 },
    { hasta_uit: null, tasa: 0.30 },
  ];
  let restante = Math.max(0, rentaNeta);
  let prevLimite = 0;
  const tramos = [];

  for (const config of tramosConfig) {
    const limiteEnSoles = config.hasta_uit ? config.hasta_uit * uit : Infinity;
    const rangoTramo = limiteEnSoles - prevLimite;
    const montoAfecto = Math.min(restante, rangoTramo);
    const impuesto = Math.round(montoAfecto * config.tasa * 100) / 100;
    tramos.push({ montoAfecto, impuesto, tasa: config.tasa * 100 });
    restante -= montoAfecto;
    prevLimite = limiteEnSoles;
  }
  return tramos;
}

function getRetAnteriorR1(mesIndex, resultados) {
  if (mesIndex <= 2) return 0; // Ene-Mar: no restan
  let hasta;
  if (mesIndex === 3) hasta = 2;                       // Abr: ret Ene-Mar
  else if (mesIndex >= 4 && mesIndex <= 6) hasta = 3;   // May-Jul: ret Ene-Abr
  else if (mesIndex === 7) hasta = 6;                   // Ago: ret Ene-Jul
  else if (mesIndex >= 8 && mesIndex <= 10) hasta = 7;  // Sep-Nov: ret Ene-Ago
  else hasta = 10;                                      // Dic: ret Ene-Nov
  let sum = 0;
  for (let i = 0; i <= hasta; i++) sum += resultados[i].retencion_r1;
  return Math.round(sum * 100) / 100;
}

function calcularAnual(mesesInput, uit) {
  const deduccion7UIT = 7 * uit;
  const resultados = [];

  for (let i = 0; i < 12; i++) {
    const input = mesesInput[i];
    const mes = i + 1;

    // Rem Computable
    const remComputable = (parseFloat(input.remuneracion_basica) || 0) +
                          (parseFloat(input.asignacion_familiar) || 0) +
                          (parseFloat(input.bono_regular) || 0) +
                          (parseFloat(input.otros) || 0);

    // Proyección
    const mesesRestantes = 13 - mes;
    const totalRemProyectadas = remComputable * mesesRestantes;
    const gratJulio = remComputable;
    const gratDiciembre = remComputable;

    // Acumulados reales de meses anteriores
    let remMesesAnteriores = 0;
    let utilidadesAcum = 0;
    let bonifExtraordAcum = 0;
    for (let j = 0; j < i; j++) {
      remMesesAnteriores += resultados[j].remuneracion_computable;
      utilidadesAcum += parseFloat(mesesInput[j].participacion_utilidades) || 0;
      bonifExtraordAcum += (parseFloat(mesesInput[j].bonif_extraordinaria_jul) || 0) +
                           (parseFloat(mesesInput[j].bonif_extraordinaria_dic) || 0);
    }

    // Total ingreso anual (R1 NO incluye bonif/utilidades del mes actual)
    const totalIngresoAnual = totalRemProyectadas + gratJulio + gratDiciembre +
                              remMesesAnteriores + utilidadesAcum + bonifExtraordAcum;

    const deduccion = Math.min(totalIngresoAnual, deduccion7UIT);
    const rentaNeta = Math.max(0, totalIngresoAnual - deduccion);

    // IR por tramos (solo ordinarios)
    const irTramos = calcularIRTramos(rentaNeta, uit);
    const totalIR = irTramos.reduce((s, t) => s + t.impuesto, 0);

    // Retención R1
    const retAnterior = getRetAnteriorR1(i, resultados);
    const factor = FACTORES[i];
    let retencionR1;
    if (mes === 12) {
      retencionR1 = Math.max(0, Math.round((totalIR - retAnterior) * 100) / 100);
    } else {
      retencionR1 = Math.max(0, Math.round(((totalIR - retAnterior) / factor) * 100) / 100);
    }

    // R2 - Conceptos extraordinarios
    const utilidadesMes = parseFloat(input.participacion_utilidades) || 0;
    const bonifJulMes = parseFloat(input.bonif_extraordinaria_jul) || 0;
    const bonifDicMes = parseFloat(input.bonif_extraordinaria_dic) || 0;
    const totalExtraMes = utilidadesMes + bonifJulMes + bonifDicMes;
    let retencionR2 = 0;
    let irConExtra = 0;

    if (totalExtraMes > 0) {
      const totalRentaNetaR2 = rentaNeta + totalExtraMes;
      const irTramosR2 = calcularIRTramos(totalRentaNetaR2, uit);
      irConExtra = irTramosR2.reduce((s, t) => s + t.impuesto, 0);
      retencionR2 = Math.max(0, Math.round((irConExtra - totalIR) * 100) / 100);
    }

    resultados.push({
      mes,
      remuneracion_computable: Math.round(remComputable * 100) / 100,
      meses_restantes: mesesRestantes,
      total_rem_proyectadas: Math.round(totalRemProyectadas * 100) / 100,
      grat_julio: Math.round(gratJulio * 100) / 100,
      grat_diciembre: Math.round(gratDiciembre * 100) / 100,
      rem_meses_anteriores: Math.round(remMesesAnteriores * 100) / 100,
      utilidades_acumuladas: Math.round(utilidadesAcum * 100) / 100,
      bonif_extraord_acumuladas: Math.round(bonifExtraordAcum * 100) / 100,
      total_ingreso_anual: Math.round(totalIngresoAnual * 100) / 100,
      deduccion_7uit: Math.round(deduccion * 100) / 100,
      renta_neta: Math.round(rentaNeta * 100) / 100,
      ir_tramos: irTramos,
      total_ir: Math.round(totalIR * 100) / 100,
      retenciones_anteriores: retAnterior,
      factor_division: factor,
      retencion_r1: retencionR1,
      ir_con_extra: Math.round(irConExtra * 100) / 100,
      retencion_r2: retencionR2,
      retencion_total: Math.round((retencionR1 + retencionR2) * 100) / 100,
    });
  }
  return resultados;
}

// ==================== FORMATEO ====================

const fmt = (v) => {
  if (v === null || v === undefined) return '-';
  return parseFloat(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ==================== COMPONENTE PRINCIPAL ====================

function CalculoRenta() {
  const { isDark, c } = useThemeColors();
  const hoy = new Date();
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState('');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [uitConfig, setUitConfig] = useState(null);
  const [incluyeBonif9, setIncluyeBonif9] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [mesesData, setMesesData] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      remuneracion_basica: 0, asignacion_familiar: 0, bono_regular: 0, otros: 0,
      participacion_utilidades: 0, bonif_extraordinaria_jul: 0, bonif_extraordinaria_dic: 0,
    }))
  );

  // Cargar empleados
  useEffect(() => {
    api.get('/empleados?per_page=999').then(({ data }) => {
      const lista = Array.isArray(data) ? data : (data.data || []);
      setEmpleados(lista);
    }).catch(() => toast.error('Error al cargar empleados'));
  }, []);

  // Cargar UIT config
  useEffect(() => {
    api.get(`/quinta-categoria/${anio}`).then(({ data }) => setUitConfig(data))
      .catch(() => { setUitConfig(null); toast.error(`No hay UIT para ${anio}`); });
  }, [anio]);

  // Auto-calcular bonificación 9% cuando cambia el checkbox o datos
  useEffect(() => {
    if (!incluyeBonif9) return;
    setMesesData(prev => {
      const updated = [...prev];
      for (let i = 0; i < 12; i++) {
        const remComp = (parseFloat(updated[i].remuneracion_basica) || 0) +
                        (parseFloat(updated[i].asignacion_familiar) || 0) +
                        (parseFloat(updated[i].bono_regular) || 0) +
                        (parseFloat(updated[i].otros) || 0);
        updated[i] = {
          ...updated[i],
          bonif_extraordinaria_jul: i === 6 ? Math.round(remComp * 0.09 * 100) / 100 : 0,
          bonif_extraordinaria_dic: i === 11 ? Math.round(remComp * 0.09 * 100) / 100 : 0,
        };
      }
      return updated;
    });
  }, [incluyeBonif9]);

  // Seleccionar empleado
  const handleEmpleadoChange = useCallback((id) => {
    setSelectedEmpleadoId(id);
    if (!id) return;
    const emp = empleados.find(e => e.id === parseInt(id));
    if (emp) {
      const base = {
        remuneracion_basica: parseFloat(emp.sueldo_base) || 0,
        asignacion_familiar: emp.tiene_asignacion_familiar ? (parseFloat(emp.val_asig_familiar) || 0) : 0,
        bono_regular: parseFloat(emp.bono_regular) || 0,
        otros: 0,
        participacion_utilidades: 0,
        bonif_extraordinaria_jul: 0,
        bonif_extraordinaria_dic: 0,
      };
      const newData = Array.from({ length: 12 }, () => ({ ...base }));
      // Auto bonif 9%
      if (incluyeBonif9) {
        const remComp = base.remuneracion_basica + base.asignacion_familiar + base.bono_regular;
        newData[6].bonif_extraordinaria_jul = Math.round(remComp * 0.09 * 100) / 100;
        newData[11].bonif_extraordinaria_dic = Math.round(remComp * 0.09 * 100) / 100;
      }
      setMesesData(newData);
    }
  }, [empleados, incluyeBonif9]);

  // Cambiar input de un mes
  const handleInputChange = useCallback((mesIndex, field, value) => {
    setMesesData(prev => {
      const updated = [...prev];
      updated[mesIndex] = { ...updated[mesIndex], [field]: value };
      // Recalcular bonif 9% si cambió un campo de ingreso
      if (incluyeBonif9 && ['remuneracion_basica', 'asignacion_familiar', 'bono_regular', 'otros'].includes(field)) {
        const remComp = (parseFloat(updated[mesIndex].remuneracion_basica) || 0) +
                        (parseFloat(updated[mesIndex].asignacion_familiar) || 0) +
                        (parseFloat(updated[mesIndex].bono_regular) || 0) +
                        (parseFloat(updated[mesIndex].otros) || 0);
        if (mesIndex === 6) updated[6].bonif_extraordinaria_jul = Math.round(remComp * 0.09 * 100) / 100;
        if (mesIndex === 11) updated[11].bonif_extraordinaria_dic = Math.round(remComp * 0.09 * 100) / 100;
      }
      return updated;
    });
  }, [incluyeBonif9]);

  // Aplicar valor de enero a todos los meses
  const aplicarATodos = useCallback((field) => {
    setMesesData(prev => {
      const val = prev[0][field];
      const updated = prev.map(m => ({ ...m, [field]: val }));
      // Recalcular bonif
      if (incluyeBonif9) {
        for (let i = 0; i < 12; i++) {
          const rc = (parseFloat(updated[i].remuneracion_basica) || 0) +
                     (parseFloat(updated[i].asignacion_familiar) || 0) +
                     (parseFloat(updated[i].bono_regular) || 0) +
                     (parseFloat(updated[i].otros) || 0);
          updated[i].bonif_extraordinaria_jul = i === 6 ? Math.round(rc * 0.09 * 100) / 100 : 0;
          updated[i].bonif_extraordinaria_dic = i === 11 ? Math.round(rc * 0.09 * 100) / 100 : 0;
        }
      }
      return updated;
    });
    toast.success('Aplicado a todos los meses');
  }, [incluyeBonif9]);

  // Cálculo
  const uit = uitConfig ? parseFloat(uitConfig.uit) : 0;
  const resultados = useMemo(() => {
    if (!uit) return null;
    return calcularAnual(mesesData, uit);
  }, [mesesData, uit]);

  // Totales anuales
  const totales = useMemo(() => {
    if (!resultados) return null;
    return {
      retencion_r1: resultados.reduce((s, r) => s + r.retencion_r1, 0),
      retencion_r2: resultados.reduce((s, r) => s + r.retencion_r2, 0),
      retencion_total: resultados.reduce((s, r) => s + r.retencion_total, 0),
      total_ir: resultados[resultados.length - 1]?.total_ir || 0,
    };
  }, [resultados]);

  // Empleado seleccionado
  const empSeleccionado = empleados.find(e => e.id === parseInt(selectedEmpleadoId));

  // Filtrar empleados por búsqueda
  const empleadosFiltrados = empleados.filter(e => {
    if (!busqueda) return true;
    const texto = `${e.nombre_completo || ''} ${e.apellidos || ''} ${e.nombres || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  // ==================== ESTILOS (dark-mode aware) ====================
  const S = {
    table: { borderCollapse: 'collapse', width: '100%', fontSize: '12px', minWidth: '1500px' },
    thLabel: { position: 'sticky', left: 0, zIndex: 10, background: c.tableHeaderBg, color: c.tableHeaderColor, padding: '8px 12px', textAlign: 'left', fontWeight: '600', minWidth: '220px', borderBottom: '1px solid ' + c.tableHeaderBorder },
    thMes: { background: c.tableHeaderBg, color: c.tableHeaderColor, padding: '8px 6px', textAlign: 'center', fontWeight: '600', minWidth: '95px', borderBottom: '1px solid ' + c.tableHeaderBorder, borderLeft: '1px solid ' + c.tableHeaderBorder },
    sectionHeader: (color) => ({ background: color, color: 'white', padding: '6px 12px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', position: 'sticky', left: 0, zIndex: 5 }),
    sectionHeaderTd: (color) => ({ background: color, borderBottom: `2px solid ${color}` }),
    labelCell: (bg = '#f8fafc') => ({ position: 'sticky', left: 0, zIndex: 5, background: isDark ? 'rgba(148,163,184,.04)' : bg, padding: '5px 12px', fontWeight: '500', color: isDark ? c.textPrimary : '#334155', borderBottom: '1px solid ' + c.borderNormal, whiteSpace: 'nowrap' }),
    calcCell: { padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid ' + c.borderNormal, borderLeft: '1px solid ' + c.borderSubtle, color: c.textSecondary, fontWeight: '400', background: isDark ? 'transparent' : '#fafafa' },
    inputCell: { padding: '3px 4px', textAlign: 'center', borderBottom: '1px solid ' + c.borderNormal, borderLeft: '1px solid ' + c.borderSubtle, background: isDark ? 'rgba(99,102,241,.06)' : '#eff6ff' },
    totalLabel: (color) => ({ position: 'sticky', left: 0, zIndex: 5, background: isDark ? 'rgba(56,189,248,.06)' : '#f0f9ff', padding: '6px 12px', fontWeight: '700', color: color, borderBottom: '2px solid ' + color, whiteSpace: 'nowrap' }),
    totalCell: (color) => ({ padding: '6px 8px', textAlign: 'right', fontWeight: '700', color: color, borderBottom: '2px solid ' + color, borderLeft: '1px solid ' + c.borderSubtle, background: isDark ? 'rgba(56,189,248,.06)' : '#f0f9ff' }),
    resultLabel: (color) => ({ position: 'sticky', left: 0, zIndex: 5, background: color + '15', padding: '8px 12px', fontWeight: '800', color: color, borderBottom: '2px solid ' + color, fontSize: '13px', whiteSpace: 'nowrap' }),
    resultCell: (color) => ({ padding: '8px 8px', textAlign: 'right', fontWeight: '800', color: color, borderBottom: '2px solid ' + color, borderLeft: '1px solid ' + c.borderSubtle, background: color + '10', fontSize: '13px' }),
    input: { width: '82px', padding: '3px 6px', fontSize: '12px', textAlign: 'right', border: isDark ? '1px solid rgba(99,102,241,.3)' : '1px solid #93c5fd', borderRadius: '4px', background: isDark ? '#0d1425' : 'white', color: isDark ? c.textPrimary : undefined, outline: 'none' },
    inputDisabled: { width: '82px', padding: '3px 6px', fontSize: '12px', textAlign: 'right', border: '1px solid ' + c.borderNormal, borderRadius: '4px', background: isDark ? 'rgba(148,163,184,.04)' : '#f1f5f9', color: c.textMuted },
    applyBtn: { background: 'none', border: 'none', cursor: 'pointer', color: c.accent, fontSize: '11px', padding: '2px 4px', title: 'Aplicar a todos los meses' },
  };

  // ==================== RENDER HELPERS ====================

  const renderInputRow = (label, field, options = {}) => (
    <tr key={field}>
      <td style={S.labelCell('#eff6ff')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{label}</span>
          <button style={S.applyBtn} onClick={() => aplicarATodos(field)} title="Copiar Enero → todos">
            <FiCopy size={12} />
          </button>
        </div>
      </td>
      {MESES.map((_, i) => (
        <td key={i} style={S.inputCell}>
          <input
            type="number"
            value={mesesData[i][field] || ''}
            onChange={e => handleInputChange(i, field, e.target.value)}
            style={options.disabled?.(i) ? S.inputDisabled : S.input}
            step="0.01"
            min="0"
            disabled={options.disabled?.(i)}
            placeholder="0"
          />
        </td>
      ))}
      <td style={{ ...S.calcCell, fontWeight: '600', background: isDark ? 'rgba(56,189,248,.06)' : '#f0f9ff' }}>
        {fmt(mesesData.reduce((s, m) => s + (parseFloat(m[field]) || 0), 0))}
      </td>
    </tr>
  );

  const renderCalcRow = (label, getValue, options = {}) => (
    <tr key={label}>
      <td style={S.labelCell(options.bg || '#f8fafc')}>{label}</td>
      {resultados?.map((r, i) => (
        <td key={i} style={{ ...S.calcCell, color: options.negative && getValue(r) > 0 ? '#dc2626' : (options.color || '#475569') }}>
          {options.format === 'int' ? getValue(r) : (options.negative ? `(${fmt(getValue(r))})` : fmt(getValue(r)))}
        </td>
      )) || MESES.map((_, i) => <td key={i} style={S.calcCell}>-</td>)}
      <td style={{ ...S.calcCell, fontWeight: '600', background: isDark ? 'rgba(56,189,248,.06)' : '#f0f9ff' }}>
        {resultados && options.showTotal !== false
          ? (options.format === 'int' ? '' : (options.negative
            ? `(${fmt(resultados.reduce((s, r) => s + getValue(r), 0))})`
            : fmt(resultados.reduce((s, r) => s + getValue(r), 0))))
          : ''}
      </td>
    </tr>
  );

  const renderTotalRow = (label, getValue, color) => (
    <tr key={label}>
      <td style={S.totalLabel(color)}>{label}</td>
      {resultados?.map((r, i) => (
        <td key={i} style={S.totalCell(color)}>{fmt(getValue(r))}</td>
      )) || MESES.map((_, i) => <td key={i} style={S.totalCell(color)}>-</td>)}
      <td style={{ ...S.totalCell(color), fontSize: '13px' }}>
        {resultados ? fmt(resultados.reduce((s, r) => s + getValue(r), 0)) : '-'}
      </td>
    </tr>
  );

  const renderResultRow = (label, getValue, color) => (
    <tr key={label}>
      <td style={S.resultLabel(color)}>{label}</td>
      {resultados?.map((r, i) => (
        <td key={i} style={S.resultCell(color)}>{fmt(getValue(r))}</td>
      )) || MESES.map((_, i) => <td key={i} style={S.resultCell(color)}>-</td>)}
      <td style={{ ...S.resultCell(color), fontSize: '14px' }}>
        {resultados ? fmt(resultados.reduce((s, r) => s + getValue(r), 0)) : '-'}
      </td>
    </tr>
  );

  const renderSectionHeader = (label, color) => (
    <tr key={`section-${label}`}>
      <td style={S.sectionHeader(color)}>{label}</td>
      {MESES.map((_, i) => <td key={i} style={S.sectionHeaderTd(color)} />)}
      <td style={S.sectionHeaderTd(color)} />
    </tr>
  );

  const renderTramoRow = (idx, label) => (
    <tr key={`tramo-${idx}`}>
      <td style={{ ...S.labelCell('#faf5ff'), fontSize: '11px', color: isDark ? '#a78bfa' : '#6b21a8' }}>{label}</td>
      {resultados?.map((r, i) => (
        <td key={i} style={{ ...S.calcCell, fontSize: '11px' }}>
          {r.ir_tramos[idx]?.impuesto > 0
            ? <span><span style={{ color: c.textMuted }}>{fmt(r.ir_tramos[idx].montoAfecto)}</span> → <strong style={{ color: '#7c3aed' }}>{fmt(r.ir_tramos[idx].impuesto)}</strong></span>
            : <span style={{ color: isDark ? '#555f73' : '#cbd5e1' }}>0.00</span>}
        </td>
      )) || MESES.map((_, i) => <td key={i} style={S.calcCell}>-</td>)}
      <td style={{ ...S.calcCell, fontWeight: '600', background: isDark ? 'rgba(56,189,248,.06)' : '#f0f9ff', color: '#7c3aed' }}>
        {resultados ? fmt(resultados.reduce((s, r) => s + (r.ir_tramos[idx]?.impuesto || 0), 0)) : '-'}
      </td>
    </tr>
  );

  // ==================== RENDER ====================

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            📊 Cálculo de Renta de 5ta Categoría
          </h1>
          <p className="text-muted">
            Cálculo mensual detallado de la retención del Impuesto a la Renta — Art. 40° del Reglamento LIR
          </p>
        </div>
      </div>

      {/* Barra de controles */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
          {/* Selector de empleado */}
          <div style={{ flex: '1 1 350px' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Empleado</label>
            <div style={{ position: 'relative' }}>
              <select
                className="form-control"
                value={selectedEmpleadoId}
                onChange={e => handleEmpleadoChange(e.target.value)}
                style={{ paddingRight: '30px' }}
              >
                <option value="">— Seleccione un empleado —</option>
                {empleadosFiltrados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre_completo || `${emp.apellidos}, ${emp.nombres}`} — S/ {fmt(emp.sueldo_base)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Año */}
          <div style={{ width: '100px' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Año</label>
            <input
              type="number" className="form-control" value={anio}
              onChange={e => setAnio(parseInt(e.target.value) || hoy.getFullYear())}
              min="2020" max="2030"
            />
          </div>

          {/* UIT info */}
          <div style={{ width: '120px' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>UIT {anio}</label>
            <div style={{ padding: '7px 12px', background: isDark ? c.successBg : '#f0fdf4', border: isDark ? '1px solid rgba(52,211,153,.2)' : '1px solid #bbf7d0', borderRadius: '6px', fontWeight: '700', color: isDark ? c.successText : '#059669', textAlign: 'center' }}>
              S/ {uit ? fmt(uit) : '---'}
            </div>
          </div>

          {/* 7 UIT */}
          <div style={{ width: '140px' }}>
            <label className="form-label" style={{ fontSize: '12px' }}>Deducción 7 UIT</label>
            <div style={{ padding: '7px 12px', background: isDark ? c.dangerBg : '#fef2f2', border: isDark ? '1px solid rgba(248,113,113,.2)' : '1px solid #fecaca', borderRadius: '6px', fontWeight: '700', color: isDark ? c.dangerText : '#dc2626', textAlign: 'center' }}>
              S/ {uit ? fmt(7 * uit) : '---'}
            </div>
          </div>

          {/* Bonif 9% */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: c.textSecondary }}>
              <input
                type="checkbox" checked={incluyeBonif9}
                onChange={e => setIncluyeBonif9(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#059669' }}
              />
              Bonif. Extraord. 9%
            </label>
          </div>
        </div>
      </div>

      {/* Info del empleado seleccionado */}
      {empSeleccionado && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: c.textSecondary, marginBottom: 2 }}>Sueldo Base</p>
            <strong style={{ fontSize: '1.2rem', color: c.textPrimary }}>S/ {fmt(empSeleccionado.sueldo_base)}</strong>
          </div>
          <div className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: c.textSecondary, marginBottom: 2 }}>Asig. Familiar</p>
            <strong style={{ fontSize: '1.2rem', color: empSeleccionado.tiene_asignacion_familiar ? '#059669' : c.textMuted }}>
              {empSeleccionado.tiene_asignacion_familiar ? `S/ ${fmt(empSeleccionado.val_asig_familiar)}` : 'No aplica'}
            </strong>
          </div>
          <div className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: c.textSecondary, marginBottom: 2 }}>Bono Regular</p>
            <strong style={{ fontSize: '1.2rem', color: '#7c3aed' }}>S/ {fmt(empSeleccionado.bono_regular)}</strong>
          </div>
          <div className="card" style={{ padding: '14px 16px', textAlign: 'center', background: resultados && totales.retencion_total > 0 ? 'linear-gradient(135deg, #059669, #10b981)' : (isDark ? 'transparent' : '#f8fafc'), color: resultados && totales.retencion_total > 0 ? 'white' : 'inherit' }}>
            <p style={{ fontSize: '11px', opacity: 0.85, marginBottom: 2 }}>Retención Anual Total</p>
            <strong style={{ fontSize: '1.2rem' }}>S/ {totales ? fmt(totales.retencion_total) : '0.00'}</strong>
          </div>
        </div>
      )}

      {/* Tabla principal tipo spreadsheet */}
      {selectedEmpleadoId && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.thLabel}>Concepto</th>
                  {MESES.map(m => <th key={m} style={S.thMes}>{m}</th>)}
                  <th style={{ ...S.thMes, background: isDark ? '#060b17' : '#0f172a', minWidth: '100px' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {/* ============ SECCIÓN: INGRESOS MENSUALES ============ */}
                {renderSectionHeader('INGRESOS MENSUALES', '#059669')}
                {renderInputRow('Sueldo Base', 'remuneracion_basica')}
                {renderInputRow('Asignación Familiar', 'asignacion_familiar')}
                {renderInputRow('Bono Regular', 'bono_regular')}
                {renderInputRow('Otros Computables', 'otros')}
                {renderTotalRow('= Remuneración Computable', r => r.remuneracion_computable, '#059669')}

                {/* ============ SECCIÓN: PROYECCIÓN ANUAL ============ */}
                {renderSectionHeader('PROYECCIÓN ANUAL', '#2563eb')}
                {renderCalcRow('× Meses restantes (13 − mes)', r => r.meses_restantes, { format: 'int', showTotal: false })}
                {renderCalcRow('= Total Rem. Proyectadas', r => r.total_rem_proyectadas)}
                {renderCalcRow('(+) Gratificación Julio (proyectada)', r => r.grat_julio)}
                {renderCalcRow('(+) Gratificación Diciembre (proyectada)', r => r.grat_diciembre)}
                {renderCalcRow('(+) Rem. Meses Anteriores (acumulado)', r => r.rem_meses_anteriores)}
                {renderTotalRow('= TOTAL INGRESO ANUAL PROYECTADO', r => r.total_ingreso_anual, '#2563eb')}
                {renderCalcRow('(−) Deducción 7 UITs', r => r.deduccion_7uit, { negative: true })}
                {renderTotalRow('= RENTA NETA ANUAL PROYECTADA', r => r.renta_neta, '#7c3aed')}

                {/* ============ SECCIÓN: IR POR TRAMOS ============ */}
                {renderSectionHeader('IMPUESTO A LA RENTA POR TRAMOS', '#7c3aed')}
                {renderTramoRow(0, '8% — Hasta 5 UIT (S/ ' + fmt(5 * uit) + ')')}
                {renderTramoRow(1, '14% — 5 a 20 UIT (S/ ' + fmt(20 * uit) + ')')}
                {renderTramoRow(2, '17% — 20 a 35 UIT (S/ ' + fmt(35 * uit) + ')')}
                {renderTramoRow(3, '20% — 35 a 45 UIT (S/ ' + fmt(45 * uit) + ')')}
                {renderTramoRow(4, '30% — Exceso de 45 UIT')}
                {renderTotalRow('= TOTAL IR ANUAL PROYECTADO', r => r.total_ir, '#dc2626')}

                {/* ============ SECCIÓN: RETENCIÓN R1 ============ */}
                {renderSectionHeader('RETENCIÓN MENSUAL R1', '#ea580c')}
                {renderCalcRow('(−) Ret. meses anteriores (R1 acum.)', r => r.retenciones_anteriores, { negative: true })}
                {renderCalcRow('÷ Factor de división (Art. 40°)', r => r.factor_division, { format: 'int', showTotal: false })}
                {renderResultRow('= RETENCIÓN R1', r => r.retencion_r1, '#059669')}

                {/* ============ SECCIÓN: R2 ============ */}
                {renderSectionHeader('R2 — CONCEPTOS EXTRAORDINARIOS', '#b91c1c')}
                {renderInputRow('Participación Utilidades', 'participacion_utilidades')}
                {renderInputRow('Bonif. Extraord. Julio (9%)', 'bonif_extraordinaria_jul', {
                  disabled: (i) => incluyeBonif9 && i !== 6,
                })}
                {renderInputRow('Bonif. Extraord. Diciembre (9%)', 'bonif_extraordinaria_dic', {
                  disabled: (i) => incluyeBonif9 && i !== 11,
                })}
                {renderResultRow('= RETENCIÓN R2', r => r.retencion_r2, '#dc2626')}

                {/* ============ SECCIÓN: TOTAL ============ */}
                {renderSectionHeader('RESULTADO FINAL', '#0f172a')}
                <tr>
                  <td style={{ position: 'sticky', left: 0, zIndex: 5, background: 'linear-gradient(135deg, #059669, #10b981)', padding: '12px 16px', fontWeight: '800', color: 'white', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    💰 RETENCIÓN TOTAL (R1 + R2)
                  </td>
                  {resultados?.map((r, i) => (
                    <td key={i} style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '800', color: 'white', background: 'linear-gradient(135deg, #059669, #10b981)', borderLeft: '1px solid #34d399', fontSize: '14px' }}>
                      {fmt(r.retencion_total)}
                    </td>
                  )) || MESES.map((_, i) => <td key={i} style={{ padding: '12px 8px', background: isDark ? c.successBg : '#f0fdf4' }}>-</td>)}
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '900', color: 'white', background: 'linear-gradient(135deg, #047857, #059669)', fontSize: '16px' }}>
                    {totales ? fmt(totales.retencion_total) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!selectedEmpleadoId && (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center', color: c.textMuted }}>
          <FiSearch size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3>Seleccione un empleado para calcular</h3>
          <p style={{ marginTop: 8 }}>
            Elija un trabajador del selector superior para ver el cálculo detallado de su retención de 5ta Categoría mes a mes.
          </p>
        </div>
      )}

      {/* Leyenda */}
      {selectedEmpleadoId && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '24px', fontSize: '12px', color: c.textSecondary, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, background: isDark ? 'rgba(99,102,241,.06)' : '#eff6ff', border: isDark ? '1px solid rgba(99,102,241,.3)' : '1px solid #93c5fd', borderRadius: 3, display: 'inline-block' }}></span>
            Campos editables
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, background: isDark ? 'transparent' : '#fafafa', border: '1px solid ' + c.borderNormal, borderRadius: 3, display: 'inline-block' }}></span>
            Campos calculados
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiCopy size={12} /> Copiar valor de Enero a todos los meses
          </span>
          <span>Factores de división: Ene-Mar=12 | Abr=9 | May-Jul=8 | Ago=5 | Sep-Nov=4 | Dic=1</span>
        </div>
      )}
    </div>
  );
}

export default CalculoRenta;
