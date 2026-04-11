import { useState, useEffect, useCallback } from 'react';
import { FiUser, FiSearch, FiCalendar, FiDollarSign, FiAlertTriangle, FiFileText, FiClock, FiAward, FiMapPin, FiPhone, FiMail, FiBriefcase, FiShield, FiTrendingUp, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getFichaPersonal } from '../services/fichaService';
import { getEmpleadosVigentes } from '../services/empleadoService';
import Loading from '../components/common/Loading';
import { toast } from 'react-toastify';
import { MESES } from '../utils/constants';

const TIPOS_TAREO = {
  td: { label: 'TD', color: '#43a047', nombre: 'Trabajo Día' },
  tn: { label: 'TN', color: '#2C6B2E', nombre: 'Trabajo Noche' },
  medio_dia: { label: '0.5', color: '#88B88F', nombre: 'Medio Día' },
  dl: { label: 'DL', color: '#3BACD1', nombre: 'Día Libre' },
  ls: { label: 'LS', color: '#3B74D1', nombre: 'Lic. Sindical' },
  lt: { label: 'LT', color: '#FFBF00', nombre: 'Libre Trabajado' },
  dm: { label: 'DM', color: '#26a69a', nombre: 'Descanso Médico' },
  v:  { label: 'V',  color: '#5538C7', nombre: 'Vacaciones' },
  lfa:{ label: 'LFA',color: '#30429C', nombre: 'Lic. Familiar' },
  lp: { label: 'LP', color: '#9038C7', nombre: 'Lic. Paternidad' },
  lm: { label: 'LM', color: '#A370C2', nombre: 'Lic. Maternidad' },
  lf: { label: 'LF', color: '#363636', nombre: 'Lic. Fallecimiento' },
  tf: { label: 'TF', color: '#FFAA00', nombre: 'Trabajo Feriado' },
  p:  { label: 'P',  color: '#757575', nombre: 'Permiso' },
  r:  { label: 'R',  color: '#bdbdbd', nombre: 'Retirado' },
  lsg:{ label: 'LSG',color: '#9e9e9e', nombre: 'Lic. Sin Goce' },
  f:  { label: 'F',  color: '#e53935', nombre: 'Falta' },
  su: { label: 'SU', color: '#d32f2f', nombre: 'Suspensión' },
};

const TAREO_KEYS = ['td','tn','medio_dia','dl','ls','lt','dm','v','lfa','lp','lm','lf','tf','p','r','lsg','f','su'];

