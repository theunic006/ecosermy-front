import { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw, FiFileText } from 'react-icons/fi';
import api from '../services/api';
import Loading from '../components/common/Loading';
import { getMesNombre } from '../utils/helpers';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';

const MESES = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMesNombre(i + 1) }));

const COLUMNAS = [
  { key: 'secuencia',                       label: 'Número de secuencia',                              width: '80px' },
  { key: 'nombre_afp',                      label: 'AFP',                                              width: '120px' },
  { key: 'cuspp',                           label: 'CUSPP',                                            width: '110px' },
  { key: 'tipo_documento',                  label: 'Tipo de documento de identidad',                   width: '40px' },
  { key: 'numero_documento',                label: 'Número de documento de identidad',                 width: '120px' },
  { key: 'apellido_paterno',                label: 'Apellido paterno',                                 width: '130px' },
  { key: 'apellido_materno',                label: 'Apellido materno',                                 width: '130px' },
  { key: 'nombres',                         label: 'Nombres',                                          width: '150px' },
  { key: 'relacion_laboral',                label: 'Relación Laboral',                                 width: '70px' },
  { key: 'fecha_ingreso',                   label: 'Fecha Ingreso',                                    width: '100px' },
  { key: 'inicio_rl',                       label: 'Inicio de RL',                                     width: '70px' },
  { key: 'fecha_cese',                      label: 'Fecha Cese',                                       width: '100px' },
  { key: 'cese_rl',                         label: 'Cese de RL',                                       width: '70px' },
  { key: 'excepcion_aportar',               label: 'Excepcion de Aportar',                             width: '100px' },
  { key: 'rem_asegurable',                  label: 'Remuneración asegurable',                          width: '120px' },
  { key: 'aporte_vol_afil_previsional',     label: 'Aporte voluntario del afiliado con fin previsional',   width: '110px' },
  { key: 'aporte_vol_afil_sin_previsional', label: 'Aporte voluntario del afiliado sin fin previsional',   width: '110px' },
  { key: 'aporte_vol_empleador',            label: 'Aporte voluntario del empleador',                  width: '90px' },
  { key: 'tipo_trabajo',                   label: 'Tipo de trabajo o Rubro',                          width: '90px' },
  { key: 'afp',                             label: 'AFP (Conviene dejar en blanco)',                    width: '80px' },
];

