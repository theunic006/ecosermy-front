import { useState, useEffect } from 'react';
import { createArea, updateArea } from '../../services/areaService';
import { toast } from 'react-toastify';

function AreaForm({ area, onSaved, onCancel }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (area) {
      setForm({
        nombre: area.nombre || '',
        descripcion: area.descripcion || '',
        activo: area.activo !== undefined ? area.activo : true,
      });
    }
  }, [area]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
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
      let areaGuardada;
      if (area) {
        areaGuardada = await updateArea(area.id, form);
        toast.success('Área actualizada correctamente');
      } else {
        areaGuardada = await createArea(form);
        toast.success('Área creada correctamente');
      }
      // Pasar el área guardada y si es nueva al callback
      onSaved(areaGuardada, !area);
    } catch (error) {
      console.error('Error al guardar área:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar el área';
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
      <div className="modal-body">
        <div className="form-group">
          <label>Nombre del Área <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            name="nombre"
            className={`form-input ${errors.nombre ? 'error' : ''}`}
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej: RELAVERA, MANTENIMIENTO, etc."
            autoFocus
          />
          {errors.nombre && <span className="form-error">{errors.nombre}</span>}
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            className="form-input"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Descripción opcional del área"
            rows="3"
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
            <span>Área activa</span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : (area ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
}

export default AreaForm;
