import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import {
  getDescuentosByEmpleado,
  createDescuentoJudicial,
  updateDescuentoJudicial,
  deleteDescuentoJudicial,
} from '../../services/descuentoJudicialService';
import { formatMoney } from '../../utils/helpers';
import { toast } from 'react-toastify';

const FORM_EMPTY = {
  nombre_beneficiario: '',
  apellidos_beneficiario: '',
  monto: '',
  expediente: '',
  juzgado: '',
  numero_cuenta_beneficiario: '',
  banco_beneficiario: '',
  concepto: '',
  activo: true,
  observaciones: '',
};

function DescuentoJudicialModal({ empleado, onDescuentosChange }) {
  const [descuentos, setDescuentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null); // id del registro en edición
  const [form, setForm] = useState(FORM_EMPTY);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, [empleado.id]);

  const actualizarDescuentos = (nuevos) => {
    setDescuentos(nuevos);
    if (onDescuentosChange) onDescuentosChange(nuevos);
  };

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await getDescuentosByEmpleado(empleado.id);
      actualizarDescuentos(data);
    } catch {
      toast.error('Error al cargar descuentos judiciales');
    } finally {
      setLoading(false);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_EMPTY);
    setMostrarForm(true);
  };

  const abrirEditar = (d) => {
    setEditando(d.id);
    setForm({
      nombre_beneficiario: d.nombre_beneficiario,
      apellidos_beneficiario: d.apellidos_beneficiario,
      monto: d.monto,
      expediente: d.expediente || '',
      juzgado: d.juzgado || '',
      numero_cuenta_beneficiario: d.numero_cuenta_beneficiario || '',
      banco_beneficiario: d.banco_beneficiario || '',
      concepto: d.concepto || '',
      activo: d.activo,
      observaciones: d.observaciones || '',
    });
    setMostrarForm(true);
  };

  const cancelarForm = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm(FORM_EMPTY);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.nombre_beneficiario.trim() || !form.apellidos_beneficiario.trim() || !form.monto) {
      toast.error('Nombre, Apellidos y Monto son obligatorios');
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        const actualizado = await updateDescuentoJudicial(editando, form);
        const nuevos = descuentos.map((d) => (d.id === editando ? actualizado : d));
        actualizarDescuentos(nuevos);
        toast.success('Descuento actualizado');
      } else {
        const nuevo = await createDescuentoJudicial({ ...form, empleado_id: empleado.id });
        const nuevos = [nuevo, ...descuentos];
        actualizarDescuentos(nuevos);
        toast.success('Descuento judicial registrado');
      }
      cancelarForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este descuento judicial?')) return;
    try {
      const nuevos = descuentos.filter((d) => d.id !== id);
      actualizarDescuentos(nuevos);
      await deleteDescuentoJudicial(id);
      toast.success('Descuento eliminado');
    } catch {
      toast.error('Error al eliminar');
      cargar();
    }
  };

  const toggleActivo = async (d) => {
    try {
      const actualizado = await updateDescuentoJudicial(d.id, { activo: !d.activo });
      const nuevos = descuentos.map((x) => (x.id === d.id ? actualizado : x));
      actualizarDescuentos(nuevos);
      toast.success(actualizado.activo ? 'Descuento activado' : 'Descuento desactivado');
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const totalActivo = descuentos
    .filter((d) => d.activo)
    .reduce((sum, d) => sum + parseFloat(d.monto || 0), 0);

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Empleado: <strong>{empleado.apellidos}, {empleado.nombres}</strong> — DNI: {empleado.dni}
          </p>
          {descuentos.filter((d) => d.activo).length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>
              Total descuento activo: {formatMoney(totalActivo)}
            </p>
          )}
        </div>
        {!mostrarForm && (
          <button className="btn-primary" onClick={abrirNuevo} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiPlus size={15} /> Nuevo Descuento
          </button>
        )}
      </div>

      {/* Formulario inline */}
      {mostrarForm && (
        <form onSubmit={handleGuardar} style={{ background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {editando ? 'Editar Descuento Judicial' : 'Nuevo Descuento Judicial'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Nombres Beneficiario *</label>
              <input className="form-input" name="nombre_beneficiario" value={form.nombre_beneficiario} onChange={handleChange} placeholder="Ej: María Elena" required />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos Beneficiario *</label>
              <input className="form-input" name="apellidos_beneficiario" value={form.apellidos_beneficiario} onChange={handleChange} placeholder="Ej: Pérez García" required />
            </div>
            <div className="form-group">
              <label className="form-label">Monto a Descontar (S/) *</label>
              <input className="form-input" name="monto" type="number" min="0" step="0.01" value={form.monto} onChange={handleChange} placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label className="form-label">Concepto</label>
              <select className="form-select" name="concepto" value={form.concepto} onChange={handleChange}>
                <option value="">-- Seleccionar --</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Embargo">Embargo</option>
                <option value="Pensión de alimentos">Pensión de alimentos</option>
                <option value="Deuda civil">Deuda civil</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">N° Expediente</label>
              <input className="form-input" name="expediente" value={form.expediente} onChange={handleChange} placeholder="Ej: 00234-2024-JU" />
            </div>
            <div className="form-group">
              <label className="form-label">Juzgado</label>
              <input className="form-input" name="juzgado" value={form.juzgado} onChange={handleChange} placeholder="Ej: 2do Juzgado de Paz Letrado" />
            </div>
            <div className="form-group">
              <label className="form-label">N° Cuenta Beneficiario</label>
              <input className="form-input" name="numero_cuenta_beneficiario" value={form.numero_cuenta_beneficiario} onChange={handleChange} placeholder="Ej: 00-000-000000" maxLength={30} />
            </div>
            <div className="form-group">
              <label className="form-label">Banco Beneficiario</label>
              <select className="form-select" name="banco_beneficiario" value={form.banco_beneficiario} onChange={handleChange}>
                <option value="">-- Seleccionar --</option>
                <option value="Banco de la Nacion">Banco de la Nación</option>
                <option value="BCP">BCP</option>
                <option value="BBVA">BBVA</option>
                <option value="BanBif">BanBif</option>
                <option value="MiBanco">MiBanco</option>
                <option value="InterBank">InterBank</option>
                <option value="ScotiaBank">ScotiaBank</option>
                <option value="Caja Huancayo">Caja Huancayo</option>
                <option value="Caja Arequipa">Caja Arequipa</option>
                <option value="Caja Piura">Caja Piura</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Observaciones</label>
              <textarea className="form-input" name="observaciones" value={form.observaciones} onChange={handleChange} rows={2} placeholder="Notas adicionales..." style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="activo_dj" name="activo" checked={form.activo} onChange={handleChange} style={{ width: 'auto' }} />
              <label htmlFor="activo_dj" className="form-label" style={{ margin: 0 }}>Descuento Activo</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={cancelarForm} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Guardar')}</button>
          </div>
        </form>
      )}

      {/* Lista de descuentos */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>Cargando...</p>
      ) : descuentos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', border: '1px dashed var(--border-color, #e2e8f0)', borderRadius: '8px' }}>
          <FiAlertCircle size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>No hay descuentos judiciales registrados para este empleado.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary, #f1f5f9)', borderBottom: '2px solid var(--border-color, #e2e8f0)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Beneficiario</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Concepto</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Expediente</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Juzgado</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>N° Cuenta</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>Banco</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Monto</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {descuentos.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)', opacity: d.activo ? 1 : 0.55 }}>
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ fontWeight: 600 }}>{d.apellidos_beneficiario}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{d.nombre_beneficiario}</div>
                  </td>
                  <td style={{ padding: '8px 10px' }}>{d.concepto || '-'}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{d.expediente || '-'}</td>
                  <td style={{ padding: '8px 10px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.juzgado || '-'}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{d.numero_cuenta_beneficiario || '-'}</td>
                  <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{d.banco_beneficiario || '-'}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: d.activo ? '#dc2626' : 'var(--text-secondary)' }}>
                    {formatMoney(d.monto)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span
                      className="badge"
                      style={{ backgroundColor: d.activo ? '#dc2626' : '#6b7280', cursor: 'pointer', userSelect: 'none' }}
                      title={d.activo ? 'Click para desactivar' : 'Click para activar'}
                      onClick={() => toggleActivo(d)}
                    >
                      {d.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <div className="table-actions" style={{ justifyContent: 'center' }}>
                      <button className="btn-icon-sm" title="Editar" onClick={() => abrirEditar(d)}>
                        <FiEdit2 size={13} />
                      </button>
                      <button className="btn-icon-sm btn-danger" title="Eliminar" onClick={() => handleEliminar(d.id)}>
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {descuentos.filter((d) => d.activo).length > 1 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-color, #e2e8f0)', background: 'var(--bg-secondary, #f1f5f9)' }}>
                  <td colSpan={6} style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Total activo:</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{formatMoney(totalActivo)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

export default DescuentoJudicialModal;