function Formato() {
  const hoy = new Date();
  const { isDark, c } = useThemeColors();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargado, setCargado] = useState(false);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/formato/${mes}/${anio}`);
      setDatos(resp.data || []);
      setCargado(true);
    } catch (err) {
      toast.error('Error al cargar datos del formato');
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    if (!datos.length) { toast.warning('No hay datos para exportar'); return; }

    const mesNombre = getMesNombre(mes);
    const COLUMNAS_EXPORT = COLUMNAS;

    // Estilo base
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>AFPnet ${mesNombre} ${anio}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  td, th { font-family: Calibri; font-size: 9pt; border: 1px solid #d1d5db; padding: 3px 5px; vertical-align: middle; }
  .txt { mso-number-format:"\\@"; text-align: left; }
  .num { text-align: right; }
  .ctr { text-align: center; }
</style>
</head><body><table border="1">`;

    // Cabecera con nombres exactos AFP Net
    html += '<tr>';
    COLUMNAS_EXPORT.forEach(col => {
      html += `<th style="background:#1e293b;color:#fff;font-weight:bold;text-align:center;">${col.label}</th>`;
    });
    html += '</tr>';

    // Fila de datos
    datos.forEach((row) => {
      html += '<tr>';
      html += `<td class="num">${row.secuencia}</td>`;
      html += `<td class="txt">${row.nombre_afp}</td>`;
      html += `<td class="txt">${row.cuspp}</td>`;
      html += `<td class="num">${row.tipo_documento}</td>`;
      html += `<td class="txt">${row.numero_documento}</td>`;
      html += `<td class="txt">${row.apellido_paterno}</td>`;
      html += `<td class="txt">${row.apellido_materno}</td>`;
      html += `<td class="txt">${row.nombres}</td>`;
      html += `<td class="ctr">${row.relacion_laboral}</td>`;
      html += `<td class="txt">${row.fecha_ingreso}</td>`;
      html += `<td class="ctr">${row.inicio_rl}</td>`;
      html += `<td class="txt">${row.fecha_cese}</td>`;
      html += `<td class="ctr">${row.cese_rl}</td>`;
      html += `<td class="txt">${row.excepcion_aportar}</td>`;
      html += `<td class="num">${row.rem_asegurable}</td>`;
      html += `<td class="num">${row.aporte_vol_afil_previsional}</td>`;
      html += `<td class="num">${row.aporte_vol_afil_sin_previsional}</td>`;
      html += `<td class="num">${row.aporte_vol_empleador}</td>`;
      html += `<td class="ctr">${row.tipo_trabajo}</td>`;
      html += `<td class="txt">${row.afp}</td>`;
      html += '</tr>';
    });

    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AFPnet_${mesNombre}_${anio}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Excel exportado correctamente');
  };

  const AFP_COLORES = {
    HABITAT:  { bg: '#ede9fe', color: '#5b21b6' },
    HABITAD:  { bg: '#ede9fe', color: '#5b21b6' },
    INTEGRA:  { bg: '#dbeafe', color: '#1d4ed8' },
    PRIMA:    { bg: '#dcfce7', color: '#15803d' },
    PROFUTURO:{ bg: '#fef3c7', color: '#b45309' },
  };

  const getAfpColor = (nombre) => {
    const upper = (nombre || '').toUpperCase();
    for (const [key, estilo] of Object.entries(AFP_COLORES)) {
      if (upper.startsWith(key)) return estilo;
    }
    return { bg: isDark ? 'rgba(148,163,184,.1)' : '#f1f5f9', color: isDark ? '#94a3b8' : '#64748b' };
  };

  const limpiarNombreAfp = (nombre) => {
    return (nombre || '').replace(/-(FLUJO|MIXTA|MIXTO|MIX|FLU)/gi, '').trim().toUpperCase();
  };

  const renderCelda = (key, value) => {
    if (key === 'nombre_afp') {
      const limpio = limpiarNombreAfp(value);
      const { bg, color } = getAfpColor(limpio);
      return (
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '4px',
          fontWeight: 700,
          fontSize: '0.75rem',
          background: bg,
          color,
          whiteSpace: 'nowrap',
        }}>
          {limpio || ''}
        </span>
      );
    }
    if (key === 'excepcion_aportar' || key === 'afp') {
      return '';
    }
    if (key === 'inicio_rl' || key === 'cese_rl') {
      return (
        <span style={{
          display: 'inline-block',
          padding: '1px 8px',
          borderRadius: '4px',
          fontWeight: 700,
          background: value === 'S' ? (isDark ? 'rgba(52,211,153,.12)' : '#dcfce7') : (isDark ? 'rgba(148,163,184,.08)' : '#f1f5f9'),
          color: value === 'S' ? (isDark ? '#6ee7b7' : '#16a34a') : c.textMuted,
        }}>
          {value}
        </span>
      );
    }
    if (key === 'fecha_ingreso' || key === 'fecha_cese') {
      return <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: c.textSecondary }}>{value || '—'}</span>;
    }
    if (key === 'rem_asegurable') {
      return <span style={{ fontWeight: 600, color: '#0891b2' }}>{value}</span>;
    }
    if (key === 'secuencia') {
      return <span style={{ color: c.textMuted, fontSize: '0.8rem' }}>{value}</span>;
    }
    if (key === 'cuspp') {
      return <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#7c3aed' }}>{value || '—'}</span>;
    }
    if (key === 'numero_documento') {
      return <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{value}</span>;
    }
    return value || '—';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2><FiFileText size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />Formato AFP Net</h2>
      </div>

      {/* Controles */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={mes}
            onChange={(e) => { setMes(parseInt(e.target.value)); setCargado(false); }}
            style={{ width: 150 }}
          >
            {MESES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <input
            type="number"
            className="form-input"
            value={anio}
            onChange={(e) => { setAnio(parseInt(e.target.value)); setCargado(false); }}
            min="2020" max="2035"
            style={{ width: 90 }}
          />
          <button className="btn-primary" onClick={cargarDatos} disabled={loading}>
            {loading
              ? <><FiRefreshCw size={15} className="spin" /> Cargando...</>
              : <><FiRefreshCw size={15} /> Cargar Datos</>}
          </button>
          {cargado && datos.length > 0 && (
            <button className="btn-success" onClick={exportarExcel}>
              <FiDownload size={15} /> Exportar Excel AFP Net ({datos.length} empleados)
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading && <Loading />}

      {!loading && cargado && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.78rem',
              minWidth: 1400,
            }}>
              <thead>
                <tr style={{ background: c.tableHeaderBg, color: isDark ? '#c4ccdb' : '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                  {COLUMNAS.map(col => (
                    <th key={col.key} style={{
                      padding: '8px 10px',
                      fontWeight: 600,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      minWidth: col.width,
                      fontSize: '0.72rem',
                      letterSpacing: '0.3px',
                      borderRight: `1px solid ${c.tableBorder}`,
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNAS.length} style={{ textAlign: 'center', padding: 40, color: c.textMuted }}>
                      No hay empleados para este período
                    </td>
                  </tr>
                ) : (
                  datos.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? c.tableRowEven : c.tableRowOdd,
                        borderBottom: `1px solid ${c.borderSubtle}`,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(99,102,241,.06)' : '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? (isDark ? 'rgba(255,255,255,.015)' : '#fff') : (isDark ? 'transparent' : '#f8fafc')}
                    >
                      {COLUMNAS.map(col => (
                        <td key={col.key} style={{
                          padding: '5px 10px',
                          textAlign: ['secuencia', 'tipo_documento', 'relacion_laboral', 'inicio_rl', 'cese_rl', 'tipo_trabajo', 'afp'].includes(col.key)
                            ? 'center' : 'left',
                          whiteSpace: 'nowrap',
                          borderRight: `1px solid ${c.borderSubtle}`,
                        }}>
                          {renderCelda(col.key, row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer con total */}
          {datos.length > 0 && (
            <div style={{
              padding: '8px 16px',
              background: isDark ? 'rgba(15,22,41,.6)' : '#f8fafc',
              borderTop: `2px solid ${c.tableBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem',
              color: c.textSecondary,
            }}>
              <span>Total empleados AFP: <strong style={{ color: c.textPrimary }}>{datos.length}</strong></span>
              <span>
                Total Rem. Asegurable:{' '}
                <strong style={{ color: '#0891b2' }}>
                  S/ {datos.reduce((sum, r) => sum + parseFloat(r.rem_asegurable || 0), 0).toFixed(2)}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}

      {!loading && !cargado && (
        <div style={{ textAlign: 'center', padding: 60, color: c.textMuted }}>
          <FiFileText size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>Selecciona el mes y año, luego haz clic en <strong>Cargar Datos</strong></p>
        </div>
      )}
    </div>
  );
}

export default Formato;
