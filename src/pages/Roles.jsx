import { useState, useEffect, useMemo, Fragment } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';
import { toast } from 'react-toastify';

// Agrupar permisos por página/módulo para mostrar en el grid
const PERMISSION_GROUPS = [
  { label: 'Dashboard',              module: 'dashboard',      actions: ['ver'] },
  { label: 'Personal',               module: 'empleados',      actions: ['ver', 'crear', 'editar', 'eliminar', 'editar_sueldo', 'editar_bono', 'editar_asig_familiar'] },
  { label: 'Cesados',                module: 'cesados',        actions: ['ver'] },
  { label: 'Historial Contratos',    module: 'contratos',      actions: ['ver', 'editar'] },
  { label: 'Cambios de Personal',     module: 'cambios_personal', actions: ['ver'] },
  { label: 'Áreas',                  module: 'areas',          actions: ['ver', 'crear', 'editar', 'eliminar'] },
  { label: 'Cargos',                 module: 'cargos',         actions: ['ver', 'crear', 'editar', 'eliminar'] },
  { label: 'Sistemas de Pensiones',  module: 'pensiones',      actions: ['ver', 'editar'] },
  { label: 'UIT',                    module: 'uit',            actions: ['ver', 'editar'] },
  { label: 'Tareo / Asistencia',     module: 'tareo',          actions: ['ver', 'editar', 'registrar_cese'] },
  { label: 'Planilla',               module: 'planilla',       actions: ['ver', 'editar', 'eliminar'] },
  { label: 'Boletas',                module: 'boletas',        actions: ['ver'] },
  { label: 'Tarjeta de Tareo',        module: 'tarjeta_tareo',  actions: ['ver'] },
  { label: 'Simulaciones',           module: 'simulaciones',   actions: ['ver'] },
  { label: 'Formato AFP',            module: 'formato',        actions: ['ver'] },
  { label: 'Liquidaciones',          module: 'liquidaciones',  actions: ['ver', 'editar', 'eliminar'] },
  { label: 'Vacaciones',             module: 'vacaciones',     actions: ['ver', 'editar'] },
  { label: 'Reportes',               module: 'reportes',       actions: ['ver', 'exportar'] },
  { label: 'Configuración',          module: 'configuracion',  actions: ['ver', 'editar'] },
  { label: 'Usuarios',               module: 'usuarios',       actions: ['ver', 'crear', 'editar', 'eliminar'] },
  { label: 'Roles',                  module: 'roles',          actions: ['ver', 'crear', 'editar', 'eliminar'] },
  { label: 'Historial',               module: 'historial',      actions: ['ver'] },
];

const ACTION_LABELS = {
  ver: 'Ver',
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
  exportar: 'Exportar',
  editar_sueldo: 'Ed. Sueldo',
  editar_bono: 'Ed. Bono',
  editar_asig_familiar: 'Ed. Asig. Fam.',
  registrar_cese: 'Reg. Cese',
};

// Todas las acciones posibles en orden
const ALL_ACTIONS = ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'editar_sueldo', 'editar_bono', 'editar_asig_familiar', 'registrar_cese'];

// Años disponibles para restricción de tareo (dinámico: desde 2019 hasta año actual)
const _cy = new Date().getFullYear();
const TAREO_YEARS = Array.from({ length: _cy - 2018 }, (_, i) => 2019 + i);

// Meses disponibles para restricción de tareo
const TAREO_MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

