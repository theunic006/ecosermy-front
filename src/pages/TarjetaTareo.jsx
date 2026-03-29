import { useState, useEffect, useMemo } from 'react';
import {
  FiSearch, FiX, FiDownload, FiFileText,
  FiUsers, FiCheckSquare, FiSquare, FiCalendar
} from 'react-icons/fi';
import { getEmpleados } from '../services/empleadoService';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';
import { MESES } from '../utils/constants';
import { jsPDF } from 'jspdf';
import Loading from '../components/common/Loading';
import logoImg from '../public/img/logo_ecosermy.png';

const ANIOS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

// ─── Helper: cargar imagen como base64 ────────────────────────────────────────
function cargarImg(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ─── Helper: obtener nombre de cargo / area ────────────────────────────────────
const getNombre = (field) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.nombre || '';
};

// ─── Dibujar una tarjeta en el documento ──────────────────────────────────────
function dibujarTarjeta(doc, emp, mes, anio, logo, startY = 7) {
  const pageW = 148; // A5 width
  const mx = 7;
  const W = pageW - mx * 2; // 134mm

  const BLUE   = [26, 71, 150];
  const LBLUE  = [197, 217, 241];
  const WHITE  = [255, 255, 255];
  const BLACK  = [0, 0, 0];

  const setS = () => { doc.setDrawColor(...BLUE); doc.setLineWidth(0.25); };

  let y = startY;

  // ═══════════════════════════════════════════════════════
  // 1. ENCABEZADO
  // ═══════════════════════════════════════════════════════
  const hH    = 19;   // altura total del header
  const logoW = 34;   // caja logo
  const codeW = 25;   // caja código derecha
  const midW  = W - logoW - codeW; // 75mm

  // Caja exterior
  setS();
  doc.rect(mx, y, W, hH, 'S');
  // Divisores verticales
  doc.line(mx + logoW, y, mx + logoW, y + hH);
  doc.line(mx + logoW + midW, y, mx + logoW + midW, y + hH);

  // -- Logo (izquierda)
  if (logo) {
    try { doc.addImage(logo, 'PNG', mx + 1, y + 0.5, logoW - 2, 11.5); } catch {}
  }
  doc.setFontSize(4.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE);
  doc.text('SISTEMA DE GESTIÓN', mx + logoW / 2, y + 15.2, { align: 'center' });
  doc.text('DE CALIDAD', mx + logoW / 2, y + 17.8, { align: 'center' });

  // -- Centro: barra azul "REGISTRO"
  const midX = mx + logoW;
  const regH = 10;
  doc.setFillColor(...BLUE);
  doc.rect(midX, y, midW, regH, 'F');
  setS();
  doc.line(midX, y + regH, midX + midW, y + regH);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
  doc.text('REGISTRO', midX + midW / 2, y + 7.5, { align: 'center' });

  // -- Centro: subtítulo "TARJETA DE CONTROL DE ASISTENCIA"
  const subH = hH - regH;
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLUE);
  doc.text('TARJETA DE CONTROL DE ASISTENCIA', midX + midW / 2, y + regH + subH / 2 + 2, { align: 'center' });

  // -- Derecha: tabla código / revisión / aprobado / página
  const codeX = mx + logoW + midW;
  const codeItems = [
    ['Código',   'ADM-RG-004'],
    ['Revisión', '0'],
    ['Aprobado', 'Alta Dirección'],
    ['Página',   '1-1'],
  ];
  const crH  = hH / 4;
  const clW  = codeW * 0.44;
  const cvW  = codeW - clW;
  codeItems.forEach(([lbl, val], i) => {
    const cy = y + i * crH;
    doc.setFillColor(...LBLUE); doc.rect(codeX, cy, clW, crH, 'F');
    setS();
    doc.rect(codeX, cy, clW, crH, 'S');
    doc.rect(codeX + clW, cy, cvW, crH, 'S');
    doc.setFontSize(3.8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLACK);
    doc.text(lbl, codeX + clW / 2, cy + crH / 2 + 0.8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(val, codeX + clW + cvW / 2, cy + crH / 2 + 0.8, { align: 'center' });
  });

  y += hH + 1.5;

  // ═══════════════════════════════════════════════════════
  // 2. DATOS DEL EMPLEADO
  // ═══════════════════════════════════════════════════════
  const fH = 5.5;
  setS();

  // Fila 1: APELLIDOS Y NOMBRES | DNI
  const nomW = W * 0.70;
  const dniW = W - nomW;
  doc.rect(mx, y, nomW, fH, 'S');
  doc.rect(mx + nomW, y, dniW, fH, 'S');
  doc.setFontSize(5.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLACK);
  doc.text('APELLIDOS Y NOMBRES:', mx + 1.5, y + fH / 2 + 1);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${emp.apellidos || ''}, ${emp.nombres || ''}`,
    mx + 42, y + fH / 2 + 1,
    { maxWidth: nomW - 44 }
  );
  doc.setFont('helvetica', 'bold');
  doc.text('DNI N°:', mx + nomW + 1.5, y + fH / 2 + 1);
  doc.setFont('helvetica', 'normal');
  doc.text(emp.dni || '', mx + nomW + 13, y + fH / 2 + 1);
  y += fH;

  // Fila 2: CARGO | ÁREA DE TRABAJO
  const cargoW = W * 0.50;
  const areaW  = W - cargoW;
  doc.rect(mx, y, cargoW, fH, 'S');
  doc.rect(mx + cargoW, y, areaW, fH, 'S');
  doc.setFont('helvetica', 'bold');
  doc.text('CARGO:', mx + 1.5, y + fH / 2 + 1);
  doc.setFont('helvetica', 'normal');
  doc.text(getNombre(emp.cargo), mx + 14, y + fH / 2 + 1, { maxWidth: cargoW - 16 });
  doc.setFont('helvetica', 'bold');
  doc.text('ÁREA DE TRABAJO:', mx + cargoW + 1.5, y + fH / 2 + 1);
  doc.setFont('helvetica', 'normal');
  doc.text(getNombre(emp.area), mx + cargoW + 30, y + fH / 2 + 1, { maxWidth: areaW - 32 });
  y += fH;

  // Fila 3: UNIDAD DE TRABAJO | MES | AÑO
  const uniW  = W * 0.47;
  const mesW  = W * 0.30;
  const anioW = W - uniW - mesW;
  doc.rect(mx, y, uniW, fH, 'S');
  doc.rect(mx + uniW, y, mesW, fH, 'S');
  doc.rect(mx + uniW + mesW, y, anioW, fH, 'S');
  doc.setFont('helvetica', 'bold');
  doc.text('UNIDAD DE TRABAJO:', mx + 1.5, y + fH / 2 + 1);
  doc.setFont('helvetica', 'normal');
  doc.text(emp.unidad || '', mx + 34, y + fH / 2 + 1, { maxWidth: uniW - 36 });
  doc.setFont('helvetica', 'bold');
  doc.text('MES:', mx + uniW + 1.5, y + fH / 2 + 1);
  doc.setFont('helvetica', 'normal');
  doc.text(MESES[mes - 1] || '', mx + uniW + 11, y + fH / 2 + 1);
  doc.setFont('helvetica', 'bold');
  doc.text('AÑO:', mx + uniW + mesW + 1.5, y + fH / 2 + 1);
  doc.setFont('helvetica', 'normal');
  doc.text(String(anio), mx + uniW + mesW + 11, y + fH / 2 + 1);
  y += fH + 1;

  // ═══════════════════════════════════════════════════════
  // 3. TABLA PRINCIPAL DE ASISTENCIA
  // ═══════════════════════════════════════════════════════
  // Anchos de columnas (suman 134mm = W)
  // [ITEM, H.INGRESO, FIRMA1, ALM.SALIDA, ALM.ENTRADA, H.SALIDA, FIRMA2, H.EXTRA, TURNO, VB]
  const cW = [8, 19, 12, 12, 12, 19, 12, 13, 9, 18];

  // Posiciones X de cada columna
  let cx = mx;
  const cX = cW.map(w => { const x = cx; cx += w; return x; });

  const h1H = 4.2;  // fila 1 de encabezado
  const h2H = 3.5;  // fila 2 de encabezado (sub: SALIDA/ENTRADA)
  const rH  = 3.8;  // altura de fila de datos

  // Función para dibujar celda de encabezado (azul)
  const hCell = (x, yy, w, h, txt, sz = 4) => {
    doc.setFillColor(...BLUE);
    doc.rect(x, yy, w, h, 'F');
    setS();
    doc.rect(x, yy, w, h, 'S');
    doc.setFontSize(sz);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    const lines = doc.splitTextToSize(txt, w - 0.5);
    const lh = sz * 0.38;
    const ty = yy + h / 2 - (lines.length * lh) / 2 + lh;
    lines.forEach((l, li) => doc.text(l, x + w / 2, ty + li * lh * 1.2, { align: 'center' }));
  };

  // ─── Fila 1 de encabezado ────────────────────────────
  hCell(cX[0], y, cW[0],           h1H + h2H, 'ITEM',           4.5); // ITEM – 2 filas
  hCell(cX[1], y, cW[1],           h1H + h2H, 'HORA DE\nINGRESO', 4); // HORA INGRESO – 2 filas
  hCell(cX[2], y, cW[2],           h1H + h2H, 'FIRMA',           4.5); // FIRMA – 2 filas
  hCell(cX[3], y, cW[3] + cW[4],  h1H,        'HORA DE ALMUERZO', 4); // ALMUERZO – 1 fila, 2 cols
  hCell(cX[5], y, cW[5],           h1H + h2H, 'HORA\nSALIDA',    4);  // HORA SALIDA – 2 filas
  hCell(cX[6], y, cW[6],           h1H + h2H, 'FIRMA',           4.5); // FIRMA – 2 filas
  hCell(cX[7], y, cW[7],           h1H + h2H, 'HORA\nEXTRA',     4);  // HORA EXTRA – 2 filas
  hCell(cX[8], y, cW[8],           h1H + h2H, 'TURNO',           4.5); // TURNO – 2 filas
  hCell(cX[9], y, cW[9],           h1H + h2H, 'Vº Bº\nSUPERVISOR', 4); // VB – 2 filas

  // ─── Fila 2 de encabezado (sub ALMUERZO) ─────────────
  hCell(cX[3], y + h1H, cW[3], h2H, 'SALIDA',  4);
  hCell(cX[4], y + h1H, cW[4], h2H, 'ENTRADA', 4);
  y += h1H + h2H;

  // ─── 31 filas de datos ───────────────────────────────
  for (let i = 1; i <= 31; i++) {
    const fill = i % 2 === 0 ? [242, 246, 255] : WHITE;
    doc.setFillColor(...fill);
    doc.rect(mx, y, W, rH, 'F');
    setS();
    doc.rect(mx, y, W, rH, 'S');
    // Líneas verticales internas
    cX.forEach((x, ci) => { if (ci > 0) doc.line(x, y, x, y + rH); });
    // Número de ítem
    doc.setFontSize(4.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLACK);
    doc.text(String(i), cX[0] + cW[0] / 2, y + rH / 2 + 1, { align: 'center' });
    y += rH;
  }

  y += 2;

  // ═══════════════════════════════════════════════════════
  // 4. LEYENDA
  // ═══════════════════════════════════════════════════════
  doc.setFontSize(4.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BLACK);
  doc.text('LEYENDA:', mx, y + 3.5);
  doc.setFont('helvetica', 'normal');
  const leyLabels = [
    ['L : DIAS LIBRES',    'P : PERMISO',    'LP : PATERNIDAD'],
    ['DM : DESCANSO MÉDICO', 'F : FALTA',    'R : RETIRO'],
    ['V : VACACIONES',     'S : SUSPENSIÓN', ''],
  ];
  leyLabels.forEach((row, ri) => {
    row.forEach((item, ci) => {
      if (item) doc.text(item, mx + 17 + ci * 40, y + 1.5 + ri * 3.5);
    });
  });
}

// ─── Función principal que genera el PDF ──────────────────────────────────────
function generarPDF(empList, mes, anio, logo) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  empList.forEach((emp, idx) => {
    if (idx > 0) doc.addPage();
    dibujarTarjeta(doc, emp, mes, anio, logo, 7);
  });
  const mesNombre = MESES[mes - 1] || '';
  if (empList.length === 1) {
    doc.save(`Tarjeta_Asistencia_${empList[0].apellidos}_${mesNombre}_${anio}.pdf`);
  } else {
    doc.save(`Tarjetas_Asistencia_${mesNombre}_${anio}.pdf`);
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────
function TarjetaTareo() {
  const { isDark, c } = useThemeColors();
  const hoy = new Date();

  const [mes, setMes]       = useState(hoy.getMonth() + 1);
  const [anio, setAnio]     = useState(hoy.getFullYear());
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [generando, setGenerando] = useState(false);
  const [busqueda, setBusqueda]   = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState('');
  const [seleccionados, setSeleccionados] = useState(new Set());

  // Cargar empleados al montar
  useEffect(() => {
    getEmpleados()
      .then(data => setEmpleados((data || []).filter(e => e.situacion_contractual !== 'CESADO')))
      .catch(() => toast.error('Error al cargar empleados'))
      .finally(() => setLoading(false));
  }, []);

  // Unidades únicas para el filtro
  const unidades = useMemo(() => {
    const set = new Set(empleados.map(e => e.unidad).filter(Boolean));
    return [...set].sort();
  }, [empleados]);

  // Lista filtrada
  const filtrados = useMemo(() => {
    let lista = empleados;
    if (unidadFiltro) lista = lista.filter(e => e.unidad === unidadFiltro);
    if (busqueda.trim()) {
      const t = busqueda.toLowerCase();
      lista = lista.filter(e =>
        e.apellidos?.toLowerCase().includes(t) ||
        e.nombres?.toLowerCase().includes(t) ||
        e.codigo_trabajador?.toLowerCase().includes(t) ||
        e.dni?.includes(t)
      );
    }
    return lista;
  }, [empleados, busqueda, unidadFiltro]);

  // Selección individual
  const toggleSel = (id) => {
    setSeleccionados(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Seleccionar / deseleccionar todos los filtrados
  const toggleTodos = () => {
    if (seleccionados.size > 0 && filtrados.every(e => seleccionados.has(e.id))) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(filtrados.map(e => e.id)));
    }
  };

  const todosSeleccionados = filtrados.length > 0 && filtrados.every(e => seleccionados.has(e.id));

  // Generar PDF
  const handleGenerar = async () => {
    if (seleccionados.size === 0) {
      toast.warning('Selecciona al menos un empleado');
      return;
    }
    setGenerando(true);
    try {
      const logo   = await cargarImg(logoImg);
      const emps   = empleados.filter(e => seleccionados.has(e.id));
      generarPDF(emps, mes, anio, logo);
      toast.success(`${emps.length} tarjeta(s) generada(s) correctamente`);
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF');
    } finally {
      setGenerando(false);
    }
  };

  // ─── Estilos comunes ──────────────────────────────────────────────────────
  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left',
    background: c.tableHeaderBg,
    color: isDark ? '#c4ccdb' : '#fff',
    fontWeight: 600,
    fontSize: '0.78rem',
    borderBottom: `2px solid ${c.borderNormal}`,
    whiteSpace: 'nowrap',
  };
  const tdStyle = {
    padding: '8px 12px',
    fontSize: '0.78rem',
    borderBottom: `1px solid ${c.borderSubtle}`,
    color: c.textPrimary,
    verticalAlign: 'middle',
  };

  return (
    <div className="page-container">
      {/* ── Encabezado ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FiFileText /> Tarjeta de Control de Asistencia
          </h1>
          <p className="page-subtitle">
            Genera la tarjeta física de control de asistencia mensual por empleado
          </p>
        </div>
      </div>

      {/* ── Controles ──────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            {/* Mes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>
                Mes
              </label>
              <select
                className="form-select"
                value={mes}
                onChange={e => setMes(Number(e.target.value))}
                style={{ minWidth: 130 }}
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Año */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>
                Año
              </label>
              <select
                className="form-select"
                value={anio}
                onChange={e => setAnio(Number(e.target.value))}
                style={{ minWidth: 90 }}
              >
                {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Unidad */}
            {unidades.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>
                  Unidad
                </label>
                <select
                  className="form-select"
                  value={unidadFiltro}
                  onChange={e => setUnidadFiltro(e.target.value)}
                  style={{ minWidth: 160 }}
                >
                  <option value="">Todas las unidades</option>
                  {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            )}

            {/* Búsqueda */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>
                Buscar empleado
              </label>
              <div style={{ position: 'relative' }}>
                <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Apellidos, nombres, DNI o código..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  style={{ paddingLeft: 32 }}
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted }}
                  >
                    <FiX size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Botón generar */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'transparent', marginBottom: 4 }}>
                &nbsp;
              </label>
              <button
                className="btn btn-primary"
                onClick={handleGenerar}
                disabled={generando || seleccionados.size === 0}
              >
                <FiDownload size={15} style={{ marginRight: 6 }} />
                {generando
                  ? 'Generando...'
                  : `Generar Tarjeta(s) PDF${seleccionados.size > 0 ? ` (${seleccionados.size})` : ''}`
                }
              </button>
            </div>
          </div>

          {/* Info de selección */}
          {seleccionados.size > 0 && (
            <div style={{
              marginTop: 10, padding: '8px 12px',
              background: isDark ? 'rgba(99,102,241,.12)' : '#eef2ff',
              borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.82rem', color: isDark ? '#a5b4fc' : '#4338ca',
            }}>
              <FiUsers size={14} />
              <span>{seleccionados.size} empleado(s) seleccionado(s) — Se generará una página A5 por cada uno</span>
              <button
                onClick={() => setSeleccionados(new Set())}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.78rem', textDecoration: 'underline' }}
              >
                Limpiar selección
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabla de empleados ─────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header" style={{ padding: '12px 20px', borderBottom: `1px solid ${c.borderNormal}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: c.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiUsers size={16} />
            Empleados ({filtrados.length})
          </span>
          {filtrados.length > 0 && (
            <button
              onClick={toggleTodos}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', color: c.textSecondary, fontWeight: 600,
              }}
            >
              {todosSeleccionados
                ? <FiCheckSquare size={15} style={{ color: '#6366f1' }} />
                : <FiSquare size={15} />
              }
              {todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          )}
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <Loading />
          ) : filtrados.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: c.textMuted }}>
              <FiUsers size={40} style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px', opacity: 0.35 }} />
              <p style={{ margin: 0 }}>No se encontraron empleados</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 44, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={todosSeleccionados}
                      onChange={toggleTodos}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ ...thStyle, width: 90 }}>Código</th>
                  <th style={thStyle}>Empleado</th>
                  <th style={{ ...thStyle, width: 90 }}>DNI</th>
                  <th style={{ ...thStyle, width: 160 }}>Cargo</th>
                  <th style={{ ...thStyle, width: 130 }}>Área</th>
                  <th style={{ ...thStyle, width: 110 }}>Unidad</th>
                  <th style={{ ...thStyle, width: 100 }}>Situación</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((emp, idx) => {
                  const selected = seleccionados.has(emp.id);
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => toggleSel(emp.id)}
                      style={{
                        background: selected
                          ? isDark ? 'rgba(99,102,241,.15)' : '#eef2ff'
                          : idx % 2 === 0 ? c.tableRowEven : c.tableRowOdd,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSel(emp.id)}
                          onClick={e => e.stopPropagation()}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: isDark ? '#a5b4fc' : '#4338ca' }}>
                        {emp.codigo_trabajador || '-'}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>
                        {emp.apellidos}, {emp.nombres}
                      </td>
                      <td style={tdStyle}>{emp.dni}</td>
                      <td style={tdStyle}>{getNombre(emp.cargo) || '-'}</td>
                      <td style={tdStyle}>{getNombre(emp.area) || '-'}</td>
                      <td style={tdStyle}>{emp.unidad || '-'}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600,
                          background: emp.situacion_contractual === 'VIGENTE'
                            ? isDark ? 'rgba(16,185,129,.15)' : '#d1fae5'
                            : isDark ? 'rgba(245,158,11,.15)' : '#fef3c7',
                          color: emp.situacion_contractual === 'VIGENTE' ? '#059669' : '#d97706',
                        }}>
                          {emp.situacion_contractual || 'VIGENTE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default TarjetaTareo;
