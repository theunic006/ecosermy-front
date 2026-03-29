import { useState, useEffect, useCallback } from 'react';
import {
  FiAlertTriangle, FiSearch, FiDownload, FiEdit2,
  FiTrash2, FiX, FiCheck, FiFilter, FiPlus, FiRefreshCw,
} from 'react-icons/fi';
import {
  getAmonestaciones, createAmonestacion,
  updateAmonestacion, deleteAmonestacion,
} from '../services/amonestacionService';
import api from '../services/api';
import Loading from '../components/common/Loading';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

// ─── Constantes ────────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'VERBAL',     label: 'Verbal',     color: '#f59e0b', bg: '#fef3c7' },
  { value: 'ESCRITA',    label: 'Escrita',    color: '#dc2626', bg: '#fee2e2' },
  { value: 'SUSPENSION', label: 'Suspensión', color: '#7c3aed', bg: '#ede9fe' },
  { value: 'OTROS',      label: 'Otros',      color: '#64748b', bg: '#f1f5f9' },
];

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const getTipoBadge = (tipo) =>
  TIPOS.find(t => t.value === tipo) || { value: tipo, label: tipo || '—', color: '#64748b', bg: '#f1f5f9' };

const fd = (d) => d ? String(d).split('T')[0] : '—';

const FORM_EMPTY = { empleado_id: '', tipo: '', motivo: '', fecha: '' };