// Columnas con restricción de acceso en Tareo
const TAREO_COLUMNAS = [
  { key: 'bono',          label: 'Bono' },
  { key: 'viaticos',     label: 'Viáticos' },
  { key: 'alimentacion', label: 'Alimentación' },
  { key: 'hora_extra',   label: 'H. Extra' },
  { key: 'adelanto',     label: 'Adelanto' },
  { key: 'otros_desc',   label: 'Otros Desc.' },
  { key: 'cobro_vac',    label: 'Cobro Vac.' },
];

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPermisos, setFormPermisos] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data || []);
    } catch {
      toast.error('Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelected(null);
    setFormName('');
    setFormPermisos(new Set());
    setModalOpen(true);
  };

  const handleEdit = (role) => {
    setSelected(role);
    setFormName(role.name);
    setFormPermisos(new Set(role.permissions.map(p => p.name)));
    setModalOpen(true);
  };

  const handleDelete = async (role) => {
    if (role.name === 'Administrador') {
      toast.warning('No se puede eliminar el rol Administrador');
      return;
    }
    if (!confirm(`¿Eliminar el rol "${role.name}"?`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      toast.success('Rol eliminado');
      cargarRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const togglePermiso = (permiso) => {
    setFormPermisos(prev => {
      const next = new Set(prev);
      if (next.has(permiso)) {
        next.delete(permiso);
      } else {
        next.add(permiso);
      }
      return next;
    });
  };

  const toggleModulo = (module, actions) => {
    setFormPermisos(prev => {
      const next = new Set(prev);
      const permisos = actions.map(a => `${module}.${a}`);
      const allChecked = permisos.every(p => next.has(p));
      if (allChecked) {
        permisos.forEach(p => next.delete(p));
      } else {
        permisos.forEach(p => next.add(p));
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allPermisos = [
      ...PERMISSION_GROUPS.flatMap(g => g.actions.map(a => `${g.module}.${a}`)),
      ...TAREO_YEARS.map(y => `tareo.editar_${y}`),
      ...TAREO_MONTHS.map(m => `tareo.editar_mes_${m.value}`),
      ...TAREO_COLUMNAS.map(c => `tareo.editar_${c.key}`),
    ];
    setFormPermisos(prev => {
      const allChecked = allPermisos.every(p => prev.has(p));
      return allChecked ? new Set() : new Set(allPermisos);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.warning('Ingrese el nombre del rol');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        permissions: Array.from(formPermisos),
      };
      if (selected) {
        await api.put(`/roles/${selected.id}`, payload);
        toast.success('Rol actualizado');
      } else {
        await api.post('/roles', payload);
        toast.success('Rol creado');
      }
      setModalOpen(false);
      cargarRoles();
    } catch (error) {
      if (error.response?.data?.errors) {
        const msgs = Object.values(error.response.data.errors).flat();
        msgs.forEach(m => toast.error(m));
      } else {
        toast.error(error.response?.data?.message || 'Error al guardar');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Contar permisos de un rol
  const contarPermisos = (role) => role.permissions?.length || 0;

  // Verificar si es Administrador (no editable en nombre)
  const isAdmin = selected?.name === 'Administrador';

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2><FiShield style={{ marginRight: 8 }} /> Gestión de Roles y Permisos</h2>
        <div className="page-actions">
          <button className="btn-primary" onClick={handleNew}>
            <FiPlus size={16} /> Nuevo Rol
          </button>
        </div>
      </div>

      {/* Tabla de roles */}
      <div className="card">
        <div className="roles-grid">
          {roles.map(role => (
            <div key={role.id} className="role-card">
              <div className="role-card-header">
                <div>
                  <h3>{role.name}</h3>
                  <span className="badge badge-info">{contarPermisos(role)} permisos</span>
                </div>
                <div className="role-card-actions">
                  <button className="btn-icon-sm" title="Editar" onClick={() => handleEdit(role)}>
                    <FiEdit2 size={14} />
                  </button>
                  {role.name !== 'Administrador' && (
                    <button className="btn-icon-sm btn-danger" title="Eliminar" onClick={() => handleDelete(role)}>
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="role-card-permisos">
                {PERMISSION_GROUPS.map(group => {
                  const modulePermisos = group.actions.map(a => `${group.module}.${a}`);
                  const activos = modulePermisos.filter(p => role.permissions?.some(rp => rp.name === p));
                  if (activos.length === 0) return null;
                  return (
                    <div key={group.module} className="role-permiso-tag">
                      <span className="role-permiso-module">{group.label}</span>
                      <span className="role-permiso-actions">
                        {activos.map(p => {
                          const action = p.split('.')[1];
                          return (
                            <span key={p} className="role-permiso-action">
                              {ACTION_LABELS[action] || action}
                            </span>
                          );
                        })}
                      </span>
                    </div>
                  );
                })}
                {/* Años de tareo */}
                {(() => {
                  const activeYears = TAREO_YEARS.filter(y => role.permissions?.some(p => p.name === `tareo.editar_${y}`));
                  if (activeYears.length === 0) return null;
                  return (
                    <div className="role-permiso-tag role-permiso-tag-years">
                      <span className="role-permiso-module">Tareo - Años</span>
                      <span className="role-permiso-actions">
                        {activeYears.length === TAREO_YEARS.length
                          ? <span className="role-permiso-action">Todos</span>
                          : activeYears.map(y => <span key={y} className="role-permiso-action">{y}</span>)
                        }
                      </span>
                    </div>
                  );
                })()}
                {/* Meses de tareo */}
                {(() => {
                  const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                  const activeMonths = TAREO_MONTHS.filter(m => role.permissions?.some(p => p.name === `tareo.editar_mes_${m.value}`));
                  if (activeMonths.length === 0) return null;
                  return (
                    <div className="role-permiso-tag role-permiso-tag-years">
                      <span className="role-permiso-module">Tareo - Meses</span>
                      <span className="role-permiso-actions">
                        {activeMonths.length === 12
                          ? <span className="role-permiso-action">Todos</span>
                          : activeMonths.map(m => <span key={m.value} className="role-permiso-action">{MONTH_NAMES[m.value - 1]}</span>)
                        }
                      </span>
                    </div>
                  );
                })()}
                {/* Columnas de tareo */}
                {(() => {
                  const activeCols = TAREO_COLUMNAS.filter(c => role.permissions?.some(p => p.name === `tareo.editar_${c.key}`));
                  if (activeCols.length === 0) return null;
                  return (
                    <div className="role-permiso-tag role-permiso-tag-years">
                      <span className="role-permiso-module">Tareo - Columnas</span>
                      <span className="role-permiso-actions">
                        {activeCols.length === TAREO_COLUMNAS.length
                          ? <span className="role-permiso-action">Todas</span>
                          : activeCols.map(c => <span key={c.key} className="role-permiso-action">{c.label}</span>)
                        }
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de edición */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={selected ? `Editar Rol: ${selected.name}` : 'Nuevo Rol'} size="large">
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Nombre del Rol *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Supervisor, Consulta..."
              disabled={isAdmin}
              style={{ maxWidth: 300 }}
            />
            {isAdmin && <small style={{ color: 'var(--text-muted)' }}>No se puede cambiar el nombre del rol Administrador</small>}
          </div>

          <div className="permisos-section">
            <div className="permisos-header">
              <h4>Permisos por Página</h4>
              <button type="button" className="btn-sm btn-secondary" onClick={toggleAll}>
                Marcar / Desmarcar Todo
              </button>
            </div>

            <div className="permisos-table-wrap">
              <table className="permisos-table">
                <thead>
                  <tr>
                    <th className="permisos-th-page">Página / Módulo</th>
                    {ALL_ACTIONS.map(a => (
                      <th key={a} className="permisos-th-action">{ACTION_LABELS[a]}</th>
                    ))}
                    <th className="permisos-th-action">Todos</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_GROUPS.map(group => {
                    const permisos = group.actions.map(a => `${group.module}.${a}`);
                    const allChecked = permisos.every(p => formPermisos.has(p));
                    return (
                      <Fragment key={group.module}>
                        <tr>
                          <td className="permisos-td-page">{group.label}</td>
                          {ALL_ACTIONS.map(action => {
                            const permiso = `${group.module}.${action}`;
                            const hasAction = group.actions.includes(action);
                            if (!hasAction) {
                              return <td key={action} className="permisos-td-action permisos-na">—</td>;
                            }
                            return (
                              <td key={action} className="permisos-td-action">
                                <label className="permisos-check">
                                  <input
                                    type="checkbox"
                                    checked={formPermisos.has(permiso)}
                                    onChange={() => togglePermiso(permiso)}
                                  />
                                  <span className={`permisos-check-box ${formPermisos.has(permiso) ? 'checked' : ''}`}>
                                    {formPermisos.has(permiso) && <FiCheck size={12} />}
                                  </span>
                                </label>
                              </td>
                            );
                          })}
                          <td className="permisos-td-action">
                            <label className="permisos-check">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                onChange={() => toggleModulo(group.module, group.actions)}
                              />
                              <span className={`permisos-check-box ${allChecked ? 'checked all' : ''}`}>
                                {allChecked && <FiCheck size={12} />}
                              </span>
                            </label>
                          </td>
                        </tr>
                        {group.module === 'tareo' && (
                          <>
                          <tr className="tareo-years-row">
                            <td colSpan={ALL_ACTIONS.length + 2} className="tareo-years-td">
                              <div className="tareo-years-container">
                                <span className="tareo-years-label">&#128197; Años para editar:</span>
                                {TAREO_YEARS.map(year => {
                                  const perm = `tareo.editar_${year}`;
                                  const checked = formPermisos.has(perm);
                                  return (
                                    <label key={year} className={`tareo-year-check${checked ? ' active' : ''}`}>
                                      <input type="checkbox" checked={checked} onChange={() => togglePermiso(perm)} />
                                      {year}
                                    </label>
                                  );
                                })}
                                <button type="button" className="tareo-year-all-btn" onClick={() => {
                                  setFormPermisos(prev => {
                                    const next = new Set(prev);
                                    const yp = TAREO_YEARS.map(y => `tareo.editar_${y}`);
                                    const allYChecked = yp.every(p => next.has(p));
                                    if (allYChecked) yp.forEach(p => next.delete(p));
                                    else yp.forEach(p => next.add(p));
                                    return next;
                                  });
                                }}>Todos</button>
                                <small className="tareo-years-hint">vacío = sin restricción de año</small>
                              </div>
                            </td>
                          </tr>
                          <tr className="tareo-years-row">
                            <td colSpan={ALL_ACTIONS.length + 2} className="tareo-years-td">
                              <div className="tareo-years-container">
                                <span className="tareo-years-label">&#128197; Meses para editar:</span>
                                {TAREO_MONTHS.map(m => {
                                  const perm = `tareo.editar_mes_${m.value}`;
                                  const checked = formPermisos.has(perm);
                                  return (
                                    <label key={m.value} className={`tareo-year-check${checked ? ' active' : ''}`}>
                                      <input type="checkbox" checked={checked} onChange={() => togglePermiso(perm)} />
                                      {m.label.substring(0, 3)}
                                    </label>
                                  );
                                })}
                                <button type="button" className="tareo-year-all-btn" onClick={() => {
                                  setFormPermisos(prev => {
                                    const next = new Set(prev);
                                    const mp = TAREO_MONTHS.map(m => `tareo.editar_mes_${m.value}`);
                                    const allMChecked = mp.every(p => next.has(p));
                                    if (allMChecked) mp.forEach(p => next.delete(p));
                                    else mp.forEach(p => next.add(p));
                                    return next;
                                  });
                                }}>Todos</button>
                                <small className="tareo-years-hint">vacío = sin restricción de mes</small>
                              </div>
                            </td>
                          </tr>
                          <tr className="tareo-years-row">
                            <td colSpan={ALL_ACTIONS.length + 2} className="tareo-years-td">
                              <div className="tareo-years-container">
                                <span className="tareo-years-label">&#128203; Columnas para editar:</span>
                                {TAREO_COLUMNAS.map(col => {
                                  const perm = `tareo.editar_${col.key}`;
                                  const checked = formPermisos.has(perm);
                                  return (
                                    <label key={col.key} className={`tareo-year-check${checked ? ' active' : ''}`}>
                                      <input type="checkbox" checked={checked} onChange={() => togglePermiso(perm)} />
                                      {col.label}
                                    </label>
                                  );
                                })}
                                <button type="button" className="tareo-year-all-btn" onClick={() => {
                                  setFormPermisos(prev => {
                                    const next = new Set(prev);
                                    const cp = TAREO_COLUMNAS.map(c => `tareo.editar_${c.key}`);
                                    const allCChecked = cp.every(p => next.has(p));
                                    if (allCChecked) cp.forEach(p => next.delete(p));
                                    else cp.forEach(p => next.add(p));
                                    return next;
                                  });
                                }}>Todos</button>
                                <small className="tareo-years-hint">marcar las columnas que el rol puede editar</small>
                              </div>
                            </td>
                          </tr>
                          </>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: 16 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {formPermisos.size} permisos seleccionados
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Guardando...' : (selected ? 'Actualizar Rol' : 'Crear Rol')}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Roles;
