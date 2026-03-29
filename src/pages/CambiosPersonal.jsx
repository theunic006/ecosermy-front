import { useState, useEffect } from 'react';
import { FiActivity, FiSearch, FiUser, FiArrowRight, FiClock, FiFilter } from 'react-icons/fi';
import { getCambiosPersonal, getCambiosEmpleado, buscarParaContrato } from '../services/contratoDocumentoService';
import { formatDate } from '../utils/helpers';
import { UNIDADES } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';
import Loading from '../components/common/Loading';

function CambiosPersonal() {
  const { user } = useAuth();
  const { isDark, c } = useThemeColors();
  const [cambios, setCambios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [empleadoFiltro, setEmpleadoFiltro] = useState(null);
  const [campoFiltro, setCampoFiltro] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [filtroUnidad, setFiltroUnidad] = useState('');

  useEffect(() => {
    cargarCambios();
  }, []);

  // Auto-seleccionar unidad si el usuario solo tiene una asignada
  useEffect(() => {
    if (user?.unidad?.length === 1) setFiltroUnidad(user.unidad[0]);
  }, [user]);

  const cargarCambios = async (empleadoId = null, campo = null) => {
    try {
      setLoading(true);
      let data;
      if (empleadoId) {
        data = await getCambiosEmpleado(empleadoId);
      } else {
        data = await getCambiosPersonal({ campo: campo || undefined });
      }
      setCambios(data);
    } catch (error) {
      toast.error('Error al cargar cambios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = async (e) => {
    e?.preventDefault();
    if (!busqueda.trim() || busqueda.trim().length < 2) return;
    try {
      setBuscando(true);
      const data = await buscarParaContrato(busqueda.trim());
      setResultadosBusqueda(data);
    } catch {
      toast.error('Error en la búsqueda');
    } finally {
      setBuscando(false);
    }
  };

  const handleFiltrarEmpleado = (emp) => {
    setEmpleadoFiltro(emp);
    setResultadosBusqueda([]);
    setBusqueda('');
    cargarCambios(emp.id);
  };

  const handleLimpiarFiltro = () => {
    setEmpleadoFiltro(null);
    setCampoFiltro('');
    cargarCambios();
  };

  const handleFiltrarCampo = (campo) => {
    setCampoFiltro(campo);
    if (empleadoFiltro) {
      cargarCambios(empleadoFiltro.id, campo);
    } else {
      cargarCambios(null, campo);
    }
  };

  // Cambios filtrados por unidad (solo los del empleado de esa unidad)
  const cambiosFiltrados = filtroUnidad
    ? cambios.filter(c => c.empleado?.unidad === filtroUnidad)
    : cambios;

  // Campos únicos para el filtro (basados en cambios filtrados)
  const camposUnicos = [...new Set(cambiosFiltrados.map(c => c.campo_label))].sort();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Título */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: c.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiActivity /> Cambios de Personal
        </h1>
        <p style={{ color: c.textSecondary, marginTop: '4px' }}>Historial de cambios realizados en los datos de los empleados</p>
      </div>

      {/* Filtros */}
      <div style={{
        background: c.cardBg, borderRadius: '12px', padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px',
        border: `1px solid ${c.border}`
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Selector de Unidad */}
          <div style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: c.textSecondary, display: 'block', marginBottom: '4px' }}>Unidad</label>
            {user?.unidad?.length === 1 ? (
              <div style={{ padding: '7px 12px', background: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '8px', fontWeight: 700, color: '#1e40af', fontSize: '0.85rem' }}>
                📍 {user.unidad[0]}
              </div>
            ) : user?.unidad?.length > 1 ? (
              <select value={filtroUnidad} onChange={e => setFiltroUnidad(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: '13px' }}>
                <option value="">Todas mis unidades</option>
                {user.unidad.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <select value={filtroUnidad} onChange={e => setFiltroUnidad(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: '13px' }}>
                <option value="">Todas las unidades</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            )}
          </div>

          {/* Buscador de empleado */}
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: c.textSecondary, display: 'block', marginBottom: '4px' }}>
              Filtrar por empleado
            </label>
            <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: c.textSecondary }} />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="DNI o nombre..."
                  style={{
                    width: '100%', padding: '8px 8px 8px 34px', borderRadius: '8px',
                    border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: '13px'
                  }}
                />
              </div>
              <button type="submit" disabled={buscando} style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: '#3498db', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
              }}>
                <FiSearch size={14} />
              </button>
            </form>
          </div>

          {/* Filtro por campo */}
          <div style={{ minWidth: '180px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: c.textSecondary, display: 'block', marginBottom: '4px' }}>
              <FiFilter size={12} /> Filtrar por campo
            </label>
            <select
              value={campoFiltro}
              onChange={e => handleFiltrarCampo(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: '8px',
                border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: '13px'
              }}
            >
              <option value="">Todos los campos</option>
              {camposUnicos.map(campo => (
                <option key={campo} value={campo}>{campo}</option>
              ))}
            </select>
          </div>

          {/* Limpiar */}
          {(empleadoFiltro || campoFiltro) && (
            <button onClick={handleLimpiarFiltro} style={{
              padding: '8px 14px', borderRadius: '8px', border: `1px solid ${c.border}`,
              background: 'transparent', color: c.textSecondary, cursor: 'pointer', fontWeight: '500', fontSize: '13px'
            }}>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {resultadosBusqueda.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {resultadosBusqueda.map(emp => (
              <div key={emp.id} onClick={() => handleFiltrarEmpleado(emp)}
                style={{
                  padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                  border: `1px solid ${c.border}`, background: isDark ? '#1e293b' : '#f8fafc',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px'
                }}
                onMouseOver={e => e.currentTarget.style.background = isDark ? '#334155' : '#e2e8f0'}
                onMouseOut={e => e.currentTarget.style.background = isDark ? '#1e293b' : '#f8fafc'}
              >
                <FiUser size={14} style={{ color: '#3498db' }} />
                <span style={{ fontWeight: '600', color: c.text }}>
                  {emp.apellido_paterno} {emp.apellido_materno}, {emp.nombres}
                </span>
                <span style={{ color: c.textSecondary }}>— DNI: {emp.dni}</span>
              </div>
            ))}
          </div>
        )}

        {/* Empleado seleccionado */}
        {empleadoFiltro && (
          <div style={{
            marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
            background: isDark ? '#1a3a2a' : '#d4edda', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <FiUser size={14} />
            <span style={{ fontWeight: '600' }}>
              Filtrando por: {empleadoFiltro.apellido_paterno} {empleadoFiltro.apellido_materno}, {empleadoFiltro.nombres}
            </span>
            <span style={{ color: '#6c757d' }}>({empleadoFiltro.dni})</span>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div style={{ marginBottom: '16px', fontSize: '13px', color: c.textSecondary }}>
        Total de cambios registrados: <strong style={{ color: c.text }}>{cambiosFiltrados.length}</strong>
      </div>

      {/* Lista de cambios */}
      {loading ? <Loading /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cambiosFiltrados.length === 0 ? (
            <div style={{
              background: c.cardBg, borderRadius: '12px', padding: '40px',
              textAlign: 'center', color: c.textSecondary, border: `1px solid ${c.border}`
            }}>
              <FiActivity size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No se encontraron cambios registrados</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Los cambios se registran automáticamente cuando se modifican datos de los empleados</p>
            </div>
          ) : (
            cambiosFiltrados.map(cambio => (
              <div key={cambio.id} style={{
                background: c.cardBg, borderRadius: '10px', padding: '14px 18px',
                border: `1px solid ${c.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap'
              }}>
                {/* Fecha */}
                <div style={{ minWidth: '120px' }}>
                  <div style={{ fontSize: '12px', color: c.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiClock size={11} /> {formatDate(cambio.created_at)}
                  </div>
                  <div style={{ fontSize: '11px', color: c.textSecondary }}>
                    {cambio.created_at ? new Date(cambio.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>

                {/* Empleado */}
                <div style={{ minWidth: '180px' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: c.text }}>
                    {cambio.empleado?.apellido_paterno} {cambio.empleado?.apellido_materno}
                  </div>
                  <div style={{ fontSize: '11px', color: c.textSecondary }}>
                    {cambio.empleado?.nombres} — {cambio.empleado?.dni}
                  </div>
                </div>

                {/* Campo */}
                <div style={{
                  padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                  background: isDark ? '#1e3a5f' : '#e3f2fd', color: isDark ? '#90caf9' : '#1565c0',
                  whiteSpace: 'nowrap'
                }}>
                  {cambio.campo_label}
                </div>

                {/* Cambio: anterior → nuevo */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '12px',
                    background: isDark ? '#3b1818' : '#fde8e8', color: isDark ? '#f87171' : '#c0392b',
                    textDecoration: 'line-through', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {cambio.valor_anterior || '(vacío)'}
                  </span>
                  <FiArrowRight size={14} style={{ color: c.textSecondary, flexShrink: 0 }} />
                  <span style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                    background: isDark ? '#1a3a2a' : '#e8f5e9', color: isDark ? '#4ade80' : '#27ae60',
                    maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {cambio.valor_nuevo || '(vacío)'}
                  </span>
                </div>

                {/* Modificado por */}
                {cambio.modificador && (
                  <div style={{ fontSize: '11px', color: c.textSecondary, minWidth: '100px', textAlign: 'right' }}>
                    por: <strong>{cambio.modificador.name}</strong>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CambiosPersonal;
