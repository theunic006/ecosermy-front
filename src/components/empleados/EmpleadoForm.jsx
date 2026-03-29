import { useState, useEffect } from 'react';
import { FiPlus, FiLock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { createEmpleado, updateEmpleado } from '../../services/empleadoService';
import { getContratosUnidad } from '../../services/contratoUnidadService';
import { SITUACIONES, SISTEMAS_PENSIONES, BANCOS, GRADOS_INSTRUCCION, UNIDADES } from '../../utils/constants';
import { PAISES, DEPARTAMENTOS, PROVINCIAS, DISTRITOS } from '../../utils/ubigeo';
import { toast } from 'react-toastify';
import ConceptoSelect from './ConceptoSelect';

function EmpleadoForm({ empleado, catalogos, onSaved, onCancel }) {
  const [form, setForm] = useState({
    codigo_trabajador: '',
    dni: '',
    apellidos: '',
    nombres: '',
    fecha_nacimiento: '',
    grado_instruccion: '',
    cuspp: '',
    sexo: 'M',
    estado_civil: 'SOLTERO',
    direccion: '',
    pais: 'PERÚ',
    departamento: '',
    provincia: '',
    distrito: '',
    celular: '',
    email: '',
    area_id: '',
    unidad: '',
    contrato_unidad_id: '',
    cargo_id: '',
    turno_id: '',
    categoria: 'OBRERO',
    fecha_ingreso: '',
    fecha_cese: '',
    situacion_contractual: 'NUEVO',
    tipo_contrato: 'PLAZO_FIJO',
    sueldo_base: '',
    contrato_inicio: '',
    contrato_fin: '',
    bono_regular: '',
    sistema_pension_id: '',
    tiene_asignacion_familiar: false,
    val_asig_familiar: 113,
    numero_hijos: 0,
    cuenta_bancaria: '',
    cci: '',
    banco: '',
    essalud_vida: false,
    val_essalud_vida: 0,
    motivo_cese: '',
    concepto: '',
  });
  const [contratosUnidad, setContratosUnidad] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { hasPermission } = useAuth();
  const esNuevo = !empleado; // true cuando estamos creando un empleado
  // Permisos individuales por campo salarial (con backward compat para el permiso agrupado antiguo)
  const _legacySalarios = hasPermission('empleados.editar_salarios');
  const puedeEditarSueldo       = esNuevo || hasPermission('empleados.editar_sueldo')       || _legacySalarios;
  const puedeEditarBono         = esNuevo || hasPermission('empleados.editar_bono')         || _legacySalarios;
  const puedeEditarAsigFamiliar = esNuevo || hasPermission('empleados.editar_asig_familiar') || _legacySalarios;

  useEffect(() => {
    if (empleado) {
      // Función para formatear fechas a YYYY-MM-DD para inputs tipo date
      const formatDateForInput = (date) => {
        if (!date) return '';
        // Si ya está en formato YYYY-MM-DD, devolverla tal cual
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        // Si viene como objeto Date o string ISO, extraer solo la fecha
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
      };

      setForm({
        ...form,
        ...empleado,
        area_id: empleado.area_id || '',
        unidad: empleado.unidad || '',
        cargo_id: empleado.cargo_id || '',
        turno_id: empleado.turno_id || '',
        categoria: empleado.categoria || 'OBRERO',
        tipo_contrato: empleado.tipo_contrato || 'PLAZO_FIJO',
        afp_id: empleado.afp_id || '',
        sistema_pension_id: empleado.sistema_pension_id || '',
        fecha_nacimiento: formatDateForInput(empleado.fecha_nacimiento),
        grado_instruccion: empleado.grado_instruccion || '',
        sexo: empleado.sexo || 'M',
        estado_civil: empleado.estado_civil || 'SOLTERO',
        cuspp: empleado.cuspp || '',
        fecha_ingreso: formatDateForInput(empleado.fecha_ingreso),
        fecha_cese: formatDateForInput(empleado.fecha_cese),
        contrato_inicio: formatDateForInput(empleado.contrato_inicio),
        contrato_fin: formatDateForInput(empleado.contrato_fin),
        bono_regular: empleado.bono_regular || '',
        tiene_asignacion_familiar: !!empleado.tiene_asignacion_familiar,
        val_asig_familiar: empleado.tiene_asignacion_familiar ? (empleado.val_asig_familiar || 113) : 0,
        numero_hijos: empleado.numero_hijos || 0,
        essalud_vida: !!empleado.essalud_vida,
        val_essalud_vida: empleado.essalud_vida ? (empleado.val_essalud_vida || 5) : 0,
        pais: empleado.pais || 'PERÚ',
        departamento: empleado.departamento || '',
        provincia: empleado.provincia || '',
        distrito: empleado.distrito || '',
        celular: empleado.celular || '',
        email: empleado.email || '',
        banco: empleado.banco || '',
        cuenta_bancaria: empleado.cuenta_bancaria || '',
        cci: empleado.cci || '',
        motivo_cese: empleado.motivo_cese || '',
        concepto: empleado.concepto || '',
        teseo: !!empleado.teseo,
        contrato_unidad_id: empleado.contrato_unidad_id || '',
      });
    }
  }, [empleado]);

  // Cargar contratos de unidad cuando cambia la unidad seleccionada
  useEffect(() => {
    let activo = true;
    if (form.unidad) {
      getContratosUnidad(form.unidad)
        .then(data => { if (activo) setContratosUnidad(data); })
        .catch(() => { if (activo) setContratosUnidad([]); });
    } else {
      setContratosUnidad([]);
    }
    return () => { activo = false; };
  }, [form.unidad]);

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    if (name === 'tiene_asignacion_familiar') {
      setForm(prev => ({
        ...prev,
        tiene_asignacion_familiar: checked,
        val_asig_familiar: checked ? 113 : 0,
      }));
    } else if (name === 'essalud_vida') {
      setForm(prev => ({
        ...prev,
        essalud_vida: checked,
        val_essalud_vida: checked ? 5 : 0,
      }));
    } else if (name === 'unidad') {
      setForm(prev => ({ ...prev, unidad: value, contrato_unidad_id: '' }));
    } else {
      setForm({ ...form, [name]: newValue });
    }
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validate = () => {
    const e = {};
    if (!form.dni || form.dni.length !== 8) e.dni = 'DNI debe tener 8 dígitos';
    if (!form.apellidos) e.apellidos = 'Apellidos es requerido';
    if (!form.nombres) e.nombres = 'Nombres es requerido';
    if (!form.area_id) e.area_id = 'Área es requerida';
    if (!form.cargo_id) e.cargo_id = 'Cargo es requerido';
    if (!form.turno_id) e.turno_id = 'Turno es requerido';
    if (!form.fecha_ingreso) e.fecha_ingreso = 'Fecha ingreso es requerida';
    if (puedeEditarSueldo && (!form.sueldo_base || parseFloat(form.sueldo_base) <= 0)) e.sueldo_base = 'Sueldo es requerido';
    if (form.sistema_pensiones === 'AFP' && !form.afp_id) e.afp_id = 'AFP es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Derivar sistema_pensiones desde el sistema_pension_id seleccionado
      const sistemaPensionSeleccionado = catalogos.sistemasPensiones?.find(
        s => String(s.id) === String(form.sistema_pension_id)
      );
      const sistemaPensiones = sistemaPensionSeleccionado?.tipo || 'ONP';

      const payload = {
        ...form,
        sueldo_base: parseFloat(form.sueldo_base),
        bono_regular: parseFloat(form.bono_regular) || 0,
        numero_hijos: parseInt(form.numero_hijos) || 0,
        tiene_asignacion_familiar: form.tiene_asignacion_familiar ? 1 : 0,
        val_asig_familiar: form.tiene_asignacion_familiar ? parseFloat(form.val_asig_familiar) || 113 : 0,
        essalud_vida: form.essalud_vida ? 1 : 0,
        val_essalud_vida: form.essalud_vida ? 5 : 0,
        sistema_pensiones: sistemaPensiones,
        // Asegurar que las fechas vacías se envíen como null
        fecha_nacimiento: form.fecha_nacimiento || null,
        fecha_ingreso: form.fecha_ingreso || null,
        fecha_cese: form.fecha_cese || null,
        motivo_cese: form.motivo_cese || null,
        contrato_inicio: form.contrato_inicio || null,
        contrato_fin: form.contrato_fin || null,
        teseo: form.teseo ? 1 : 0,
        concepto: form.concepto || null,
        contrato_unidad_id: form.contrato_unidad_id || null,
      };
      if (!payload.afp_id) delete payload.afp_id;
      if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento;

      let empleadoGuardado;
      if (empleado) {
        empleadoGuardado = await updateEmpleado(empleado.id, payload);
        toast.success('Empleado actualizado correctamente');
      } else {
        empleadoGuardado = await createEmpleado(payload);
        toast.success('Empleado creado correctamente');
      }
      
      // Pasar el empleado guardado y si es nuevo al callback
      onSaved(empleadoGuardado, !empleado);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al guardar';
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="empleado-form">
      <div className="form-section">
        <h4>Datos Personales</h4>
        <div className="form-grid-3">
          <div className="form-group">
            <label>DNI *</label>
            <input type="text" name="dni" value={form.dni} onChange={handleChange}
              maxLength={8} className={errors.dni ? 'error' : ''} />
            {errors.dni && <span className="form-error">{errors.dni}</span>}
          </div>
          <div className="form-group">
            <label>Apellidos *</label>
            <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange}
              className={errors.apellidos ? 'error' : ''} />
            {errors.apellidos && <span className="form-error">{errors.apellidos}</span>}
          </div>
          <div className="form-group">
            <label>Nombres *</label>
            <input type="text" name="nombres" value={form.nombres} onChange={handleChange}
              className={errors.nombres ? 'error' : ''} />
            {errors.nombres && <span className="form-error">{errors.nombres}</span>}
          </div>
          <div className="form-group">
            <label>Fecha Nacimiento</label>
            <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Edad</label>
            <input type="text" value={form.fecha_nacimiento ? calcularEdad(form.fecha_nacimiento) + ' años' : '-'} disabled />
          </div>
          <div className="form-group">
            <label>Grado Instrucción</label>
            <select name="grado_instruccion" value={form.grado_instruccion || ''} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {GRADOS_INSTRUCCION.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Sexo</label>
            <select name="sexo" value={form.sexo} onChange={handleChange}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estado Civil</label>
            <select name="estado_civil" value={form.estado_civil} onChange={handleChange}>
              <option value="SOLTERO">Soltero(a)</option>
              <option value="CASADO">Casado(a)</option>
              <option value="VIUDO">Viudo(a)</option>
              <option value="DIVORCIADO">Divorciado(a)</option>
              <option value="CONVIVIENTE">Conviviente</option>
            </select>
          </div>
          <div className="form-group col-span-2">
            <label>Dirección</label>
            <input type="text" name="direccion" value={form.direccion} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Celular</label>
            <input type="text" name="celular" value={form.celular} onChange={handleChange} maxLength={15} />
          </div>
          <div className="form-group col-span-2">
            <label>Email</label>
            <input type="email" name="email" value={form.email || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>País</label>
            <select name="pais" value={form.pais || 'PERÚ'} onChange={e => {
              const nuevoPais = e.target.value;
              setForm(prev => ({ ...prev, pais: nuevoPais, departamento: '', provincia: '', distrito: '' }));
            }}>
              {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {(form.pais === 'PERÚ' || !form.pais) ? (
            <>
              <div className="form-group">
                <label>Departamento</label>
                <select name="departamento" value={form.departamento || ''} onChange={e => {
                  setForm(prev => ({ ...prev, departamento: e.target.value, provincia: '', distrito: '' }));
                }}>
                  <option value="">Seleccione...</option>
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Provincia</label>
                <select name="provincia" value={form.provincia || ''} onChange={e => {
                  setForm(prev => ({ ...prev, provincia: e.target.value, distrito: '' }));
                }} disabled={!form.departamento}>
                  <option value="">Seleccione...</option>
                  {(PROVINCIAS[form.departamento] || []).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Distrito</label>
                <select name="distrito" value={form.distrito || ''} onChange={handleChange} disabled={!form.provincia}>
                  <option value="">Seleccione...</option>
                  {(DISTRITOS[form.provincia] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Departamento / Estado / Región</label>
                <input type="text" name="departamento" value={form.departamento || ''} onChange={handleChange}
                  placeholder="Ej: Buenos Aires" maxLength={100} />
              </div>
              <div className="form-group">
                <label>Provincia / Ciudad</label>
                <input type="text" name="provincia" value={form.provincia || ''} onChange={handleChange}
                  placeholder="Ej: La Plata" maxLength={100} />
              </div>
              <div className="form-group">
                <label>Distrito / Municipio</label>
                <input type="text" name="distrito" value={form.distrito || ''} onChange={handleChange}
                  placeholder="Ej: Centro" maxLength={100} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="form-section">
        <h4>Datos Laborales</h4>
        <div className="form-grid-3">
          <div className="form-group">
            <label>Área *</label>
            <select name="area_id" value={form.area_id} onChange={handleChange}
              className={errors.area_id ? 'error' : ''}>
              <option value="">Seleccione...</option>
              {catalogos.areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            {errors.area_id && <span className="form-error">{errors.area_id}</span>}
          </div>
          <div className="form-group">
            <label>Unidad</label>
            <select name="unidad" value={form.unidad || ''} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Contrato de Unidad</label>
            <select
              name="contrato_unidad_id"
              value={form.contrato_unidad_id || ''}
              onChange={handleChange}
              disabled={!form.unidad || contratosUnidad.length === 0}
            >
              <option value="">
                {!form.unidad
                  ? '— Seleccione una unidad primero —'
                  : contratosUnidad.length === 0
                  ? '— Sin contratos registrados —'
                  : '— Seleccione contrato —'}
              </option>
              {contratosUnidad.map(c => (
                <option key={c.id} value={c.id}>
                  {c.descripcion.length > 80 ? c.descripcion.substring(0, 80) + '...' : c.descripcion}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Cargo *</label>
            <select name="cargo_id" value={form.cargo_id} onChange={handleChange}
              className={errors.cargo_id ? 'error' : ''}>
              <option value="">Seleccione...</option>
              {catalogos.cargos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {errors.cargo_id && <span className="form-error">{errors.cargo_id}</span>}
          </div>
          <div className="form-group">
            <label>Categoría *</label>
            <select name="categoria" value={form.categoria} onChange={handleChange}
              className={errors.categoria ? 'error' : ''}>
              <option value="OBRERO">Obrero</option>
              <option value="EMPLEADO">Empleado</option>
            </select>
            {errors.categoria && <span className="form-error">{errors.categoria}</span>}
          </div>
          <div className="form-group">
            <label>Turno *</label>
            <select name="turno_id" value={form.turno_id} onChange={handleChange}
              className={errors.turno_id ? 'error' : ''}>
              <option value="">Seleccione...</option>
              {catalogos.turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            {errors.turno_id && <span className="form-error">{errors.turno_id}</span>}
          </div>
          <div className="form-group">
            <label>Fecha Ingreso *</label>
            <input type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={handleChange}
              className={errors.fecha_ingreso ? 'error' : ''} />
            {errors.fecha_ingreso && <span className="form-error">{errors.fecha_ingreso}</span>}
          </div>
          <div className="form-group">
            <label>Situación</label>
            <select name="situacion_contractual" value={form.situacion_contractual} onChange={handleChange}>
              {SITUACIONES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Tipo Contrato</label>
            <select name="tipo_contrato" value={form.tipo_contrato} onChange={handleChange}>
              <option value="PLAZO_FIJO">Plazo Fijo</option>
              <option value="INDEFINIDO">Indefinido</option>
              <option value="PARCIAL">Parcial</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sueldo Base *{!puedeEditarSueldo && <span className="salary-lock-badge"><FiLock size={10}/> restringido</span>}</label>
            <input type="number" name="sueldo_base" value={form.sueldo_base} onChange={handleChange}
              step="0.01" min="0" className={errors.sueldo_base ? 'error' : ''}
              disabled={!puedeEditarSueldo} />
            {errors.sueldo_base && <span className="form-error">{errors.sueldo_base}</span>}
          </div>
          <div className="form-group">
            <label>Contrato Desde</label>
            <input type="date" name="contrato_inicio" value={form.contrato_inicio || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Contrato Hasta</label>
            <input type="date" name="contrato_fin" value={form.contrato_fin || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Bono Regular (S/.){!puedeEditarBono && <span className="salary-lock-badge"><FiLock size={10}/> restringido</span>}</label>
            <input type="number" name="bono_regular" value={form.bono_regular} onChange={handleChange}
              step="0.01" min="0" placeholder="0.00"
              disabled={!puedeEditarBono} />
          </div>
          <div className="form-group">
            <label className="checkbox-label" title="Registrado en el sistema TESEO">
              <input type="checkbox" name="teseo" checked={form.teseo} onChange={handleChange} />
              Registrado en TESEO
            </label>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Concepto</label>
            <ConceptoSelect
              value={form.concepto || ''}
              onChange={(val) => setForm(prev => ({ ...prev, concepto: val }))}
            />
          </div>
          {form.situacion_contractual === 'CESADO' && (
            <>
              <div className="form-group">
                <label>Fecha de Cese</label>
                <input type="date" name="fecha_cese" value={form.fecha_cese || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Motivo de Cese</label>
                <input type="text" name="motivo_cese" value={form.motivo_cese || ''} onChange={handleChange}
                  placeholder="Ej: Renuncia voluntaria, Fin de contrato..." />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="form-section">
        <h4>Sistema de Pensiones y Beneficios</h4>
        <div className="form-grid-3">
          <div className="form-group">
            <label>Sistema de Pensión *</label>
            <select name="sistema_pension_id" value={form.sistema_pension_id} onChange={handleChange}
              className={errors.sistema_pension_id ? 'error' : ''}>
              <option value="">Seleccione...</option>
              <optgroup label="ONP">
                {catalogos.sistemasPensiones?.filter(s => s.tipo === 'ONP').map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} ({s.porcentaje}%)</option>
                ))}
              </optgroup>
              <optgroup label="AFP">
                {catalogos.sistemasPensiones?.filter(s => s.tipo === 'AFP').map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} ({s.porcentaje}%)</option>
                ))}
              </optgroup>
            </select>
            {errors.sistema_pension_id && <span className="form-error">{errors.sistema_pension_id}</span>}
          </div>
          <div className="form-group">
            <label>CUSPP</label>
            <input type="text" name="cuspp" value={form.cuspp || ''} onChange={handleChange} 
              placeholder="Código Único de Seguro" maxLength={20} />
          </div>
          <div className="form-group">
            <label>Banco</label>
            <select name="banco" value={form.banco || ''} onChange={handleChange}>
              <option value="">Seleccione...</option>
              {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Cuenta Bancaria</label>
            <input type="text" name="cuenta_bancaria" value={form.cuenta_bancaria || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>CCI</label>
            <input type="text" name="cci" value={form.cci || ''} onChange={handleChange} maxLength={25} />
          </div>
          <div className="form-group">
            <label className="checkbox-label" style={!puedeEditarAsigFamiliar ? {opacity:0.55, cursor:'not-allowed'} : {}}>
              <input type="checkbox" name="tiene_asignacion_familiar"
                checked={form.tiene_asignacion_familiar} onChange={handleChange}
                disabled={!puedeEditarAsigFamiliar} />
              Asignación Familiar{!puedeEditarAsigFamiliar && <FiLock size={11} style={{marginLeft:5,color:'#94a3b8'}}/>}
            </label>
          </div>
          {form.tiene_asignacion_familiar && (
            <>
              <div className="form-group">
                <label>Valor Asig. Familiar</label>
                <input type="number" name="val_asig_familiar" value={form.val_asig_familiar} 
                  onChange={handleChange} step="0.01" min="0"
                  disabled={!puedeEditarAsigFamiliar} />
              </div>
              <div className="form-group">
                <label>N° Hijos</label>
                <input type="number" name="numero_hijos" value={form.numero_hijos} onChange={handleChange} min="0"
                  disabled={!puedeEditarAsigFamiliar} />
              </div>
            </>
          )}
          <div className="form-group">
            <label className="checkbox-label" style={!puedeEditarAsigFamiliar ? {opacity:0.55, cursor:'not-allowed'} : {}}>
              <input type="checkbox" name="essalud_vida" checked={form.essalud_vida} onChange={handleChange}
                disabled={!puedeEditarAsigFamiliar} />
              EsSalud +Vida{!puedeEditarAsigFamiliar && <FiLock size={11} style={{marginLeft:5,color:'#94a3b8'}}/>}
              {form.essalud_vida && <span style={{ marginLeft: 8, color: '#059669', fontWeight: 'bold' }}>S/. 5.00</span>}
            </label>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Guardando...' : (empleado ? 'Actualizar' : 'Crear Empleado')}
        </button>
      </div>
    </form>
  );
}

export default EmpleadoForm;
