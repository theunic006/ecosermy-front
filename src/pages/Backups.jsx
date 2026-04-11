import { useState, useEffect, useCallback } from 'react';
import {
  FiDatabase, FiDownload, FiTrash2, FiRefreshCw, FiPlus,
  FiClock, FiHardDrive, FiArchive, FiCheckCircle, FiAlertCircle,
  FiCalendar, FiLoader,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getBackups, crearBackup, descargarBackup, eliminarBackup } from '../services/backupService';

// Próximos horarios de autobackup (06:00, 12:00, 18:00, 00:00)
const HORARIOS_AUTO = ['00:00', '06:00', '12:00', '18:00'];

function getProximoBackup() {
  const ahora = new Date();
  const hh    = ahora.getHours();
  const mm    = ahora.getMinutes();
  const minActual = hh * 60 + mm;
  const opciones  = [0, 360, 720, 1080]; // 00:00, 06:00, 12:00, 18:00 en minutos

  const siguiente = opciones.find(m => m > minActual) ?? 1440; // siguiente o mañana 00:00
  const diff = siguiente - minActual;
  const h    = Math.floor(diff / 60);
  const m    = diff % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

function formatFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function TipoBadge({ tipo }) {
  const esAuto = tipo === 'Automático';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
      background: esAuto ? '#eff6ff' : '#f0fdf4',
      color: esAuto ? '#1d4ed8' : '#16a34a',
      border: `1px solid ${esAuto ? '#bfdbfe' : '#bbf7d0'}`,
    }}>
      {esAuto ? <FiClock size={11} /> : <FiDatabase size={11} />}
      {tipo}
    </span>
  );
}

