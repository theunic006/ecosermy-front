import { useState, useEffect } from 'react';
import { createCargo, updateCargo } from '../../services/cargoService';
import { toast } from 'react-toastify';

function CargoForm({ cargo, onSaved, onCancel }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cargo) {
      setForm({
        nombre: cargo.nombre || '',
        descripcion: cargo.descripcion || '',
        activo: cargo.activo !== undefined ? cargo.activo : true,
      });
    }
  }, [cargo]);

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
      let cargoGuardado;
      if (cargo) {
        cargoGuardado = await updateCargo(cargo.id, form);
        toast.success('Cargo actualizado correctamente');
      } else {
        cargoGuardado = await createCargo(form);
        toast.success('Cargo creado correctamente');
      }
      // Pasar el cargo guardado y si es nuevo al callback
      onSaved(cargoGuardado, !cargo);
    } catch (error) {
      console.error('Error al guardar cargo:', error);
      const mensaje = error.response?.data?.message || 'Error al guardar el cargo';
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
        <label>Nombre del Cargo <span style={{ color: 'red' }}>*</span></label>
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej: Gerente General"
          className={errors.nombre ? 'error' : ''}
          autoFocus
        />
        {errors.nombre && <span className="form-error">{errors.nombre}</span>}
      </div>

      <div className="form-group">
        <label>Descripción</label>
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Descripción del cargo"
          rows={4}
          className={errors.descripcion ? 'error' : ''}
        ></textarea>
        {errors.descripcion && <span className="form-error">{errors.descripcion}</span>}
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
          {submitting ? 'Guardando...' : cargo ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}

export default CargoForm;
