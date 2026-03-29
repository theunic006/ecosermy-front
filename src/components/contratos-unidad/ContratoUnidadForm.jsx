import { useState, useEffect } from 'react';
import { createContratoUnidad, updateContratoUnidad } from '../../services/contratoUnidadService';
import { UNIDADES } from '../../utils/constants';
import { toast } from 'react-toastify';

function ContratoUnidadForm({ contrato, onSaved, onCancel }) {
  const [form, setForm] = useState({ unidad: '', descripcion: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (contrato) {
      setForm({ unidad: contrato.unidad || '', descripcion: contrato.descripcion || '' });
    }
  }, [contrato]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.unidad) newErrors.unidad = 'Selecciona una unidad';
    if (!form.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validate()) return;
    setSubmitting(true);
    try {
      let saved;
      if (contrato) {
        saved = await updateContratoUnidad(contrato.id, form);
        toast.success('Contrato actualizado');
      } else {
        saved = await createContratoUnidad(form);
        toast.success('Contrato creado');
      }
      onSaved(saved, !contrato);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al guardar';
      toast.error(msg);
      if (error.response?.data?.errors) setErrors(error.response.data.errors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Unidad <span style={{ color: 'red' }}>*</span></label>
        <select
          name="unidad"
          value={form.unidad}
          onChange={handleChange}
          className={errors.unidad ? 'error' : ''}
        >
          <option value="">— Seleccionar unidad —</option>
          {UNIDADES.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        {errors.unidad && <span className="form-error">{errors.unidad}</span>}
      </div>

      <div className="form-group">
        <label>Descripción del Contrato <span style={{ color: 'red' }}>*</span></label>
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Descripción del contrato..."
          rows={5}
          className={errors.descripcion ? 'error' : ''}
          autoFocus={!contrato}
        />
        {errors.descripcion && <span className="form-error">{errors.descripcion}</span>}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : contrato ? 'Actualizar' : 'Crear Contrato'}
        </button>
      </div>
    </form>
  );
}

export default ContratoUnidadForm;
