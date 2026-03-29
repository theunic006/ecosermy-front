import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiLogOut } from 'react-icons/fi';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import { toast } from 'react-toastify';
import { UNIDADES } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';

function Usuarios() {
  const { hasPermission } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalForm, setModalForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [],
    is_active: true,
    unidad: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
      ]);
      setUsuarios(usersRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelected(null);
    setForm({ name: '', email: '', password: '', password_confirmation: '', roles: [], is_active: true, unidad: '' });
    setErrors({});
    setModalForm(true);
  };

  const handleEdit = (user) => {
    setSelected(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      password_confirmation: '',
      roles: user.roles?.map(r => r.name) || [],
      is_active: user.is_active,
      unidad: user.unidad || [],
    });
    setErrors({});
    setModalForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Usuario eliminado');
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleToggle = async (user) => {
    try {
      await api.patch(`/users/${user.id}/toggle-status`);
      toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'}`);
      cargarDatos();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const payload = { ...form };
      if (selected && !payload.password) {
        delete payload.password;
        delete payload.password_confirmation;
      }
      if (selected) {
        await api.put(`/users/${selected.id}`, payload);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/users', payload);
        toast.success('Usuario creado');
      }
      setModalForm(false);
      cargarDatos();
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      toast.error(error.response?.data?.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const [cerrandoSesion, setCerrandoSesion] = useState({});

  const handleLogoutUsuario = async (user) => {
    if (!window.confirm(`\u00bfCerrar la sesi\u00f3n activa de ${user.name}?`)) return;
    setCerrandoSesion(prev => ({ ...prev, [user.id]: true }));
    try {
      await api.post(`/users/${user.id}/logout`);
      toast.success(`Sesi\u00f3n de ${user.name} cerrada`);
      await cargarDatos();
    } catch (error) {
      toast.error('Error al cerrar la sesi\u00f3n');
    } finally {
      setCerrandoSesion(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Unidad',
      render: (row) => {
        const unidades = Array.isArray(row.unidad) ? row.unidad : (row.unidad ? [row.unidad] : []);
        if (unidades.length === 0) return <span style={{ color: '#9ca3af', fontSize: '0.85em' }}>Sin restricción</span>;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {unidades.map(u => (
              <span key={u} className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '0.78em' }}>{u}</span>
            ))}
          </div>
        );
      },
      width: '160px'
    },
    {
      header: 'Rol',
      render: (row) => (
        <span className="badge badge-info">{row.roles?.[0]?.name || 'Sin rol'}</span>
      ),
      width: '120px'
    },
    {
      header: 'Estado',
      render: (row) => (
        <span className={`badge ${row.is_active ? 'badge-success' : 'badge-danger'}`}>
          {row.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
      width: '90px'
    },
    {
      header: 'Sesi\u00f3n',
      width: '115px',
      render: (row) => {
        const activa = (row.tokens_count || 0) > 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
              background: activa ? '#22c55e' : '#d1d5db',
              boxShadow: activa ? '0 0 0 3px rgba(34,197,94,0.22)' : 'none',
            }} />
            <span style={{ fontSize: '0.79rem', fontWeight: activa ? 600 : 400, color: activa ? '#16a34a' : '#9ca3af' }}>
              {activa ? 'En l\u00ednea' : 'Sin sesi\u00f3n'}
            </span>
          </div>
        );
      }
    },
    ...(hasPermission('usuarios.editar') || hasPermission('usuarios.eliminar') ? [{
      header: 'Acciones',
      width: '170px',
      render: (row) => (
        <div className="table-actions">
          {hasPermission('usuarios.editar') && (
            <button className="btn-icon-sm" title="Editar" onClick={() => handleEdit(row)}>
              <FiEdit2 size={14} />
            </button>
          )}
          {hasPermission('usuarios.editar') && (
            <button className="btn-icon-sm" title={row.is_active ? 'Desactivar' : 'Activar'} onClick={() => handleToggle(row)}>
              {row.is_active ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
            </button>
          )}
          {hasPermission('usuarios.editar') && (
            <button
              className="btn-icon-sm"
              title={(row.tokens_count || 0) > 0 ? `Cerrar sesi\u00f3n de ${row.name}` : 'Sin sesi\u00f3n activa'}
              onClick={() => handleLogoutUsuario(row)}
              disabled={cerrandoSesion[row.id] || (row.tokens_count || 0) === 0}
              style={{
                color: (row.tokens_count || 0) > 0 ? '#f87171' : '#d1d5db',
                cursor: (row.tokens_count || 0) === 0 ? 'default' : 'pointer',
                opacity: cerrandoSesion[row.id] ? 0.5 : 1,
              }}
            >
              {cerrandoSesion[row.id] ? <span style={{ fontSize: '0.7rem' }}>...</span> : <FiLogOut size={14} />}
            </button>
          )}
          {hasPermission('usuarios.eliminar') && (
            <button className="btn-icon-sm btn-danger" title="Eliminar" onClick={() => handleDelete(row.id)}>
              <FiTrash2 size={14} />
            </button>
          )}
        </div>
      )
    }] : []),
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Gestión de Usuarios</h2>
        <div className="page-actions">
          {hasPermission('usuarios.crear') && (
            <button className="btn-primary" onClick={handleNew}>
              <FiPlus size={16} /> Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={usuarios} searchable pageSize={10} />
      </div>

      <Modal isOpen={modalForm} onClose={() => setModalForm(false)}
        title={selected ? 'Editar Usuario' : 'Nuevo Usuario'} size="medium">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className={errors.name ? 'error' : ''} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className={errors.email ? 'error' : ''} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label>{selected ? 'Nueva Contraseña' : 'Contraseña *'}</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                className={errors.password ? 'error' : ''} />
              {errors.password && <span className="form-error">{errors.password}</span>}
              {selected && <small>Dejar en blanco para no cambiar</small>}
            </div>
            <div className="form-group">
              <label>Confirmar Contraseña</label>
              <input type="password" name="password_confirmation" value={form.password_confirmation}
                onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Rol *</label>
              <select name="roles" value={form.roles[0] || ''} onChange={(e) => setForm({ ...form, roles: e.target.value ? [e.target.value] : [] })}
                className={errors.roles ? 'error' : ''}>
                <option value="">Seleccione...</option>
                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              {errors.roles && <span className="form-error">{errors.roles}</span>}
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Unidades (restricción de acceso)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: 6 }}>
                {UNIDADES.map(u => (
                  <label key={u} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '6px 12px', border: form.unidad.includes(u) ? '2px solid #3b82f6' : '1px solid #d1d5db', borderRadius: 6, backgroundColor: form.unidad.includes(u) ? '#dbeafe' : 'transparent', fontWeight: form.unidad.includes(u) ? 600 : 400, color: form.unidad.includes(u) ? '#1e40af' : 'inherit', transition: 'all 0.15s' }}>
                    <input
                      type="checkbox"
                      checked={form.unidad.includes(u)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, unidad: [...form.unidad, u] });
                        } else {
                          setForm({ ...form, unidad: form.unidad.filter(x => x !== u) });
                        }
                      }}
                      style={{ accentColor: '#3b82f6' }}
                    />
                    {u}
                  </label>
                ))}
              </div>
              <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Sin selección = sin restricción (accede a todas las unidades)</small>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
                Usuario Activo
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalForm(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Guardando...' : (selected ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Usuarios;