function FichaPersonal() {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    personal: true, laboral: true, pension: true, tareo: true,
    resumenTareo: true, planilla: true, amonestaciones: true,
    contratos: true, vacaciones: true,
  });

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      const data = await getEmpleadosVigentes();
      setEmpleados(data);
    } catch {
      toast.error('Error al cargar empleados');
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const cargarFicha = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getFichaPersonal(id);
      setFicha(data);
    } catch {
      toast.error('Error al cargar ficha del personal');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectEmpleado = (id) => {
    setEmpleadoId(id);
    cargarFicha(id);
  };

  const toggleSeccion = (key) => {
    setSeccionesAbiertas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatMoney = (v) => `S/ ${parseFloat(v || 0).toFixed(2)}`;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-PE') : '-';

  const empleadosFiltrados = empleados.filter(e => {
    const term = busqueda.toLowerCase();
    return (
      e.apellidos?.toLowerCase().includes(term) ||
      e.nombres?.toLowerCase().includes(term) ||
      e.dni?.includes(term) ||
      e.codigo_trabajador?.toLowerCase().includes(term)
    );
  });

  const emp = ficha?.empleado;

  const SeccionHeader = ({ icon: Icon, titulo, secKey, badge }) => (
    <div
      className="ficha-section-header"
      onClick={() => toggleSeccion(secKey)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', padding: '12px 16px', background: 'var(--bg-secondary)',
        borderRadius: '8px', marginBottom: seccionesAbiertas[secKey] ? '12px' : '0',
        border: '1px solid var(--border-color)', userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={18} style={{ color: 'var(--accent)' }} />
        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{titulo}</h4>
        {badge && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{badge}</span>}
      </div>
      {seccionesAbiertas[secKey] ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
    </div>
  );

  const InfoRow = ({ label, value, highlight }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '6px 0',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{label}</span>
      <span style={{
        fontWeight: highlight ? 600 : 400, fontSize: '0.85rem',
        color: highlight ? 'var(--accent)' : 'var(--text-primary)',
      }}>{value || '-'}</span>
    </div>
  );

  const StatCard = ({ label, value, color, icon: Icon }) => (
    <div style={{
      background: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px 16px',
      border: '1px solid var(--border-color)', flex: '1 1 140px', minWidth: '130px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        {Icon && <Icon size={14} style={{ color: color || 'var(--text-muted)' }} />}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2><FiUser style={{ marginRight: 8 }} /> Ficha del Personal</h2>
      </div>

      {/* Buscador de empleado */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <FiSearch size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: '100%', padding: '10px 10px 10px 34px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: '0.9rem',
              }}
            />
          </div>
          <select
            value={empleadoId || ''}
            onChange={e => handleSelectEmpleado(e.target.value)}
            style={{
              flex: '1 1 300px', padding: '10px', borderRadius: '8px',
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: '0.9rem',
            }}
          >
            <option value="">-- Seleccionar empleado --</option>
            {empleadosFiltrados.map(e => (
              <option key={e.id} value={e.id}>
                {e.apellidos}, {e.nombres} — {e.dni} — {e.unidad}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadingEmpleados && <Loading />}
      {loading && <Loading />}

      {ficha && emp && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Encabezado del empleado */}
          <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--accent)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 700,
              flexShrink: 0,
            }}>
              {emp.nombres?.[0]}{emp.apellidos?.[0]}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{emp.apellidos}, {emp.nombres}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                <span>DNI: {emp.dni}</span>
                <span>Código: {emp.codigo_trabajador}</span>
                <span>Unidad: {emp.unidad}</span>
                <span className={`badge ${emp.situacion_contractual === 'VIGENTE' ? 'badge-success' : emp.situacion_contractual === 'CESADO' ? 'badge-danger' : 'badge-warning'}`}>
                  {emp.situacion_contractual}
                </span>
                {emp.teseo ? <span className="badge badge-success">TESEO ✓</span> : <span className="badge badge-warning">SIN TESEO</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <StatCard label="Antigüedad" value={`${ficha.antiguedad.total.anios}a ${ficha.antiguedad.total.meses}m`} icon={FiClock} color="#3b82f6" />
              <StatCard label="Meses Tareados" value={ficha.resumen_tareo.meses_tareados} icon={FiCalendar} color="#10b981" />
              <StatCard label="Vacaciones Pend." value={`${ficha.vacaciones.dias_pendientes}d`} icon={FiAward} color="#8b5cf6" />
              <StatCard label="Amonestaciones" value={ficha.amonestaciones.length} icon={FiAlertTriangle} color={ficha.amonestaciones.length > 0 ? '#ef4444' : '#6b7280'} />
            </div>
          </div>

          {/* ── DATOS PERSONALES ── */}
          <SeccionHeader icon={FiUser} titulo="Datos Personales" secKey="personal" />
          {seccionesAbiertas.personal && (
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0 24px' }}>
                <InfoRow label="Apellidos" value={emp.apellidos} />
                <InfoRow label="Nombres" value={emp.nombres} />
                <InfoRow label="DNI" value={emp.dni} />
                <InfoRow label="Fecha Nacimiento" value={formatDate(emp.fecha_nacimiento)} />
                <InfoRow label="Sexo" value={emp.sexo === 'M' ? 'Masculino' : 'Femenino'} />
                <InfoRow label="Estado Civil" value={emp.estado_civil} />
                <InfoRow label="Grado Instrucción" value={emp.grado_instruccion} />
                <InfoRow label="Dirección" value={emp.direccion} />
                <InfoRow label="Departamento" value={emp.departamento} />
                <InfoRow label="Provincia" value={emp.provincia} />
                <InfoRow label="Distrito" value={emp.distrito} />
                <InfoRow label="Celular" value={emp.celular} />
                <InfoRow label="Email" value={emp.email} />
              </div>
            </div>
          )}

          {/* ── DATOS LABORALES ── */}
          <SeccionHeader icon={FiBriefcase} titulo="Datos Laborales" secKey="laboral" />
          {seccionesAbiertas.laboral && (
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0 24px' }}>
                <InfoRow label="Cargo" value={emp.cargo?.nombre} />
                <InfoRow label="Área" value={emp.area?.nombre} />
                <InfoRow label="Unidad" value={emp.unidad} highlight />
                <InfoRow label="Categoría" value={emp.categoria} />
                <InfoRow label="Turno" value={emp.turno?.nombre} />
                <InfoRow label="Tipo Contrato" value={emp.tipo_contrato} />
                <InfoRow label="Fecha Ingreso" value={formatDate(emp.fecha_ingreso)} highlight />
                <InfoRow label="Contrato Desde" value={formatDate(emp.contrato_inicio)} />
                <InfoRow label="Contrato Hasta" value={emp.contrato_fin ? formatDate(emp.contrato_fin) : 'ESTABLE'} />
                <InfoRow label="Sueldo Base" value={formatMoney(emp.sueldo_base)} highlight />
                <InfoRow label="Bono Regular" value={formatMoney(emp.bono_regular)} />
                <InfoRow label="Concepto" value={emp.concepto} />
                <InfoRow label="Situación" value={emp.situacion_contractual} />
                <InfoRow label="TESEO" value={emp.teseo ? 'Sí' : 'No'} />
                {emp.situacion_contractual === 'CESADO' && (
                  <>
                    <InfoRow label="Fecha Cese" value={formatDate(emp.fecha_cese)} />
                    <InfoRow label="Motivo Cese" value={emp.motivo_cese} />
                  </>
                )}
              </div>
              {/* Antigüedad detallada */}
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h5 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--accent)' }}>📅 Antigüedad</h5>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                  <span><strong>Empresa:</strong> {ficha.antiguedad.empresa.anios}a {ficha.antiguedad.empresa.meses}m {ficha.antiguedad.empresa.dias}d</span>
                  <span><strong>Previa reconocida:</strong> {ficha.antiguedad.previa.anios}a {ficha.antiguedad.previa.meses}m {ficha.antiguedad.previa.dias}d</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}><strong>Total:</strong> {ficha.antiguedad.total.anios}a {ficha.antiguedad.total.meses}m {ficha.antiguedad.total.dias}d</span>
                </div>
              </div>
            </div>
          )}

          {/* ── PENSIÓN Y BENEFICIOS ── */}
          <SeccionHeader icon={FiShield} titulo="Sistema de Pensiones y Beneficios" secKey="pension" />
          {seccionesAbiertas.pension && (
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0 24px' }}>
                <InfoRow label="Sistema Pensión" value={`${emp.sistema_pension?.nombre || '-'}${emp.sistema_pension?.porcentaje ? ` (${emp.sistema_pension.porcentaje}%)` : ''}`} />
                <InfoRow label="CUSPP" value={emp.cuspp} />
                <InfoRow label="Banco" value={emp.banco} />
                <InfoRow label="Cuenta Bancaria" value={emp.cuenta_bancaria} />
                <InfoRow label="CCI" value={emp.cci} />
                <InfoRow label="Asig. Familiar" value={emp.tiene_asignacion_familiar ? `Sí — ${formatMoney(emp.val_asig_familiar)}` : 'No'} />
                <InfoRow label="N° Hijos" value={emp.numero_hijos} />
                <InfoRow label="EsSalud +Vida" value={emp.essalud_vida ? `Sí — ${formatMoney(emp.val_essalud_vida)}` : 'No'} />
              </div>
            </div>
          )}

          {/* ── RESUMEN DE TAREO ── */}
          <SeccionHeader icon={FiTrendingUp} titulo="Resumen Acumulado de Tareo" secKey="resumenTareo" badge={`${ficha.resumen_tareo.meses_tareados} meses`} />
          {seccionesAbiertas.resumenTareo && (
            <div className="card">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {TAREO_KEYS.map(key => {
                  const tipo = TIPOS_TAREO[key];
                  const val = ficha.resumen_tareo[`total_${key}`] || 0;
                  if (val === 0) return null;
                  return (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', borderRadius: '8px',
                      background: `${tipo.color}18`, border: `1px solid ${tipo.color}40`,
                    }}>
                      <span style={{
                        display: 'inline-block', width: '24px', height: '24px', borderRadius: '6px',
                        background: tipo.color, color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                        textAlign: 'center', lineHeight: '24px',
                      }}>{tipo.label}</span>
                      <span style={{ fontSize: '0.82rem' }}>{tipo.nombre}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{val}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <StatCard label="Total Días Acumulados" value={parseFloat(ficha.resumen_tareo.total_dias_trabajados || 0).toFixed(1)} icon={FiCalendar} color="#10b981" />
                <StatCard label="Total Faltas" value={ficha.resumen_tareo.total_f || 0} icon={FiAlertTriangle} color="#ef4444" />
                <StatCard label="Total Vacaciones" value={ficha.resumen_tareo.total_v || 0} icon={FiAward} color="#8b5cf6" />
                <StatCard label="Total Permisos" value={ficha.resumen_tareo.total_p || 0} icon={FiClock} color="#f59e0b" />
                <StatCard label="Total Desc. Médicos" value={ficha.resumen_tareo.total_dm || 0} icon={FiShield} color="#06b6d4" />
              </div>
            </div>
          )}

          {/* ── TAREO HISTÓRICO POR MES ── */}
          <SeccionHeader icon={FiCalendar} titulo="Tareo Histórico por Mes" secKey="tareo" badge={`${ficha.tareo_historico.length} meses`} />
          {seccionesAbiertas.tareo && (
            <div className="card" style={{ overflowX: 'auto' }}>
              {ficha.tareo_historico.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No hay registros de tareo.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid var(--border-color)', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>Período</th>
                      {TAREO_KEYS.map(key => (
                        <th key={key} style={{
                          padding: '4px 6px', textAlign: 'center', borderBottom: '2px solid var(--border-color)',
                          color: TIPOS_TAREO[key].color, fontWeight: 700, fontSize: '0.72rem',
                        }} title={TIPOS_TAREO[key].nombre}>
                          {TIPOS_TAREO[key].label}
                        </th>
                      ))}
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--border-color)', fontWeight: 700, color: 'var(--accent)' }}>Días</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>Total</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border-color)' }}>Bono</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border-color)' }}>Viáticos</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border-color)' }}>Aliment.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.tareo_historico.map((t, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
                          {MESES[t.mes - 1]?.substring(0, 3)} {t.anio}
                        </td>
                        {TAREO_KEYS.map(key => {
                          const val = t[key] || 0;
                          return (
                            <td key={key} style={{
                              padding: '4px 6px', textAlign: 'center',
                              fontWeight: val > 0 ? 600 : 400,
                              color: val > 0 ? TIPOS_TAREO[key].color : 'var(--text-muted)',
                              fontSize: '0.78rem',
                            }}>
                              {val > 0 ? val : '·'}
                            </td>
                          );
                        })}
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: 'var(--accent)' }}>{t.dias}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600 }}>{parseFloat(t.total_dias || 0).toFixed(1)}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.78rem' }}>{t.bono > 0 ? formatMoney(t.bono) : '-'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.78rem' }}>{t.viaticos > 0 ? formatMoney(t.viaticos) : '-'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.78rem' }}>{t.alimentacion > 0 ? formatMoney(t.alimentacion) : '-'}</td>
                      </tr>
                    ))}
                    {/* Fila de totales */}
                    <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700, borderTop: '2px solid var(--accent)' }}>
                      <td style={{ padding: '8px', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>TOTAL</td>
                      {TAREO_KEYS.map(key => {
                        const total = ficha.tareo_historico.reduce((s, t) => s + (t[key] || 0), 0);
                        return (
                          <td key={key} style={{
                            padding: '4px 6px', textAlign: 'center',
                            color: total > 0 ? TIPOS_TAREO[key].color : 'var(--text-muted)',
                          }}>
                            {total > 0 ? total : '·'}
                          </td>
                        );
                      })}
                      <td style={{ padding: '8px', textAlign: 'center', color: 'var(--accent)' }}>
                        {ficha.tareo_historico.reduce((s, t) => s + (t.dias || 0), 0)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {ficha.tareo_historico.reduce((s, t) => s + parseFloat(t.total_dias || 0), 0).toFixed(1)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {formatMoney(ficha.tareo_historico.reduce((s, t) => s + parseFloat(t.bono || 0), 0))}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {formatMoney(ficha.tareo_historico.reduce((s, t) => s + parseFloat(t.viaticos || 0), 0))}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {formatMoney(ficha.tareo_historico.reduce((s, t) => s + parseFloat(t.alimentacion || 0), 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── HISTORIAL DE PLANILLA ── */}
          <SeccionHeader icon={FiDollarSign} titulo="Historial de Planilla" secKey="planilla" badge={`${ficha.planilla_historico.length} boletas`} />
          {seccionesAbiertas.planilla && (
            <div className="card" style={{ overflowX: 'auto' }}>
              {ficha.planilla_historico.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No hay registros de planilla.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <StatCard label="Total Ingresos" value={formatMoney(ficha.resumen_planilla.total_ingresos_acumulado)} icon={FiTrendingUp} color="#10b981" />
                    <StatCard label="Total Descuentos" value={formatMoney(ficha.resumen_planilla.total_descuentos_acumulado)} icon={FiAlertTriangle} color="#ef4444" />
                    <StatCard label="Total Neto" value={formatMoney(ficha.resumen_planilla.total_neto_acumulado)} icon={FiDollarSign} color="#3b82f6" />
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Período</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>Días</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border-color)' }}>Rem. Básica</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border-color)' }}>Asig. Fam.</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border-color)' }}>Bonos</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border-color)' }}>Total Ing.</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border-color)' }}>Total Desc.</th>
                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '2px solid var(--border-color)', color: 'var(--accent)', fontWeight: 700 }}>Neto</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ficha.planilla_historico.map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{MESES[p.mes - 1]?.substring(0, 3)} {p.anio}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{p.dias_trabajados}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatMoney(p.remuneracion_basica)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatMoney(p.asignacion_familiar)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatMoney(parseFloat(p.bonos || 0) + parseFloat(p.bono_regular || 0))}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{formatMoney(p.total_ingresos)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', color: '#ef4444' }}>{formatMoney(p.total_descuentos)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{formatMoney(p.neto_pagar)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <span className={`badge ${p.planilla_estado === 'APROBADA' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem' }}>
                              {p.planilla_estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* ── AMONESTACIONES ── */}
          <SeccionHeader icon={FiAlertTriangle} titulo="Amonestaciones" secKey="amonestaciones" badge={ficha.amonestaciones.length > 0 ? `${ficha.amonestaciones.length}` : null} />
          {seccionesAbiertas.amonestaciones && (
            <div className="card">
              {ficha.amonestaciones.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin amonestaciones registradas. ✅</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ficha.amonestaciones.map(a => (
                    <div key={a.id} style={{
                      display: 'flex', gap: '12px', padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                      alignItems: 'flex-start',
                    }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px', flexShrink: 0,
                        background: 'var(--accent)',
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.tipo}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{formatDate(a.fecha)}</span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-primary)' }}>{a.motivo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CONTRATOS ── */}
          <SeccionHeader icon={FiFileText} titulo="Historial de Contratos" secKey="contratos" badge={`${ficha.contratos.length}`} />
          {seccionesAbiertas.contratos && (
            <div className="card">
              {ficha.contratos.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin contratos registrados.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ficha.contratos.map(c => (
                    <div key={c.id} style={{
                      display: 'flex', gap: '12px', padding: '10px 14px', borderRadius: '8px',
                      border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                      alignItems: 'center', flexWrap: 'wrap',
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'var(--accent)', color: '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                        fontSize: '0.85rem', flexShrink: 0,
                      }}>#{c.contrato_numero}</div>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {formatDate(c.fecha_inicio)} → {c.fecha_fin ? formatDate(c.fecha_fin) : 'ESTABLE'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {c.tipo_contrato} · {c.cargo} · {c.area} · {formatMoney(c.sueldo)}
                        </div>
                      </div>
                      <span className={`badge ${c.situacion === 'VIGENTE' ? 'badge-success' : c.situacion === 'CESADO' ? 'badge-danger' : 'badge-warning'}`}>
                        {c.situacion}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VACACIONES ── */}
          <SeccionHeader icon={FiAward} titulo="Vacaciones" secKey="vacaciones" badge={`${ficha.vacaciones.dias_pendientes}d pendientes`} />
          {seccionesAbiertas.vacaciones && (
            <div className="card">
              {ficha.vacaciones.periodos.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin periodos de vacaciones registrados.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Año Laboral</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>Días Derecho</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>Días Gozados</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--border-color)', fontWeight: 700, color: 'var(--accent)' }}>Pendientes</th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.vacaciones.periodos.map((v, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{v.anio_laboral}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{v.dias_derecho}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{v.dias_gozados}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: v.dias_pendientes > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {v.dias_pendientes}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <span className={`badge ${v.estado === 'VENCIDO' ? 'badge-danger' : v.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.68rem' }}>
                            {v.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      )}

      {!ficha && !loading && !loadingEmpleados && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <FiUser size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <h3 style={{ marginBottom: '8px' }}>Selecciona un empleado</h3>
          <p>Busca y selecciona un empleado para ver su ficha completa.</p>
        </div>
      )}
    </div>
  );
}

export default FichaPersonal;