// ─── Componente ────────────────────────────────────────────────────────────────
function Amonestaciones() {
  const { isDark, c } = useThemeColors();
  const { isAdmin, hasPermission } = useAuth();
  const canEditar = isAdmin || hasPermission('empleados.editar') || hasPermission('tareo.registrar_cese');

  // ── Datos ──
  const [registros, setRegistros]   = useState([]);
  const [empleados, setEmpleados]   = useState([]);
  const [loading, setLoading]       = useState(false);

  // ── Filtros ──
  const [busqueda, setBusqueda]     = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMes, setFiltroMes]   = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');

  // ── Modal crear / editar ──
  const MODAL_CLOSED = { show: false, editId: null, form: FORM_EMPTY, saving: false };
  const [modal, setModal]   = useState(MODAL_CLOSED);

  // ── Confirmación eliminar ──
  const [confirmDel, setConfirmDel] = useState(null);

  // ── Autocomplete empleado en modal ──
  const [empQuery, setEmpQuery]     = useState('');
  const [empResults, setEmpResults] = useState([]);

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    api.get('/empleados').then(r => setEmpleados(r.data || [])).catch(() => {});
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAmonestaciones();
      setRegistros(data);
    } catch {
      toast.error('Error al cargar amonestaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Autocomplete ──
  useEffect(() => {
    if (!empQuery.trim()) { setEmpResults([]); return; }
    const q = empQuery.toLowerCase();
    setEmpResults(
      empleados
        .filter(e => (e.apellidos + ' ' + e.nombres + ' ' + e.dni).toLowerCase().includes(q))
        .slice(0, 8)
    );
  }, [empQuery, empleados]);

  // ── Años disponibles ──
  const aniosDisponibles = [...new Set(
    registros.filter(r => r.fecha).map(r => new Date(fd(r.fecha)).getFullYear())
  )].sort((a, b) => b - a);

  // ── Filtrado ──
  const filtrados = registros.filter(r => {
    const txt = busqueda.toLowerCase();
    const emp = r.empleado;
    const matchBusqueda = !txt ||
      ((emp?.apellidos ?? '') + ' ' + (emp?.nombres ?? '')).toLowerCase().includes(txt) ||
      (emp?.dni ?? '').includes(txt);
    const matchTipo = !filtroTipo || r.tipo === filtroTipo;
    const matchMes  = !filtroMes  || (r.fecha && (new Date(fd(r.fecha)).getMonth() + 1) === parseInt(filtroMes));
    const matchAnio = !filtroAnio || (r.fecha && new Date(fd(r.fecha)).getFullYear() === parseInt(filtroAnio));
    return matchBusqueda && matchTipo && matchMes && matchAnio;
  });

  // ── Estadísticas ──
  const stats = TIPOS.map(t => ({
    ...t, count: registros.filter(r => r.tipo === t.value).length,
  }));

  // ── Guardar (crear o editar) ──
  const guardar = async () => {
    const { form, editId } = modal;
    if (!form.empleado_id || !form.tipo || !form.motivo || !form.fecha) {
      toast.warning('Complete todos los campos requeridos');
      return;
    }
    setModal(p => ({ ...p, saving: true }));
    try {
      if (editId) {
        await updateAmonestacion(editId, { tipo: form.tipo, motivo: form.motivo, fecha: form.fecha });
        toast.success('✓ Amonestación actualizada');
      } else {
        await createAmonestacion({ empleado_id: form.empleado_id, tipo: form.tipo, motivo: form.motivo, fecha: form.fecha });
        toast.success('✓ Amonestación registrada');
      }
      setModal(MODAL_CLOSED);
      setEmpQuery('');
      cargar();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
      setModal(p => ({ ...p, saving: false }));
    }
  };

  // ── Eliminar ──
  const eliminar = async (id) => {
    try {
      await deleteAmonestacion(id);
      toast.success('Amonestación eliminada');
      setConfirmDel(null);
      cargar();
    } catch (err) {
      toast.error('Error al eliminar: ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Abrir modal edición ──
  const abrirEditar = (r) => {
    const emp = r.empleado;
    setEmpQuery(emp ? `${emp.apellidos}, ${emp.nombres}` : '');
    setEmpResults([]);
    setModal({
      show: true, editId: r.id,
      form: { empleado_id: r.empleado_id, tipo: r.tipo || '', motivo: r.motivo || '', fecha: fd(r.fecha) !== '—' ? fd(r.fecha) : '' },
      saving: false,
    });
  };

  const abrirNuevo = () => {
    setEmpQuery(''); setEmpResults([]);
    setModal({ show: true, editId: null, form: FORM_EMPTY, saving: false });
  };

  // ── Exportar Excel ──
  const exportarExcel = () => {
    if (filtrados.length === 0) { toast.warning('No hay registros para exportar'); return; }
    const filas = filtrados.map((r, i) => ({
      'N°':                  i + 1,
      'Código':              r.empleado?.codigo_trabajador || '',
      'Apellidos y Nombres': `${r.empleado?.apellidos || ''}, ${r.empleado?.nombres || ''}`,
      'DNI':                 r.empleado?.dni || '',
      'Área':                r.empleado?.area?.nombre || '',
      'Cargo':               r.empleado?.cargo?.nombre || '',
      'Tipo':                r.tipo || '',
      'Fecha':               fd(r.fecha),
      'Motivo':              r.motivo || '',
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    ws['!cols'] = [{ wch:5 },{ wch:10 },{ wch:30 },{ wch:12 },{ wch:20 },{ wch:25 },{ wch:13 },{ wch:14 },{ wch:55 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Amonestaciones');
    XLSX.writeFile(wb, `amonestaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`${filtrados.length} registro(s) exportados`);
  };

  const limpiarFiltros = () => { setBusqueda(''); setFiltroTipo(''); setFiltroMes(''); setFiltroAnio(''); };
  const hayFiltros = busqueda || filtroTipo || filtroMes || filtroAnio;

  const empSelModal = empleados.find(e => e.id === modal.form.empleado_id);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ display:'flex', alignItems:'center', gap:8 }}>
          <FiAlertTriangle size={22} color="#b45309" />
          Amonestaciones
        </h2>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-secondary" onClick={cargar} title="Recargar">
            <FiRefreshCw size={15} />
          </button>
          <button className="btn-secondary" onClick={exportarExcel} disabled={filtrados.length === 0}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            <FiDownload size={15} /> Excel
          </button>
          {canEditar && (
            <button className="btn-primary" onClick={abrirNuevo}
              style={{ display:'flex', alignItems:'center', gap:6 }}>
              <FiPlus size={15} /> Nueva Amonestación
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        {[...stats, { value:'TOTAL', label:'Total', color: isDark ? '#94a3b8' : '#475569', bg:'#f1f5f9', count: registros.length }].map(t => (
          <div key={t.value} style={{
            flex:'1 1 130px', padding:'14px 18px', borderRadius:10,
            background: isDark ? 'rgba(255,255,255,.04)' : '#fff',
            border:`1px solid ${isDark ? 'rgba(255,255,255,.08)' : '#e2e8f0'}`,
            borderLeft:`4px solid ${t.color}`,
          }}>
            <div style={{ fontSize:'0.72rem', fontWeight:700, color:t.color, textTransform:'uppercase', letterSpacing:'.5px' }}>
              {t.label}
            </div>
            <div style={{ fontSize:'1.8rem', fontWeight:800, color: isDark ? '#e2e8f0' : '#1e293b', lineHeight:1, marginTop:4 }}>
              {t.count}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom:16, padding:'12px 18px' }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <FiFilter size={15} color={c.textMuted} />
          <div style={{ position:'relative', flex:'1 1 200px' }}>
            <FiSearch size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:c.textMuted, pointerEvents:'none' }} />
            <input type="text" className="form-control" placeholder="Buscar por nombre o DNI..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ paddingLeft:32, fontSize:'0.85rem' }} />
          </div>
          <select className="form-select" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            style={{ width:150, fontSize:'0.85rem' }}>
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="form-select" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}
            style={{ width:130, fontSize:'0.85rem' }}>
            <option value="">Todos los años</option>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="form-select" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
            style={{ width:150, fontSize:'0.85rem' }}>
            <option value="">Todos los meses</option>
            {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          {hayFiltros && (
            <button onClick={limpiarFiltros}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background: isDark ? 'rgba(239,68,68,.15)' : '#fee2e2', color:'#dc2626', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:'0.8rem' }}>
              <FiX size={13} /> Limpiar
            </button>
          )}
          <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:c.textMuted, whiteSpace:'nowrap' }}>
            {filtrados.length} registro(s)
          </span>
        </div>
      </div>

      {/* Tabla */}
      {loading ? <Loading /> : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
              <thead>
                <tr style={{ background:c.tableHeaderBg, color: isDark ? '#c4ccdb' : '#fff' }}>
                  {['#','Código','Empleado','DNI','Área','Cargo','Tipo','Fecha','Motivo', ...(canEditar ? ['Acciones'] : [])].map(h => (
                    <th key={h} style={{ padding:'10px 12px', fontWeight:600, textAlign:'left', whiteSpace:'nowrap', fontSize:'0.73rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={canEditar ? 10 : 9} style={{ textAlign:'center', padding:40, color:c.textMuted }}>
                      {registros.length === 0
                        ? '📋 No hay amonestaciones registradas. Usa el botón "+ Nueva Amonestación"'
                        : '🔍 No hay registros para los filtros aplicados'}
                    </td>
                  </tr>
                ) : filtrados.map((r, idx) => {
                  const badge = getTipoBadge(r.tipo);
                  return (
                    <tr key={r.id} style={{ background: idx % 2 === 0 ? c.tableRowEven : c.tableRowOdd, borderBottom:`1px solid ${c.borderSubtle}` }}>
                      <td style={{ padding:'8px 12px', color:c.textMuted }}>{idx + 1}</td>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace', fontWeight:600, color: isDark ? '#60a5fa' : '#1d4ed8' }}>
                        {r.empleado?.codigo_trabajador || '—'}
                      </td>
                      <td style={{ padding:'8px 12px', fontWeight:600, whiteSpace:'nowrap' }}>
                        {r.empleado?.apellidos}, {r.empleado?.nombres}
                      </td>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace', color:c.textSecondary }}>
                        {r.empleado?.dni || '—'}
                      </td>
                      <td style={{ padding:'8px 12px', color:c.textMuted }}>{r.empleado?.area?.nombre || '—'}</td>
                      <td style={{ padding:'8px 12px', color:c.textMuted }}>{r.empleado?.cargo?.nombre || '—'}</td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{
                          padding:'3px 10px', borderRadius:5, fontSize:'0.72rem', fontWeight:700,
                          background: isDark ? `${badge.color}22` : badge.bg,
                          color: badge.color, border:`1px solid ${badge.color}44`,
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace', color:c.textSecondary, fontSize:'0.8rem', whiteSpace:'nowrap' }}>
                        {fd(r.fecha)}
                      </td>
                      <td style={{ padding:'8px 12px', color:c.textMuted, maxWidth:300 }}>
                        <span title={r.motivo || ''} style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                          {r.motivo || '—'}
                        </span>
                      </td>
                      {canEditar && (
                        <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={() => abrirEditar(r)} title="Editar"
                              style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background: isDark ? 'rgba(245,158,11,.15)' : '#fef3c7', color:'#b45309', border:`1px solid ${isDark ? 'rgba(245,158,11,.3)' : '#fde68a'}`, borderRadius:5, cursor:'pointer', fontWeight:600, fontSize:'0.75rem' }}>
                              <FiEdit2 size={12} /> Editar
                            </button>
                            <button onClick={() => setConfirmDel({ id: r.id, nombre: `${r.empleado?.apellidos}, ${r.empleado?.nombres}` })} title="Eliminar"
                              style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background: isDark ? 'rgba(220,38,38,.15)' : '#fee2e2', color:'#dc2626', border:`1px solid ${isDark ? 'rgba(220,38,38,.3)' : '#fecaca'}`, borderRadius:5, cursor:'pointer', fontWeight:600, fontSize:'0.75rem' }}>
                              <FiTrash2 size={12} /> Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal Crear / Editar ──────────────────────────── */}
      {modal.show && (
        <div className="modal-overlay" onClick={() => !modal.saving && setModal(MODAL_CLOSED)}>
          <div className="modal-content" style={{ maxWidth:500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background:'linear-gradient(135deg, #b45309, #78350f)', color:'#fff' }}>
              <h3 style={{ display:'flex', alignItems:'center', gap:8 }}>
                <FiAlertTriangle size={18} />
                {modal.editId ? 'Editar Amonestación' : 'Nueva Amonestación'}
              </h3>
            </div>
            <div className="modal-body" style={{ padding:24 }}>

              {/* Empleado — solo al crear */}
              {!modal.editId ? (
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontWeight:600, marginBottom:6, color: isDark ? '#e2e8f0' : '#374151', fontSize:'0.88rem' }}>
                    Empleado *
                  </label>
                  <div style={{ position:'relative' }}>
                    <input type="text" className="form-control"
                      placeholder="Buscar por nombre o DNI..."
                      value={empQuery}
                      onChange={e => { setEmpQuery(e.target.value); setModal(p => ({ ...p, form: { ...p.form, empleado_id:'' } })); }}
                      style={{ padding:'9px 12px', fontSize:'0.92rem', width:'100%' }}
                    />
                    {empResults.length > 0 && (
                      <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:200, background: isDark ? '#1e293b' : '#fff', border:`1px solid ${isDark ? 'rgba(255,255,255,.1)' : '#e2e8f0'}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,.15)', maxHeight:220, overflowY:'auto' }}>
                        {empResults.map(e => (
                          <div key={e.id}
                            onClick={() => { setEmpQuery(`${e.apellidos}, ${e.nombres}`); setEmpResults([]); setModal(p => ({ ...p, form: { ...p.form, empleado_id: e.id } })); }}
                            style={{ padding:'9px 14px', cursor:'pointer', borderBottom:`1px solid ${isDark ? 'rgba(255,255,255,.05)' : '#f1f5f9'}`, fontSize:'0.85rem' }}
                            onMouseEnter={ev => ev.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : '#f8fafc'}
                            onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                          >
                            <strong>{e.apellidos}, {e.nombres}</strong>
                            <span style={{ color:c.textMuted, marginLeft:8 }}>{e.dni}</span>
                            <span style={{ color:c.textMuted, marginLeft:8, fontSize:'0.78rem' }}>{e.cargo?.nombre || ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {modal.form.empleado_id && (
                    <div style={{ marginTop:6, padding:'6px 10px', background: isDark ? 'rgba(22,163,74,.1)' : '#dcfce7', borderRadius:5, fontSize:'0.8rem', color: isDark ? '#6ee7b7' : '#15803d', display:'flex', alignItems:'center', gap:5 }}>
                      <FiCheck size={13} /> <strong>{empQuery}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom:14, padding:'10px 14px', background: isDark ? 'rgba(148,163,184,.05)' : '#f8fafc', borderRadius:8, borderLeft:'4px solid #b45309' }}>
                  <strong>{empSelModal?.codigo_trabajador}</strong> — {empSelModal?.apellidos}, {empSelModal?.nombres}
                  <div style={{ fontSize:'0.78rem', color:c.textMuted, marginTop:2 }}>
                    {empSelModal?.area?.nombre} · {empSelModal?.cargo?.nombre}
                  </div>
                </div>
              )}

              {/* Tipo */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:600, marginBottom:6, color: isDark ? '#e2e8f0' : '#374151', fontSize:'0.88rem' }}>
                  Tipo de Amonestación *
                </label>
                <select className="form-control"
                  value={modal.form.tipo}
                  onChange={e => setModal(p => ({ ...p, form: { ...p.form, tipo: e.target.value } }))}
                  style={{ padding:'9px 12px', fontSize:'0.92rem', width:'100%' }}>
                  <option value="">-- Seleccionar --</option>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Fecha */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:600, marginBottom:6, color: isDark ? '#e2e8f0' : '#374151', fontSize:'0.88rem' }}>
                  Fecha *
                </label>
                <input type="date" className="form-control"
                  value={modal.form.fecha}
                  onChange={e => setModal(p => ({ ...p, form: { ...p.form, fecha: e.target.value } }))}
                  style={{ padding:'9px 12px', fontSize:'0.92rem', width:'100%' }} />
              </div>

              {/* Motivo */}
              <div>
                <label style={{ display:'block', fontWeight:600, marginBottom:6, color: isDark ? '#e2e8f0' : '#374151', fontSize:'0.88rem' }}>
                  Motivo *
                </label>
                <textarea className="form-control"
                  value={modal.form.motivo}
                  onChange={e => setModal(p => ({ ...p, form: { ...p.form, motivo: e.target.value } }))}
                  placeholder="Describa el motivo de la amonestación..."
                  rows={4}
                  style={{ padding:'9px 12px', fontSize:'0.92rem', width:'100%', resize:'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setModal(MODAL_CLOSED); setEmpQuery(''); }} disabled={modal.saving}>
                Cancelar
              </button>
              <button className="btn-primary"
                style={{ background:'#b45309', borderColor:'#b45309' }}
                disabled={modal.saving || !modal.form.tipo || !modal.form.motivo || !modal.form.fecha || (!modal.editId && !modal.form.empleado_id)}
                onClick={guardar}>
                {modal.saving ? 'Guardando...' : <><FiCheck size={14} style={{ marginRight:5 }} />{modal.editId ? 'Actualizar' : 'Registrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminar ──────────────────────── */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal-content" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background:'linear-gradient(135deg, #dc2626, #991b1b)', color:'#fff' }}>
              <h3 style={{ display:'flex', alignItems:'center', gap:8 }}>
                <FiTrash2 size={18} /> Confirmar eliminación
              </h3>
            </div>
            <div className="modal-body" style={{ padding:24 }}>
              <p style={{ margin:0, color:c.textSecondary }}>
                ¿Eliminar la amonestación de <strong>{confirmDel.nombre}</strong>?<br />
                <span style={{ fontSize:'0.82rem', color:c.textMuted }}>Esta acción no se puede deshacer.</span>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn-primary"
                style={{ background:'#dc2626', borderColor:'#dc2626' }}
                onClick={() => eliminar(confirmDel.id)}>
                <FiTrash2 size={14} style={{ marginRight:5 }} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Amonestaciones;

