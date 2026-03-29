import { useState, useEffect, useCallback } from 'react';
import {
  FiActivity, FiSearch, FiFilter, FiChevronLeft, FiChevronRight,
  FiEdit2, FiPlus, FiTrash2, FiUser, FiCalendar, FiClock, FiEye, FiX,
  FiLogIn, FiLogOut, FiMonitor, FiMapPin, FiAlertTriangle,
} from 'react-icons/fi';
import { getHistorialUsuarios, getHistorialModulos, getHistorialEstadisticas } from '../services/historialService';
import Loading from '../components/common/Loading';

const ACCION_BADGE = {
  crear:          { bg: '#dcfce7', color: '#166534', icon: FiPlus },
  editar:         { bg: '#dbeafe', color: '#1e40af', icon: FiEdit2 },
  eliminar:       { bg: '#fee2e2', color: '#991b1b', icon: FiTrash2 },
  login:          { bg: '#e0e7ff', color: '#3730a3', icon: FiLogIn },
  logout:         { bg: '#f3e8ff', color: '#6b21a8', icon: FiLogOut },
  login_fallido:  { bg: '#fef3c7', color: '#92400e', icon: FiAlertTriangle },
  login_bloqueado:{ bg: '#fee2e2', color: '#991b1b', icon: FiAlertTriangle },
  default:        { bg: '#f1f5f9', color: '#475569', icon: FiActivity },
};

