import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FiFileText, FiSearch, FiX, FiDownload, FiUsers,
  FiAlertCircle, FiCheckCircle, FiRefreshCw, FiPrinter, FiLayers, FiList
} from 'react-icons/fi';
import {
  listarBoletas, obtenerBoletaEmpleado, obtenerBoletasMasivo
} from '../services/catalogoService';
import BoletaPago from '../components/BoletaPago';
import Loading from '../components/common/Loading';
import { formatMoney, getMesNombre } from '../utils/helpers';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useThemeColors } from '../utils/darkColors';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import logoImg from '../public/img/logo_ecosermy.png';
import firmaImg from '../public/img/firma.png';

const MESES = [
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
];

const ANIOS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

function Boletas() {
  const { isDark, c } = useThemeColors();
  const hoy = new Date();
  const [mes, setMes]   = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());

  const [planilla, setPlanilla]     = useState(null);
  const [empleados, setEmpleados]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [cargado, setCargado]       = useState(false);

  const [busqueda, setBusqueda]     = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState('');

  const [modalBoleta, setModalBoleta] = useState(false);
  const [boletaData, setBoletaData]   = useState(null);
  const [loadingBoleta, setLoadingBoleta] = useState(false);

  const [exportandoMasivo, setExportandoMasivo] = useState(false);
  const [progresoMasivo, setProgresoMasivo]     = useState(0);

  const [agruparPorUnidad, setAgruparPorUnidad] = useState(false);
  const [menuExportar, setMenuExportar]         = useState(false);
  const menuExportarRef = useRef(null);

  // ─── Cargar lista de empleados para el período ───────────────────────────
  const cargarBoletas = async () => {
    setLoading(true);
    setCargado(false);
    try {
      const data = await listarBoletas(mes, anio);
      setPlanilla(data.planilla);
      setEmpleados(data.empleados || []);
      setCargado(true);
    } catch (err) {
      toast.error('Error al cargar los datos del período');
    } finally {
      setLoading(false);
    }
  };

  // ─── Ver boleta individual ────────────────────────────────────────────────
  const handleVerBoleta = async (empleado) => {
    if (!empleado.tiene_boleta) {
      toast.warning('Este empleado no tiene boleta calculada para el período seleccionado');
      return;
    }
    setLoadingBoleta(true);
    try {
      const data = await obtenerBoletaEmpleado(empleado.id, mes, anio);
      setBoletaData(data);
      setModalBoleta(true);
    } catch (err) {
      toast.error('Error al cargar la boleta');
    } finally {
      setLoadingBoleta(false);
    }
  };

  // ─── Exportar boletas masivo (con orden y filtro por unidad) ────────────
  const handleExportarMasivo = async (modo = 'alfabetico', unidadSeleccionada = null) => {
    setMenuExportar(false);
    if (!planilla) {
      toast.warning('No existe planilla calculada para este período');
      return;
    }
    const conBoletaCount = empleados.filter(e => e.tiene_boleta).length;
    if (!conBoletaCount) {
      toast.warning('No hay boletas disponibles para este período');
      return;
    }

    const labelUnidad = unidadSeleccionada ? ` de la unidad ${unidadSeleccionada}` : '';
    const labelOrden = modo === 'unidad' ? 'agrupadas por unidad' : 'en orden alfabético';
    if (!confirm(`¿Exportar boletas ${labelOrden}${labelUnidad} de ${getMesNombre(mes)} ${anio}?`)) return;

    setExportandoMasivo(true);
    setProgresoMasivo(0);

    try {
      const todasBoletas = await obtenerBoletasMasivo(mes, anio);
      if (!todasBoletas?.length) {
        toast.warning('No se obtuvieron datos de boletas');
        setExportandoMasivo(false);
        return;
      }

      // Filtrar por unidad si se seleccionó una
      let boletasFiltradas = [...todasBoletas];
      if (unidadSeleccionada) {
        boletasFiltradas = boletasFiltradas.filter(b =>
          (b.empleado?.unidad || 'SIN UNIDAD') === unidadSeleccionada
        );
        if (!boletasFiltradas.length) {
          toast.warning(`No hay boletas para la unidad "${unidadSeleccionada}"`);
          setExportandoMasivo(false);
          return;
        }
      }

      // Ordenar boletas según modo
      if (modo === 'unidad') {
        boletasFiltradas.sort((a, b) => {
          const uA = (a.empleado?.unidad || 'ZZZ').localeCompare(b.empleado?.unidad || 'ZZZ');
          if (uA !== 0) return uA;
          return (a.empleado?.apellidos || '').localeCompare(b.empleado?.apellidos || '');
        });
      } else {
        boletasFiltradas.sort((a, b) =>
          (a.empleado?.apellidos || '').localeCompare(b.empleado?.apellidos || '')
        );
      }

      setProgresoMasivo(15);

      // Precargar imágenes como base64 para jsPDF
      const cargarImagenBase64 = (src) => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d').drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });

      const [logoBase64, firmaBase64] = await Promise.all([
        cargarImagenBase64(logoImg),
        cargarImagenBase64(firmaImg),
      ]);

      setProgresoMasivo(20);

      // Generar PDF con jsPDF directamente (sin html2canvas)
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      const pageH = doc.internal.pageSize.getHeight();
      const halfH = pageH / 2;
      boletasFiltradas.forEach((boleta, idx) => {
        const pos = idx % 2; // 0 = arriba, 1 = abajo
        if (idx > 0 && pos === 0) doc.addPage();
        const bStartY = pos === 0 ? 5 : halfH + 3;
        dibujarBoletaPDF(doc, boleta, pageW, logoBase64, firmaBase64, bStartY);
        // Separador punteado entre boletas
        if (pos === 0 && idx + 1 < boletasFiltradas.length) {
          doc.setDrawColor(150, 150, 150);
          doc.setLineWidth(0.3);
          for (let dx = 7; dx < pageW - 7; dx += 5) {
            doc.line(dx, halfH, Math.min(dx + 3, pageW - 7), halfH);
          }
        }
        setProgresoMasivo(20 + Math.round(((idx + 1) / boletasFiltradas.length) * 75));
      });

      const sufijo = unidadSeleccionada
        ? `_${unidadSeleccionada.replace(/\s+/g, '_')}`
        : modo === 'unidad' ? '_PorUnidad' : '_Alfabetico';

      doc.save(`Boletas_${getMesNombre(mes)}_${anio}${sufijo}.pdf`);

      setProgresoMasivo(100);
      toast.success(`${boletasFiltradas.length} boletas exportadas correctamente`);
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar boletas masivas');
    } finally {
      setExportandoMasivo(false);
      setProgresoMasivo(0);
    }
  };

  // ─── Exportar lista de empleados a Excel ─────────────────────────────────
  const handleExportarExcel = () => {
    const datos = (agruparPorUnidad ? datosAgrupados : [{ unidad: null, empleados: filtrados }])
      .flatMap(grupo => {
        const rows = [];
        if (agruparPorUnidad && grupo.unidad) {
          rows.push({ '#': '', 'Código': `UNIDAD: ${grupo.unidad}`, 'Empleado': '', 'DNI': '', 'Cargo': '', 'Área': '', 'Unidad': '', 'Sueldo': '', 'Días': '', 'Neto a Pagar': '', 'Estado': '' });
        }
        grupo.empleados.forEach((emp, idx) => {
          rows.push({
            '#': idx + 1,
            'Código': emp.codigo_trabajador,
            'Empleado': `${emp.apellidos}, ${emp.nombres}`,
            'DNI': emp.dni,
            'Cargo': emp.cargo,
            'Área': emp.area,
            'Unidad': emp.unidad || '',
            'Sueldo': parseFloat(emp.sueldo_base || 0),
            'Días': emp.tiene_boleta ? parseFloat(emp.dias_trabajados || 0) : 0,
            'Neto a Pagar': emp.tiene_boleta ? parseFloat(emp.neto_pagar || 0) : 0,
            'Estado': emp.tiene_boleta ? 'Lista' : 'Sin boleta',
          });
        });
        return rows;
      });

    const ws = XLSX.utils.json_to_sheet(datos);
    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 5 }, { wch: 10 }, { wch: 35 }, { wch: 10 }, { wch: 20 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empleados');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `Boletas_Lista_${getMesNombre(mes)}_${anio}.xlsx`);
    toast.success('Lista exportada a Excel');
  };

  // ─── Cerrar menú exportar al hacer clic fuera ────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuExportarRef.current && !menuExportarRef.current.contains(e.target)) {
        setMenuExportar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Filtrado ─────────────────────────────────────────────────────────────
  const unidades = useMemo(() => {
    const set = new Set(empleados.map(e => e.unidad).filter(Boolean));
    return [...set].sort();
  }, [empleados]);

  const filtrados = useMemo(() => {
    let lista = empleados;
    if (unidadFiltro) lista = lista.filter(e => e.unidad === unidadFiltro);
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      lista = lista.filter(e =>
        e.apellidos?.toLowerCase().includes(term) ||
        e.nombres?.toLowerCase().includes(term) ||
        e.codigo_trabajador?.toLowerCase().includes(term) ||
        e.dni?.includes(term)
      );
    }
    return lista;
  }, [empleados, busqueda, unidadFiltro]);

  const conBoleta    = filtrados.filter(e => e.tiene_boleta).length;
  const sinBoleta    = filtrados.filter(e => !e.tiene_boleta).length;
  const totalNeto    = filtrados.filter(e => e.tiene_boleta).reduce((a, b) => a + parseFloat(b.neto_pagar || 0), 0);

  // ─── Datos agrupados por unidad ──────────────────────────────────────────
  const datosAgrupados = useMemo(() => {
    if (!agruparPorUnidad) return [{ unidad: null, empleados: filtrados }];
    const mapa = {};
    filtrados.forEach(e => {
      const key = e.unidad || 'SIN UNIDAD';
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(e);
    });
    return Object.keys(mapa).sort().map(u => ({ unidad: u, empleados: mapa[u] }));
  }, [filtrados, agruparPorUnidad]);

  // ─── Unidades con conteo de boletas (para selector de exportación) ──────
  const unidadesConBoletas = useMemo(() => {
    const mapa = {};
    empleados.filter(e => e.tiene_boleta).forEach(e => {
      const key = e.unidad || 'SIN UNIDAD';
      mapa[key] = (mapa[key] || 0) + 1;
    });
    return Object.entries(mapa).sort((a, b) => a[0].localeCompare(b[0]));
  }, [empleados]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiFileText /> Boletas de Pago
          </h1>
          <p className="page-subtitle">Gestiona y exporta las boletas del período seleccionado</p>
        </div>
      </div>

      {/* Selector de período */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label className="form-label">Mes</label>
              <select className="form-select" value={mes} onChange={e => setMes(+e.target.value)} style={{ width: 140 }}>
                {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Año</label>
              <select className="form-select" value={anio} onChange={e => setAnio(+e.target.value)} style={{ width: 100 }}>
                {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={cargarBoletas} disabled={loading}>
              <FiRefreshCw size={15} style={{ marginRight: 6, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Cargando...' : 'Cargar Boletas'}
            </button>

            {cargado && planilla && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, position: 'relative', zIndex: 100 }} ref={menuExportarRef}>
                <button
                  className="btn btn-info"
                  onClick={handleExportarExcel}
                  title="Exportar la lista de empleados a Excel"
                >
                  <FiDownload size={15} style={{ marginRight: 6 }} />
                  Exportar Lista Excel
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    className="btn btn-success"
                    onClick={() => setMenuExportar(!menuExportar)}
                    disabled={exportandoMasivo}
                  >
                    <FiPrinter size={15} style={{ marginRight: 6 }} />
                    {exportandoMasivo
                      ? `Exportando... ${progresoMasivo}%`
                      : `Exportar Boletas PDF (${empleados.filter(e => e.tiene_boleta).length})`}
                  </button>
                  {menuExportar && !exportandoMasivo && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 4,
                      background: isDark ? c.surfaceElevated : '#fff', border: `1px solid ${c.borderNormal}`, borderRadius: 8,
                      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.12)', zIndex: 9999, minWidth: 250,
                      overflow: 'hidden', maxHeight: 400, overflowY: 'auto',
                    }}>
                      {/* Sección: Todas las boletas */}
                      <div style={{ padding: '6px 14px 2px', fontSize: '0.72rem', fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Todas las boletas
                      </div>
                      <button
                        onClick={() => handleExportarMasivo('alfabetico')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                          padding: '8px 14px', border: 'none', background: 'none',
                          cursor: 'pointer', fontSize: '0.88rem', textAlign: 'left',
                          color: c.textPrimary,
                        }}
                        onMouseEnter={e => e.target.style.background = isDark ? c.surfaceSubtle : '#f1f5f9'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                      >
                        <FiList size={15} style={{ color: '#6366f1', flexShrink: 0 }} />
                        Orden Alfabético
                      </button>
                      <button
                        onClick={() => handleExportarMasivo('unidad')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                          padding: '8px 14px', border: 'none', background: 'none',
                          cursor: 'pointer', fontSize: '0.88rem', textAlign: 'left',
                          color: c.textPrimary,
                        }}
                        onMouseEnter={e => e.target.style.background = isDark ? c.surfaceSubtle : '#f1f5f9'}
                        onMouseLeave={e => e.target.style.background = 'none'}
                      >
                        <FiLayers size={15} style={{ color: '#0891b2', flexShrink: 0 }} />
                        Agrupar por Unidad
                      </button>

                      {/* Sección: Por unidad individual */}
                      {unidadesConBoletas.length > 1 && (
                        <>
                          <div style={{ borderTop: `1px solid ${c.borderSubtle}`, margin: '4px 0' }} />
                          <div style={{ padding: '6px 14px 2px', fontSize: '0.72rem', fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Por Unidad
                          </div>
                          {unidadesConBoletas.map(([unidad, count]) => (
                            <button
                              key={unidad}
                              onClick={() => handleExportarMasivo('alfabetico', unidad)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                padding: '8px 14px', border: 'none', background: 'none',
                                cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left',
                                color: c.textPrimary,
                              }}
                              onMouseEnter={e => e.target.style.background = isDark ? c.surfaceSubtle : '#f1f5f9'}
                              onMouseLeave={e => e.target.style.background = 'none'}
                            >
                              <FiUsers size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                              <span style={{ flex: 1 }}>{unidad}</span>
                              <span style={{
                                background: isDark ? 'rgba(99,102,241,.15)' : '#eef2ff',
                                color: isDark ? '#a5b4fc' : '#4f46e5',
                                padding: '1px 7px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600,
                              }}>
                                {count}
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Estado planilla */}
          {cargado && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {planilla ? (
                <span className={`badge ${planilla.estado === 'APROBADO' ? 'badge-success' : planilla.estado === 'PROCESADO' ? 'badge-info' : 'badge-warning'}`}>
                  Planilla {planilla.estado}
                </span>
              ) : (
                <span className="badge badge-warning">
                  <FiAlertCircle size={12} style={{ marginRight: 4 }} />
                  Sin planilla calculada para este período
                </span>
              )}
              {planilla && (
                <>
                  <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                    <FiCheckCircle size={13} style={{ marginRight: 4 }} />
                    {conBoleta} con boleta
                  </span>
                  {sinBoleta > 0 && (
                    <span style={{ color: '#f97316', fontWeight: 600, fontSize: '0.85rem' }}>
                      <FiAlertCircle size={13} style={{ marginRight: 4 }} />
                      {sinBoleta} sin boleta
                    </span>
                  )}
                  <span style={{ color: '#0891b2', fontWeight: 600, fontSize: '0.85rem' }}>
                    Total Neto: S/ {formatMoney(totalNeto)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de empleados */}
      {cargado && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-box" style={{ position: 'relative', flex: '1 1 220px' }}>
                <FiSearch size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} />
                <input
                  className="form-control"
                  placeholder="Buscar por nombre, código o DNI..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  style={{ paddingLeft: 34 }}
                />
                {busqueda && (
                  <button onClick={() => setBusqueda('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}>
                    <FiX size={14} />
                  </button>
                )}
              </div>
              {unidades.length > 0 && (
                <select className="form-select" value={unidadFiltro} onChange={e => setUnidadFiltro(e.target.value)} style={{ width: 160 }}>
                  <option value="">Todas las unidades</option>
                  {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              )}
              <button
                className={`btn ${agruparPorUnidad ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setAgruparPorUnidad(!agruparPorUnidad)}
                title={agruparPorUnidad ? 'Desagrupar' : 'Agrupar por unidad'}
                style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <FiLayers size={14} />
                {agruparPorUnidad ? 'Agrupado' : 'Agrupar por Unidad'}
              </button>
              <span style={{ color: c.textSecondary, fontSize: '0.85rem', marginLeft: 'auto' }}>
                <FiUsers size={13} style={{ marginRight: 4 }} />
                {filtrados.length} empleados
              </span>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <Loading />
            ) : filtrados.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: c.textMuted }}>
                <FiUsers size={40} style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                <p>No se encontraron empleados</p>
              </div>
            ) : (
              <table className="data-table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th style={{ width: 85 }}>Código</th>
                    <th>Empleado</th>
                    <th style={{ width: 80 }}>DNI</th>
                    <th style={{ width: 150 }}>Cargo</th>
                    <th style={{ width: 120 }}>Área</th>
                    <th style={{ width: 100 }}>Unidad</th>
                    <th style={{ width: 100 }}>Sueldo</th>
                    <th style={{ width: 85 }}>Días</th>
                    <th style={{ width: 120 }}>Neto a Pagar</th>
                    <th style={{ width: 80 }}>Estado</th>
                    <th style={{ width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {datosAgrupados.map((grupo) => (
                    <>
                      {agruparPorUnidad && grupo.unidad && (
                        <tr key={`group-${grupo.unidad}`} style={{ background: c.tableHeaderBg }}>
                          <td colSpan={12} style={{ padding: '8px 14px', fontWeight: 700, fontSize: '0.88rem', color: c.tableHeaderColor }}>
                            <FiLayers size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                            {grupo.unidad}
                            <span style={{ marginLeft: 10, fontWeight: 400, fontSize: '0.8rem', color: c.textMuted }}>
                              ({grupo.empleados.length} empleados — Neto: S/ {formatMoney(grupo.empleados.filter(e => e.tiene_boleta).reduce((a, b) => a + parseFloat(b.neto_pagar || 0), 0))})
                            </span>
                          </td>
                        </tr>
                      )}
                      {grupo.empleados.map((emp, idx) => (
                        <tr
                          key={emp.id}
                          style={{
                            background: !emp.tiene_boleta ? (isDark ? 'rgba(251,146,60,.07)' : '#fff7ed') : idx % 2 === 0 ? c.tableRowEven : c.tableRowOdd,
                            opacity: !emp.tiene_boleta ? 0.7 : 1,
                          }}
                        >
                          <td style={{ textAlign: 'center', color: c.textMuted, fontSize: '0.8rem' }}>{idx + 1}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', background: isDark ? 'rgba(148,163,184,.08)' : '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: '0.82rem' }}>
                              {emp.codigo_trabajador}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp.apellidos}, {emp.nombres}</div>
                            <div style={{ fontSize: '0.75rem', color: c.textMuted }}>{emp.sistema_pensiones}</div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{emp.dni}</td>
                          <td style={{ fontSize: '0.85rem' }}>{emp.cargo}</td>
                          <td style={{ fontSize: '0.85rem' }}>{emp.area}</td>
                          <td>
                            {emp.unidad && (
                              <span style={{ background: isDark ? 'rgba(56,189,248,.12)' : '#e0f2fe', color: isDark ? '#7dd3fc' : '#0369a1', padding: '2px 7px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600 }}>
                                {emp.unidad}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#0891b2' }}>
                            S/ {formatMoney(emp.sueldo_base)}
                          </td>
                          <td style={{ textAlign: 'center', color: '#6366f1', fontWeight: 600 }}>
                            {emp.tiene_boleta ? Number(emp.dias_trabajados || 0).toFixed(1) : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: emp.tiene_boleta ? '#059669' : c.textMuted }}>
                            {emp.tiene_boleta ? `S/ ${formatMoney(emp.neto_pagar)}` : '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {emp.tiene_boleta ? (
                              <span style={{ background: isDark ? 'rgba(52,211,153,.12)' : '#dcfce7', color: isDark ? '#6ee7b7' : '#16a34a', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <FiCheckCircle size={11} /> Lista
                              </span>
                            ) : (
                              <span style={{ background: isDark ? 'rgba(251,191,36,.12)' : '#fef3c7', color: isDark ? '#fde68a' : '#d97706', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <FiAlertCircle size={11} /> Sin boleta
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button
                                className="btn-sm btn-info"
                                onClick={() => handleVerBoleta(emp)}
                                disabled={!emp.tiene_boleta || loadingBoleta}
                                title={emp.tiene_boleta ? 'Ver boleta' : 'Sin boleta calculada'}
                                style={{ opacity: emp.tiene_boleta ? 1 : 0.4, cursor: emp.tiene_boleta ? 'pointer' : 'not-allowed' }}
                              >
                                <FiFileText size={13} /> Ver
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
                {filtrados.filter(e => e.tiene_boleta).length > 0 && (
                  <tfoot>
                    <tr style={{ background: c.tableHeaderBg, color: c.tableHeaderColor, fontWeight: 700 }}>
                      <td colSpan={9} style={{ textAlign: 'right', padding: '10px 12px' }}>
                        TOTAL NETO A PAGAR:
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: '#34d399', fontSize: '1rem' }}>
                        S/ {formatMoney(filtrados.filter(e => e.tiene_boleta).reduce((a, b) => a + parseFloat(b.neto_pagar || 0), 0))}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>
      )}

      {/* Mensaje inicial */}
      {!cargado && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: c.textMuted }}>
          <FiFileText size={56} style={{ marginBottom: 16, display: 'block', margin: '0 auto 16px', opacity: 0.4 }} />
          <h3 style={{ fontWeight: 600, marginBottom: 8, color: c.textSecondary }}>
            Selecciona un período y presiona "Cargar Boletas"
          </h3>
          <p style={{ fontSize: '0.9rem' }}>Podrás ver y exportar las boletas de todos los empleados</p>
        </div>
      )}

      {/* Modal Boleta */}
      {modalBoleta && boletaData && (
        <BoletaPago
          data={boletaData}
          onClose={() => { setModalBoleta(false); setBoletaData(null); }}
        />
      )}
    </div>
  );
}

// ─── Helper: dibujar boleta con jsPDF replicando diseño BoletaCopia ───────
function dibujarBoletaPDF(doc, data, pageW, logoBase64, firmaBase64, startY = 5) {
  const { empleado, periodo, ingresos, descuentos, aportes_empleador, resumen, asistencia } = data;
  const fmt = (v) => (parseFloat(v) || 0).toFixed(2);
  const mx = 7;
  const W = pageW - mx * 2;
  const brd = [0, 0, 0]; // negro para bordes

  const getMonto = (lista, nombre) => {
    if (!lista || !nombre) return '';
    const n = nombre.toUpperCase().trim();
    let item = lista.find(i => (i.concepto || '').toUpperCase().trim() === n);
    if (!item) {
      const palabras = n.split(' ').filter(p => p.length > 3).slice(0, 2);
      item = lista.find(i => i.concepto && palabras.every(p => i.concepto.toUpperCase().includes(p)));
    }
    return item ? fmt(item.monto) : '';
  };

  // Helpers para dibujar celdas tipo tabla
  const setB = () => { doc.setDrawColor(...brd); doc.setLineWidth(0.2); };
  const cellRect = (x, yy, w, h, fill) => {
    if (fill) { doc.setFillColor(...fill); doc.rect(x, yy, w, h, 'F'); }
    setB(); doc.rect(x, yy, w, h, 'S');
  };
  const headerCell = (x, yy, w, h, txt) => {
    doc.setFillColor(180, 198, 231);
    doc.rect(x, yy, w, h, 'F');
    setB(); doc.rect(x, yy, w, h, 'S');
    doc.setFontSize(5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
    doc.text(txt, x + w / 2, yy + h / 2 + 1.0, { align: 'center' });
  };
  const valCell = (x, yy, w, h, txt, align = 'center') => {
    cellRect(x, yy, w, h, [255, 255, 255]);
    doc.setFontSize(5.2); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
    const px = align === 'center' ? x + w / 2 : align === 'right' ? x + w - 1.5 : x + 1.5;
    doc.text(String(txt || '-'), px, yy + h / 2 + 1.0, { align });
  };
  const sectionHeader = (x, yy, w, h, txt) => {
    doc.setFillColor(180, 198, 231);
    doc.rect(x, yy, w, h, 'F');
    setB(); doc.rect(x, yy, w, h, 'S');
    doc.setFontSize(5.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
    doc.text(txt, x + 2, yy + h / 2 + 1.0);
  };

  let y = startY;
  const rH = 3.8; // row height compacto (2 boletas por página)

  // ═══════════════════════════════════════════════════════════════════════
  // 1. ENCABEZADO: BOLETA DE PAGO + LOGO
  // ═══════════════════════════════════════════════════════════════════════
  const headerH = 10;
  cellRect(mx, y, W, headerH);
  // Texto centrado en el área del título (70% izquierda)
  const titleCenterX = mx + (W * 0.70) / 2;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
  doc.text('BOLETA DE PAGO', titleCenterX, y + 3.5, { align: 'center' });
  doc.setFontSize(5); doc.setFont('helvetica', 'bold');
  doc.text('ART. 19 DEL DECRETO SUPREMO N° 001-98-TR DEL 22-01-98', titleCenterX, y + 6, { align: 'center' });
  doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  const periodoTxt = (periodo?.texto || '').toUpperCase();
  doc.text(periodoTxt, titleCenterX, y + 8.5, { align: 'center' });
  // Subrayar periodo
  const periodoW = doc.getTextWidth(periodoTxt);
  doc.setLineWidth(0.3); doc.setDrawColor(0, 0, 0);
  doc.line(titleCenterX - periodoW / 2, y + 9, titleCenterX + periodoW / 2, y + 9);
  // Logo derecha
  if (logoBase64) {
    try { doc.addImage(logoBase64, 'PNG', mx + W - 30, y + 0.5, 28, 9); } catch (e) { /* logo fail */ }
  }
  y += headerH;

  // ═══════════════════════════════════════════════════════════════════════
  // 2. DATOS DE LA EMPRESA
  // ═══════════════════════════════════════════════════════════════════════
  sectionHeader(mx, y, W, rH, 'DATOS DE LA EMPRESA:');
  y += rH;
  const empCols = [W * 0.15, W * 0.45, W * 0.40];
  // Labels
  headerCell(mx, y, empCols[0], rH, 'RUC');
  headerCell(mx + empCols[0], y, empCols[1], rH, 'RAZON SOCIAL');
  headerCell(mx + empCols[0] + empCols[1], y, empCols[2], rH, 'DIRECCIÓN');
  y += rH;
  // Values
  valCell(mx, y, empCols[0], rH, '20516385813');
  valCell(mx + empCols[0], y, empCols[1], rH, 'EMPRESA COMUNAL DE SERVICIOS MULTIPLES YAULI');
  valCell(mx + empCols[0] + empCols[1], y, empCols[2], rH, 'AV. LADISLAO ESPINAR S/N YAULI - YAULI - JUNIN');
  y += rH;

  // ═══════════════════════════════════════════════════════════════════════
  // 3. DATOS DEL TRABAJADOR
  // ═══════════════════════════════════════════════════════════════════════
  sectionHeader(mx, y, W, rH, 'DATOS DEL TRABAJADOR:');
  y += rH;
  const tc = [W * 0.10, W * 0.13, W * 0.13, W * 0.08, W * 0.07, W * 0.49];
  headerCell(mx, y, tc[0], rH, 'CÓDIGO');
  headerCell(mx + tc[0], y, tc[1], rH, 'NOMBRES');
  headerCell(mx + tc[0] + tc[1], y, tc[2], rH, 'APELLIDOS');
  headerCell(mx + tc[0] + tc[1] + tc[2], y, tc[3], rH, 'D.N.I.');
  headerCell(mx + tc[0] + tc[1] + tc[2] + tc[3], y, tc[4], rH, 'SITUACION');
  headerCell(mx + tc[0] + tc[1] + tc[2] + tc[3] + tc[4], y, tc[5], rH, 'DIRECCIÓN');
  y += rH;
  valCell(mx, y, tc[0], rH, empleado?.codigo);
  valCell(mx + tc[0], y, tc[1], rH, empleado?.nombres);
  valCell(mx + tc[0] + tc[1], y, tc[2], rH, empleado?.apellidos);
  valCell(mx + tc[0] + tc[1] + tc[2], y, tc[3], rH, empleado?.dni);
  valCell(mx + tc[0] + tc[1] + tc[2] + tc[3], y, tc[4], rH, empleado?.situacion || 'VIGENTE');
  valCell(mx + tc[0] + tc[1] + tc[2] + tc[3] + tc[4], y, tc[5], rH, empleado?.direccion || '-');
  y += rH;

  // ═══════════════════════════════════════════════════════════════════════
  // 4. DATOS VINCULADOS A LA RELACION LABORAL
  // ═══════════════════════════════════════════════════════════════════════
  sectionHeader(mx, y, W, rH, 'DATOS DEL TRABAJADOR VINCULADOS A LA RELACION LABORAL:');
  y += rH;
  const rl = [W * 0.30, W * 0.12, W * 0.11, W * 0.17, W * 0.17, W * 0.13];
  headerCell(mx, y, rl[0], rH, 'CARGO');
  headerCell(mx + rl[0], y, rl[1], rH, 'CATEGORIA');
  headerCell(mx + rl[0] + rl[1], y, rl[2], rH, 'SUELDO');
  headerCell(mx + rl[0] + rl[1] + rl[2], y, rl[3], rH, 'REGIMEN PENSIONARIO');
  headerCell(mx + rl[0] + rl[1] + rl[2] + rl[3], y, rl[4], rH, 'C.U.S.P.P.');
  headerCell(mx + rl[0] + rl[1] + rl[2] + rl[3] + rl[4], y, rl[5], rH, 'FECHA DE INGRESO');
  y += rH;
  valCell(mx, y, rl[0], rH, empleado?.cargo);
  valCell(mx + rl[0], y, rl[1], rH, empleado?.categoria || '-');
  valCell(mx + rl[0] + rl[1], y, rl[2], rH, fmt(empleado?.sueldo_base));
  valCell(mx + rl[0] + rl[1] + rl[2], y, rl[3], rH, empleado?.sistema_pensiones || '-');
  valCell(mx + rl[0] + rl[1] + rl[2] + rl[3], y, rl[4], rH, empleado?.cuspp || '-');
  valCell(mx + rl[0] + rl[1] + rl[2] + rl[3] + rl[4], y, rl[5], rH, empleado?.fecha_ingreso || '-');
  y += rH;

  // ═══════════════════════════════════════════════════════════════════════
  // 5. DÍAS + BANCO (lado a lado)
  // ═══════════════════════════════════════════════════════════════════════
  const leftW = W * 0.72;
  const rightW = W * 0.28;
  const rightX = mx + leftW;
  const bloqueY = y;

  // -- Izquierda: Días laborados
  const dc = [leftW * 0.20, leftW * 0.20, leftW * 0.20, leftW * 0.24, leftW * 0.16];
  headerCell(mx, y, dc[0], rH, 'DIAS LABORADOS');
  headerCell(mx + dc[0], y, dc[1], rH, 'DIAS NO LABORADOS');
  headerCell(mx + dc[0] + dc[1], y, dc[2], rH, 'DIAS SUBSIDIADOS');
  headerCell(mx + dc[0] + dc[1] + dc[2], y, dc[3], rH, 'JORNADA ORDINARIA');
  headerCell(mx + dc[0] + dc[1] + dc[2] + dc[3], y, dc[4], rH, 'CONDICION');
  y += rH;
  valCell(mx, y, dc[0], rH, asistencia?.dias_trabajados ?? '-');
  valCell(mx + dc[0], y, dc[1], rH, Math.round(asistencia?.dias_no_laborados ?? 0));
  valCell(mx + dc[0] + dc[1], y, dc[2], rH, '-');
  valCell(mx + dc[0] + dc[1] + dc[2], y, dc[3], rH, '48 H');
  valCell(mx + dc[0] + dc[1] + dc[2] + dc[3], y, dc[4], rH, 'Domiciliado');
  y += rH;

  // Motivo de suspensión
  sectionHeader(mx, y, leftW, 3, 'Motivo de Suspensión de Labores');
  y += 3;
  const sc = [leftW * 0.35, leftW * 0.40, leftW * 0.25];
  headerCell(mx, y, sc[0], rH, 'TIPO');
  headerCell(mx + sc[0], y, sc[1], rH, 'MOTIVO');
  headerCell(mx + sc[0] + sc[1], y, sc[2], rH, 'N° DIAS');
  y += rH;
  valCell(mx, y, sc[0], rH, '-'); valCell(mx + sc[0], y, sc[1], rH, '-'); valCell(mx + sc[0] + sc[1], y, sc[2], rH, '-');
  y += rH;
  valCell(mx, y, sc[0], rH, '-'); valCell(mx + sc[0], y, sc[1], rH, '-'); valCell(mx + sc[0] + sc[1], y, sc[2], rH, '-');
  y += rH;

  // -- Derecha: Datos bancarios (alineado al bloque izquierdo)
  let ry = bloqueY;
  headerCell(rightX, ry, rightW, rH, 'CTA AHORRO DE DEPÓSITO');
  ry += rH;
  valCell(rightX, ry, rightW, rH, empleado?.cuenta_bancaria || '-');
  ry += rH;
  headerCell(rightX, ry, rightW, rH, 'ENTIDAD BANCARIA');
  ry += rH;
  valCell(rightX, ry, rightW, rH, empleado?.banco || '-');
  ry += rH;
  headerCell(rightX, ry, rightW, rH, 'UNIDAD DE TRABAJO');
  ry += rH;
  valCell(rightX, ry, rightW, rH, empleado?.unidad || empleado?.area || '-');

  // ═══════════════════════════════════════════════════════════════════════
  // 6. CUADRO PRINCIPAL: REMUNERACIONES | DESCUENTOS | APORTES
  // ═══════════════════════════════════════════════════════════════════════
  const conceptosIng = [
    'REMUNERACIÓN O JORNAL BÁSICO', 'REMUNERACIÓN VACACIONAL', 'VACACIONES PAGADAS',
    'ASIGNACIÓN FAMILIAR', 'TRABAJO DÍA FERIADO', 'TRABAJO DÍAS LIBRES',
    'TRABAJO MEDIO DÍA', 'HORAS EXTRAS', 'BONO REGULAR',
    'BONO POR PRODUCTIVIDAD', 'ALIMENTACION', 'MOVILIDAD',
  ];
  const conceptosDesc = [
    'RENTA QUINTA CATEGORÍA RETENCIONES', 'SISTEMA NAC. DE PENSIONES DL 19990',
    'COMISIÓN AFP PORCENTUAL', 'SPP - APORTACIÓN OBLIGATORIA', 'SEGURO',
    'DÍAS NO TRABAJADOS', 'FALTAS', 'SUSPENSIONES', 'OTROS DESCUENTOS',
  ];
  const conceptosApo = [
    'PÓLIZA DE SEGURO - D. LEG. 688', 'ESSALUD (REGULAR) TRAB',
    'SCTR SALUD', 'SCTR PENSIÓN', 'VIDA LEY',
  ];
  const NFILAS = 13;
  // Ancho de cada sección: concepto + monto
  const sec1 = W * 0.245; const mon1 = W * 0.088;
  const sec2 = W * 0.245; const mon2 = W * 0.088;
  const sec3 = W * 0.245; const mon3 = W * 0.088;
  // Posiciones X
  const x1 = mx;
  const x1m = x1 + sec1;
  const x2 = x1m + mon1;
  const x2m = x2 + sec2;
  const x3 = x2m + mon2;
  const x3m = x3 + sec3;

  y += 0.5;

  // Header 3 columnas
  const hdrH = 4;
  doc.setFillColor(180, 198, 231);
  doc.rect(mx, y, W, hdrH, 'F');
  setB(); doc.rect(mx, y, W, hdrH, 'S');
  doc.setFontSize(5.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
  doc.text('REMUNERACIONES', x1 + (sec1 + mon1) / 2, y + 2.6, { align: 'center' });
  doc.text('RETENCIONES / DESCUENTOS', x2 + (sec2 + mon2) / 2, y + 2.6, { align: 'center' });
  doc.text('APORTACIONES DEL EMPLEADOR', x3 + (sec3 + mon3) / 2, y + 2.6, { align: 'center' });
  // Divisores verticales header
  doc.line(x2, y, x2, y + hdrH);
  doc.line(x3, y, x3, y + hdrH);
  y += hdrH;

  const rowH = 3;
  const conceptBlockY = y; // guardar inicio del bloque de conceptos
  for (let i = 0; i < NFILAS; i++) {
    const ingN = i < conceptosIng.length ? conceptosIng[i] : (i === 12 ? '-' : '');
    const descN = i < conceptosDesc.length ? conceptosDesc[i] : '';
    const apoN = i < conceptosApo.length ? conceptosApo[i] : '';

    // Sin bordes horizontales entre filas - solo líneas verticales
    setB();
    doc.line(mx, y, mx, y + rowH);           // borde izquierdo
    doc.line(mx + W, y, mx + W, y + rowH);   // borde derecho
    doc.line(x1m, y, x1m, y + rowH);
    doc.line(x2, y, x2, y + rowH);
    doc.line(x2m, y, x2m, y + rowH);
    doc.line(x3, y, x3, y + rowH);
    doc.line(x3m, y, x3m, y + rowH);

    doc.setFontSize(4.3); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);

    // Ingresos
    if (ingN && ingN !== '-') {
      doc.text(ingN, x1 + 1, y + 2.1);
      const v = getMonto(ingresos, ingN);
      if (v) doc.text(v, x1m + mon1 - 1.5, y + 2.1, { align: 'right' });
    }
    // Descuentos
    if (descN) {
      doc.text(descN, x2 + 1, y + 2.1);
      const v = getMonto(descuentos, descN);
      if (v) doc.text(v, x2m + mon2 - 1.5, y + 2.1, { align: 'right' });
    }
    // Aportes
    if (apoN) {
      doc.text(apoN, x3 + 1, y + 2.1);
      const v = getMonto(aportes_empleador, apoN);
      if (v) doc.text(v, x3m + mon3 - 1.5, y + 2.1, { align: 'right' });
    }
    y += rowH;
  }

  // ── FILA DE TOTALES ─────────────────────────────────────────────
  const totH = 4;
  doc.setFillColor(180, 198, 231);
  doc.rect(mx, y, W, totH, 'F');
  setB(); doc.rect(mx, y, W, totH, 'S');
  doc.line(x1m, y, x1m, y + totH);
  doc.line(x2, y, x2, y + totH);
  doc.line(x2m, y, x2m, y + totH);
  doc.line(x3, y, x3, y + totH);
  doc.line(x3m, y, x3m, y + totH);

  doc.setFontSize(4.5); doc.setFont('helvetica', 'bolditalic'); doc.setTextColor(0, 0, 0);
  doc.text('Total Remuneraciones', x1 + 1, y + 2.7);
  doc.setFontSize(6); doc.setFont('helvetica', 'bold');
  doc.text(fmt(resumen?.total_ingresos), x1m + mon1 - 1.5, y + 2.7, { align: 'right' });
  doc.setFontSize(4.5); doc.setFont('helvetica', 'bolditalic');
  doc.text('Total Descuentos', x2 + 1, y + 2.7);
  doc.setFontSize(6); doc.setFont('helvetica', 'bold');
  doc.text(fmt(resumen?.total_descuentos), x2m + mon2 - 1.5, y + 2.7, { align: 'right' });
  doc.setFontSize(4.5); doc.setFont('helvetica', 'bolditalic');
  doc.text('Neto a Pagar', x3 + 1, y + 2.7);
  doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${fmt(resumen?.neto_pagar)}`, x3m + mon3 - 1.5, y + 2.8, { align: 'right' });
  y += totH;

  y += 12;

  // ═══════════════════════════════════════════════════════════════════════
  // 7. FIRMAS
  // ═══════════════════════════════════════════════════════════════════════
  const firmaW = 50;
  const firmaXLeft = mx + W * 0.15;
  const firmaXRight = mx + W * 0.65;

  // Firma imagen (empleador)
  if (firmaBase64) {
    try { doc.addImage(firmaBase64, 'PNG', firmaXLeft + 0, y - 16, 42, 23); } catch (e) { /* firma fail */ }
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(firmaXLeft, y, firmaXLeft + firmaW, y);
  doc.line(firmaXRight, y, firmaXRight + firmaW, y);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLEADOR', firmaXLeft + firmaW / 2, y + 4, { align: 'center' });
  doc.text('TRABAJADOR', firmaXRight + firmaW / 2, y + 4, { align: 'center' });
}

export default Boletas;
