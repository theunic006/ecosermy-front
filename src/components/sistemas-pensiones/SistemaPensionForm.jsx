import { useState, useEffect } from 'react';
import { createSistemaPension, updateSistemaPension } from '../../services/sistemaPensionService';
import { toast } from 'react-toastify';

function SistemaPensionForm({ sistemaPension, onSaved, onCancel }) {
  const [form, setForm] = useState({
    tipo: 'AFP',
    nombre: '',
    aporte: '',
    comision: '',
    seguro: '',
    activo: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (sistemaPension) {
      setForm({
        tipo: sistemaPension.tipo || 'AFP',
        nombre: sistemaPension.nombre || '',
        aporte: sistemaPension.aporte || '',
        comision: sistemaPension.comision || '',
        seguro: sistemaPension.seguro || '',
        activo: sistemaPension.activo !== undefined ? sistemaPension.activo : true,
      });
    }
  }, [sistemaPension]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.tipo) {
      newErrors.tipo = 'El tipo es obligatorio';
    }
    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        aporte: parseFloat(form.aporte) || 0,
        comision: parseFloat(form.comision) || 0,
        seguro: parseFloat(form.seguro) || 0,
      };

      let sistemaPensionGuardado;
      if (sistemaPension) {
        sistemaPensionGuardado = await updateSistemaPension(sistemaPension.id, payload);
        toast.success('Sistema de pensión actualizado correctamente');
      } else {
        sistemaPensionGuardado = await createSistemaPension(payload);
        toast.success('Sistema de pensión creado correctamente');
      }
      onSaved(sistemaPensionGuardado, !sistemaPension);
    } catch (error) {
      console.error('Error al guardar sistema de pensión:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar el sistema de pensión';
      toast.error(mensaje);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Tipo <span style={{ color: 'red' }}>*</span></label>
        <select
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          className={errors.tipo ? 'error' : ''}
        >
          <option value="AFP">AFP</option>
          <option value="ONP">ONP</option>
        </select>
        {errors.tipo && <span className="form-error">{errors.tipo}</span>}
      </div>

      <div className="form-group">
        <label>Nombre <span style={{ color: 'red' }}>*</span></label>
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej: AFP/INTEGRA-MIXTA"
          className={errors.nombre ? 'error' : ''}
          autoFocus
        />
        {errors.nombre && <span className="form-error">{errors.nombre}</span>}
      </div>

      <div className="form-group">
        <label>Aporte (%)</label>
        <input
          type="number"
          name="aporte"
          value={form.aporte}
          onChange={handleChange}
          placeholder="Ej: 10.00"
          step="0.01"
          min="0"
          max="100"
        />
      </div>

      <div className="form-group">
        <label>Comisión (%)</label>
        <input
          type="number"
          name="comision"
          value={form.comision}
          onChange={handleChange}
          placeholder="Ej: 1.47"
          step="0.01"
          min="0"
          max="100"
        />
      </div>

      <div className="form-group">
        <label>Seguro (%)</label>
        <input
          type="number"
          name="seguro"
          value={form.seguro}
          onChange={handleChange}
          placeholder="Ej: 1.37"
          step="0.01"
          min="0"
          max="100"
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
          />
          <span>Activo</span>
        </label>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : sistemaPension ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}

export default SistemaPensionForm;