function HistorialUsuarios() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [modulos, setModulos] = useState([]);
  const [stats, setStats] = useState({});
  const [detalle, setDetalle] = useState(null);

  const [filtros, setFiltros] = useState({
    buscar: '', modulo: '', accion: '', fecha_desde: '', fecha_hasta: '', page: 1,
  });

  const cargar = useCallback(async (params = filtros) => {
    setLoading(true);
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
      const res = await getHistorialUsuarios(clean);
      setLogs(res.data || []);
      setPagination({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    cargar(filtros);
    getHistorialModulos().then(setModulos).catch(() => {});
    getHistorialEstadisticas().then(setStats).catch(() => {});
  }, []);

  const buscar = () => { const f = { ...filtros, page: 1 }; setFiltros(f); cargar(f); };
  const cambiarPagina = (p) => { const f = { ...filtros, page: p }; setFiltros(f); cargar(f); };
  const limpiar = () => {
    const f = { buscar: '', modulo: '', accion: '', fecha_desde: '', fecha_hasta: '', page: 1 };
    setFiltros(f); cargar(f);
  };

  const getBadge = (accion) => ACCION_BADGE[accion] || ACCION_BADGE.default;

  const formatFecha = (d) => {
    if (!d) return '-';
    const f = new Date(d);
    return f.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2><FiActivity style={{ marginRight: 8 }} /> Historial de Usuarios</h2>
        <span className="page-subtitle">Registro de todas las acciones realizadas por los usuarios</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="dash-kpi dash-kpi--blue">
          <div className="dash-kpi-icon"><FiActivity size={20} /></div>
          <div><h3>{stats.acciones_hoy ?? 0}</h3><p>Acciones hoy</p></div>
        </div>
        <div className="dash-kpi dash-kpi--green">
          <div className="dash-kpi-icon"><FiUser size={20} /></div>
          <div><h3>{stats.usuarios_activos_hoy ?? 0}</h3><p>Usuarios activos hoy</p></div>
        </div>
        <div className="dash-kpi dash-kpi--purple">
          <div className="dash-kpi-icon"><FiLogIn size={20} /></div>
          <div><h3>{stats.logins_hoy ?? 0}</h3><p>Logins hoy</p></div>
        </div>
      </div>

      {/* Filtros */}
      <div className="table-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '12px 16px' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="form-input"
              placeholder="Buscar por descripción, usuario, módulo..."
              value={filtros.buscar}
              onChange={(e) => setFiltros(p => ({ ...p, buscar: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              style={{ paddingLeft: 34 }}
            />
          </div>
          <select className="form-input" value={filtros.modulo} onChange={(e) => setFiltros(p => ({ ...p, modulo: e.target.value }))}
            style={{ flex: '0 0 160px' }}>
            <option value="">Todos los módulos</option>
            {modulos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="form-input" value={filtros.accion} onChange={(e) => setFiltros(p => ({ ...p, accion: e.target.value }))}
            style={{ flex: '0 0 130px' }}>
            <option value="">Todas las acciones</option>
            <option value="crear">Crear</option>
            <option value="editar">Editar</option>
            <option value="eliminar">Eliminar</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="login_fallido">Login fallido</option>
          </select>
          <input type="date" className="form-input" value={filtros.fecha_desde}
            onChange={(e) => setFiltros(p => ({ ...p, fecha_desde: e.target.value }))}
            style={{ flex: '0 0 145px' }} />
          <input type="date" className="form-input" value={filtros.fecha_hasta}
            onChange={(e) => setFiltros(p => ({ ...p, fecha_hasta: e.target.value }))}
            style={{ flex: '0 0 145px' }} />
          <button className="btn btn-primary" onClick={buscar}><FiFilter size={14} /> Filtrar</button>
          <button className="btn btn-secondary" onClick={limpiar}>Limpiar</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-card">
        {loading ? <Loading /> : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <FiActivity size={40} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p>No se encontraron registros de actividad</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 150 }}>Fecha / Hora</th>
                    <th style={{ width: 140 }}>Usuario</th>
                    <th style={{ width: 110 }}>Módulo</th>
                    <th style={{ width: 90 }}>Acción</th>
                    <th>Descripción</th>
                    <th style={{ width: 160 }}>Dispositivo</th>
                    <th style={{ width: 150 }}>Ubicación</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const badge = getBadge(log.accion);
                    const Icon = badge.icon;
                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                            <FiClock size={13} style={{ color: '#94a3b8' }} />
                            {formatFecha(log.created_at)}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiUser size={13} style={{ color: '#6366f1' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.83rem' }}>{log.user_nombre || 'Sistema'}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase' }}>
                            {log.modulo}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: badge.bg, color: badge.color,
                            padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 700,
                          }}>
                            <Icon size={12} /> {log.accion}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.83rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.descripcion}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#64748b' }}>
                            <FiMonitor size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}
                              title={log.dispositivo || log.user_agent || '-'}>
                              {log.dispositivo || '-'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#64748b' }}>
                            <FiMapPin size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}
                              title={log.ubicacion || '-'}>
                              {log.ubicacion || '-'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-ghost"
                            title="Ver detalle"
                            onClick={() => setDetalle(log)}
                            style={{ padding: 4 }}
                          >
                            <FiEye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #e2e8f0', fontSize: '0.83rem' }}>
              <span style={{ color: '#64748b' }}>
                Mostrando {logs.length} de {pagination.total ?? 0} registros
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-sm btn-secondary" disabled={pagination.current_page <= 1}
                  onClick={() => cambiarPagina(pagination.current_page - 1)}>
                  <FiChevronLeft size={14} />
                </button>
                <span style={{ padding: '4px 12px', fontWeight: 600 }}>
                  {pagination.current_page} / {pagination.last_page}
                </span>
                <button className="btn btn-sm btn-secondary" disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => cambiarPagina(pagination.current_page + 1)}>
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Detalle */}
      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600, maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>Detalle de Actividad #{detalle.id}</h3>
              <button className="btn btn-ghost" onClick={() => setDetalle(null)}><FiX size={18} /></button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>USUARIO</label>
                  <p style={{ fontWeight: 600 }}>{detalle.user_nombre || 'Sistema'}</p></div>
                <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>FECHA</label>
                  <p>{formatFecha(detalle.created_at)}</p></div>
                <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>MÓDULO</label>
                  <p style={{ textTransform: 'uppercase', fontWeight: 600 }}>{detalle.modulo}</p></div>
                <div><label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>ACCIÓN</label>
                  <p style={{ fontWeight: 600 }}>{detalle.accion}</p></div>
                <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>DESCRIPCIÓN</label>
                  <p>{detalle.descripcion}</p></div>
              </div>

              {/* Info del equipo y ubicación */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiMonitor size={12} /> DISPOSITIVO
                  </label>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{detalle.dispositivo || '-'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiMapPin size={12} /> UBICACIÓN
                  </label>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{detalle.ubicacion || '-'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>IP</label>
                  <p style={{ fontSize: '0.85rem' }}>{detalle.ip || '-'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>URL</label>
                  <p style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{detalle.url || '-'}</p>
                </div>
                {detalle.user_agent && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>USER AGENT</label>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all' }}>{detalle.user_agent}</p>
                  </div>
                )}
              </div>

              {detalle.datos_antes && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>DATOS ANTES</label>
                  <pre style={{ background: '#fef2f2', padding: 12, borderRadius: 6, fontSize: '0.78rem', overflow: 'auto', maxHeight: 200 }}>
                    {JSON.stringify(detalle.datos_antes, null, 2)}
                  </pre>
                </div>
              )}
              {detalle.datos_despues && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>DATOS DESPUÉS</label>
                  <pre style={{ background: '#f0fdf4', padding: 12, borderRadius: 6, fontSize: '0.78rem', overflow: 'auto', maxHeight: 200 }}>
                    {JSON.stringify(detalle.datos_despues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistorialUsuarios;