export default function Backups() {
  const [data, setData]           = useState({ backups: [], total: 0, storage_used: '0 B', ultimo: null });
  const [loading, setLoading]     = useState(true);
  const [creando, setCreando]     = useState(false);
  const [descargando, setDescargando] = useState(null); // filename descargando
  const [eliminando, setEliminando]   = useState(null); // filename eliminando
  const [confirmar, setConfirmar]     = useState(null); // filename a eliminar (modal)
  const [proximoBackup, setProximoBackup] = useState(getProximoBackup());

  // Actualizar cuenta regresiva cada minuto
  useEffect(() => {
    const interval = setInterval(() => setProximoBackup(getProximoBackup()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBackups();
      setData(res);
    } catch {
      toast.error('Error al cargar la lista de backups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async () => {
    setCreando(true);
    toast.info('Generando backup, puede tardar unos segundos...');
    try {
      const res = await crearBackup();
      toast.success(`✅ Backup creado: ${res.nombre} (${res.size_human})`);
      cargar();
    } catch (e) {
      toast.error('Error al crear el backup');
    } finally {
      setCreando(false);
    }
  };

  const handleDescargar = async (filename) => {
    setDescargando(filename);
    try {
      await descargarBackup(filename);
      toast.success('Descarga iniciada');
    } catch {
      toast.error('Error al descargar el backup');
    } finally {
      setDescargando(null);
    }
  };

  const handleEliminar = async () => {
    if (!confirmar) return;
    setEliminando(confirmar);
    setConfirmar(null);
    try {
      await eliminarBackup(confirmar);
      toast.success('Backup eliminado');
      cargar();
    } catch {
      toast.error('Error al eliminar el backup');
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="page-container">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiDatabase size={22} /> Gestión de Backups
          </h2>
          <span className="page-subtitle">
            Copia de seguridad automática cada 6 horas · 00:00 · 06:00 · 12:00 · 18:00
          </span>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={cargar} disabled={loading}>
            <FiRefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
          <button className="btn-primary" onClick={handleCrear} disabled={creando}>
            {creando
              ? <><FiLoader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generando...</>
              : <><FiPlus size={15} /> Nuevo Backup</>
            }
          </button>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 22,
      }}>
        <KpiCard
          icon={<FiArchive size={20} />}
          color="#2563eb"
          bg="#eff6ff"
          label="Total de backups"
          value={data.total}
        />
        <KpiCard
          icon={<FiHardDrive size={20} />}
          color="#7c3aed"
          bg="#f5f3ff"
          label="Almacenamiento usado"
          value={data.storage_used}
        />
        <KpiCard
          icon={<FiCheckCircle size={20} />}
          color="#16a34a"
          bg="#f0fdf4"
          label="Último backup"
          value={data.ultimo ? formatFecha(data.ultimo) : '—'}
          small
        />
        <KpiCard
          icon={<FiClock size={20} />}
          color="#d97706"
          bg="#fffbeb"
          label="Próximo autobackup en"
          value={proximoBackup}
        />
      </div>

      {/* ── Horario autobackup ───────────────────────────────────────────── */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '14px 20px', marginBottom: 22,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>
          <FiCalendar size={15} />
          <span>Horarios de autobackup:</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {HORARIOS_AUTO.map(h => {
            const ahora = new Date();
            const hh    = ahora.getHours();
            const horaSlot = parseInt(h.split(':')[0]);
            const esActual = hh === horaSlot;
            return (
              <span key={h} style={{
                padding: '3px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                background: esActual ? '#dbeafe' : '#fff',
                color: esActual ? '#1d4ed8' : '#64748b',
                border: `1px solid ${esActual ? '#93c5fd' : '#e2e8f0'}`,
              }}>
                {h}
              </span>
            );
          })}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#94a3b8' }}>
          Se conservan los últimos 30 backups automáticos
        </span>
      </div>

      {/* ── Tabla de backups ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: 8,
          fontWeight: 600, color: '#1e293b', fontSize: '0.9rem',
        }}>
          <FiDatabase size={16} />
          Historial de Backups
          <span style={{
            marginLeft: 6, background: '#f1f5f9', color: '#64748b',
            borderRadius: 999, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 600,
          }}>
            {data.backups.length}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <FiLoader size={28} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 10 }}>Cargando backups...</p>
          </div>
        ) : data.backups.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: '#94a3b8' }}>
            <FiDatabase size={40} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ margin: 0, fontWeight: 500 }}>No hay backups disponibles</p>
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>
              Crea uno manualmente o espera el próximo autobackup
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Archivo', 'Fecha', 'Tamaño', 'Tipo', 'Acciones'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: h === 'Acciones' ? 'center' : 'left',
                      fontWeight: 600, color: '#64748b', fontSize: '0.78rem',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.backups.map((bk, idx) => (
                  <tr key={bk.nombre} style={{
                    borderBottom: idx < data.backups.length - 1 ? '1px solid #f1f5f9' : 'none',
                    background: idx === 0 ? '#fafffe' : '#fff',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = idx === 0 ? '#fafffe' : '#fff'}
                  >
                    {/* Archivo */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiDatabase size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span style={{
                          fontFamily: 'monospace', fontSize: '0.82rem',
                          color: '#1e293b', wordBreak: 'break-all',
                        }}>
                          {bk.nombre}
                        </span>
                        {idx === 0 && (
                          <span style={{
                            background: '#dcfce7', color: '#16a34a',
                            borderRadius: 999, padding: '1px 6px',
                            fontSize: '0.68rem', fontWeight: 700,
                          }}>
                            ÚLTIMO
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Fecha */}
                    <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                      {formatFecha(bk.fecha)}
                    </td>

                    {/* Tamaño */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: '#f1f5f9', color: '#475569',
                        borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600,
                      }}>
                        {bk.size_human}
                      </span>
                    </td>

                    {/* Tipo */}
                    <td style={{ padding: '12px 16px' }}>
                      <TipoBadge tipo={bk.tipo} />
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button
                          title="Descargar"
                          disabled={descargando === bk.nombre}
                          onClick={() => handleDescargar(bk.nombre)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 12px', borderRadius: 6, border: '1px solid #bfdbfe',
                            background: descargando === bk.nombre ? '#eff6ff' : '#fff',
                            color: '#1d4ed8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                          }}
                        >
                          {descargando === bk.nombre
                            ? <FiLoader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            : <FiDownload size={13} />
                          }
                          Descargar
                        </button>
                        <button
                          title="Eliminar"
                          disabled={eliminando === bk.nombre}
                          onClick={() => setConfirmar(bk.nombre)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', borderRadius: 6, border: '1px solid #fecaca',
                            background: '#fff', color: '#dc2626',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                          }}
                        >
                          {eliminando === bk.nombre
                            ? <FiLoader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            : <FiTrash2 size={13} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de confirmación ────────────────────────────────────────── */}
      {confirmar && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 28,
            maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                background: '#fee2e2', borderRadius: '50%',
                width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiAlertCircle size={20} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Eliminar backup</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <p style={{
              background: '#f8fafc', borderRadius: 8, padding: '8px 12px',
              fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569',
              margin: '0 0 20px', wordBreak: 'break-all',
            }}>
              {confirmar}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmar(null)}
                style={{
                  padding: '7px 18px', borderRadius: 7, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                style={{
                  padding: '7px 18px', borderRadius: 7, border: 'none',
                  background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyframe para el spinner ─────────────────────────────────────── */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Sub-componente KPI ────────────────────────────────────────────────────────
function KpiCard({ icon, color, bg, label, value, small = false }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10,
      border: '1px solid #e2e8f0', padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        background: bg, borderRadius: 10,
        width: 44, height: 44, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{label}</p>
        <p style={{
          margin: '2px 0 0', fontWeight: 700, color: '#1e293b',
          fontSize: small ? '0.82rem' : '1.1rem',
          whiteSpace: small ? 'normal' : 'nowrap',
        }}>
          {value}
        </p>
      </div>
    </div>
  );
}
