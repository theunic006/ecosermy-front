import { useState, useEffect, useRef } from 'react';
import { FiRefreshCw, FiEye, FiEdit2, FiUserCheck, FiDatabase, FiTrash2, FiAlertTriangle, FiFileText, FiDownload, FiSave, FiUpload, FiXCircle, FiCheckCircle, FiPrinter } from 'react-icons/fi';
import { getContratosHistorial, getContratosEmpleado, recontratarEmpleado, generarHistorialExistente, eliminarContratoHistorial, noRenovarContrato, reactivarContrato, subirContratoFirmado, descargarContratoFirmado } from '../services/contratoHistorialService';
import { getContratosProximosVencer, getDatosContrato, actualizarRenovacion } from '../services/contratoDocumentoService';
import { updateConcepto, updateContratoUnidadEmpleado } from '../services/empleadoService';
import { getContratosUnidad } from '../services/contratoUnidadService';
import { generarContratoHTML, generarContratoCuerpo, generarContratoWord } from '../utils/contratoTemplate';
import { UNIDADES } from '../utils/constants';
import { useCatalogos } from '../contexts/CatalogosContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import ConceptoSelect from '../components/empleados/ConceptoSelect';
import Loading from '../components/common/Loading';
import { formatDate, formatMoney } from '../utils/helpers';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';
import { useAuth } from '../contexts/AuthContext';

/** Calcula duración entre dos fechas. Si fin es null usa hoy. */
const calcDuracion = (inicio, fin) => {
  if (!inicio) return null;
  const d1 = new Date(String(inicio).substring(0, 10) + 'T00:00:00');
  const d2 = fin ? new Date(String(fin).substring(0, 10) + 'T00:00:00') : new Date();
  if (fin) d2.setDate(d2.getDate() + 1);
  let years  = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth()    - d1.getMonth();
  let days   = d2.getDate()     - d1.getDate();
  if (days < 0)   { months--; days   += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate(); }
  if (months < 0) { years--;  months += 12; }
  const parts = [];
  if (years  > 0)                  parts.push(`${years} año${years   !== 1 ? 's' : ''}`);
  if (months > 0)                  parts.push(`${months} mes${months !== 1 ? 'es' : ''}`);
  if (days   > 0 || parts.length === 0) parts.push(`${days} día${days !== 1 ? 's' : ''}`);
  return parts.join(', ');
};

/** Colores y etiquetas del estado del proceso */
const ESTADO_CONFIG = {
  borrador:        { label: 'Sin gestionar',   bg: '#6b7280', bgDark: 'rgba(107,114,128,.15)', colorDark: '#9ca3af', icon: '📋' },
  pendiente_firma: { label: 'Pend. Firma',     bg: '#d97706', bgDark: 'rgba(217,119,6,.15)',   colorDark: '#fbbf24', icon: '⏳' },
  firmado:         { label: 'Firmado',          bg: '#059669', bgDark: 'rgba(5,150,105,.15)',   colorDark: '#6ee7b7', icon: '✅' },
  no_renovado:     { label: 'No Renovado',      bg: '#dc2626', bgDark: 'rgba(220,38,38,.15)',   colorDark: '#fca5a5', icon: '❌' },
};

function HistorialContratos() {
  const { hasPermission, user } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('proximos');
  const { catalogos } = useCatalogos();
  const { isDark, c } = useThemeColors();

  // Modal detalle de contratos de un empleado
  const [modalDetalle, setModalDetalle] = useState({ show: false, empleado: null, contratos: [], empleadoId: null, empleadoDatos: null });
  const [generandoPDFDetalleId, setGenerandoPDFDetalleId] = useState(null);

  // Modal recontratar
  const [modalRecontratar, setModalRecontratar] = useState({ show: false, empleado: null });
  const [formRecontratar, setFormRecontratar] = useState({
    fecha_inicio: '', fecha_fin: '', tipo_contrato: 'PLAZO_FIJO',
    cargo_id: '', area_id: '', sueldo_base: '', observaciones: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Próximos a vencer
  const [proximosVencer, setProximosVencer] = useState([]);
  const [loadingProximos, setLoadingProximos] = useState(false);
  const [filtroUnidad, setFiltroUnidad] = useState('');

  // Impresión masiva de contratos
  const [modalMasivo, setModalMasivo] = useState(false);
  const [filtroMasivoUnidad, setFiltroMasivoUnidad] = useState('');
  const [filtroMasivoArea, setFiltroMasivoArea] = useState('');
  const [generandoMasivo, setGenerandoMasivo] = useState(false);
  const [progresoMasivo, setProgresoMasivo] = useState({ actual: 0, total: 0, nombre: '' });

  // Modal renovar contrato (generar documentos de renovación)
  const [modalRenovar, setModalRenovar] = useState({ show: false, empleado: null, empleadoDatos: null });
  const [formRenovar, setFormRenovar] = useState({
    fecha_inicio: '', fecha_fin: '', tipo_contrato: 'PLAZO_FIJO',
    cargo_id: '', area_id: '', unidad: '', categoria: 'OBRERO', sueldo_base: '', fecha_firma: '', concepto: '',
    hora_inicio: '07:00', hora_fin: '19:00', con_alimentacion: false,
  });
  const [vistaRenovar, setVistaRenovar] = useState(false);
  const [guardandoRenovar, setGuardandoRenovar] = useState(false);
  const [guardandoConcepto, setGuardandoConcepto] = useState(false);
  const [conceptoGuardado, setConceptoGuardado] = useState(false);
  const [generandoPDFRenovar, setGenerandoPDFRenovar] = useState(false);
  const [renovacionGuardada, setRenovacionGuardada] = useState(false);
  const [contratosUnidadRenovar, setContratosUnidadRenovar] = useState([]);
  const [guardandoContratoUnidad, setGuardandoContratoUnidad] = useState(false);
  const [contratoUnidadGuardado, setContratoUnidadGuardado] = useState(false);
  const [contratoGuardadoId, setContratoGuardadoId] = useState(null);
  const iframeRenovarRef = useRef(null);

  // Edición inline de contrato desde modal detalle
  const [editandoContratoId, setEditandoContratoId] = useState(null);
  const [formEditContrato, setFormEditContrato] = useState({});
  const [guardandoEditContrato, setGuardandoEditContrato] = useState(false);

  // Modal No Renovar
  const [modalNoRenovar, setModalNoRenovar] = useState({ show: false, empleado: null });
  const [motivoNoRenovar, setMotivoNoRenovar] = useState('');
  const [submittingNoRenovar, setSubmittingNoRenovar] = useState(false);

  // Reactivar contrato cesado
  const [reactivandoId, setReactivandoId] = useState(null);

  // Upload firmado
  const [uploadingFirmado, setUploadingFirmado] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingDetalleId, setUploadingDetalleId] = useState(null);
  const fileInputDetalleRef = useRef(null);
  const [uploadTargetId, setUploadTargetId] = useState(null);

  useEffect(() => {
    cargarDatos();
    cargarProximosVencer();
  }, []);

  useEffect(() => {
    if (user?.unidad?.length === 1) setFiltroUnidad(user.unidad[0]);
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const hist = await getContratosHistorial();
      setHistorial(hist);
    } catch (error) {
      toast.error('Error al cargar datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cargarProximosVencer = async () => {
    try {
      setLoadingProximos(true);
      const data = await getContratosProximosVencer();
      setProximosVencer(data);
    } catch (error) {
      toast.error('Error al cargar contratos por vencer');
    } finally {
      setLoadingProximos(false);
    }
  };

  const handleVerHistorial = async (empleadoId, empleadoNombre) => {
    try {
      const [contratos, empleadoDatos] = await Promise.all([
        getContratosEmpleado(empleadoId),
        getDatosContrato(empleadoId),
      ]);
      setModalDetalle({ show: true, empleado: empleadoNombre, contratos, empleadoId, empleadoDatos });
    } catch (error) {
      toast.error('Error al cargar historial');
    }
  };

  /** Prepara los datos para generarContratoHTML/Cuerpo desde un registro de historial */
  const prepararDatosContratoHistorial = (contrato) => {
    const emp = modalDetalle.empleadoDatos;
    // Si este contrato está en modo edición, usar los valores del formulario (permite descargar con datos editados antes de guardar)
    const isEditing = editandoContratoId === contrato.id;
    const f = isEditing ? formEditContrato : {};
    const cargoNombre = f.cargo_id
      ? (catalogos.cargos?.find(c => String(c.id) === f.cargo_id)?.nombre || contrato.cargo)
      : (contrato.cargo || emp?.cargo || 'NO ASIGNADO');
    return {
      nombre_completo: `${emp?.apellidos || ''} ${emp?.nombres || ''}`.trim().toUpperCase(),
      dni: emp?.dni || '',
      direccion: emp?.direccion || '',
      distrito: emp?.distrito || '',
      provincia: emp?.provincia || '',
      departamento: emp?.departamento || '',
      codigo_trabajador: emp?.codigo_trabajador || 'S/C',
      cargo: cargoNombre,
      categoria: emp?.categoria || 'OBRERO',
      unidad: emp?.unidad || 'NO ASIGNADO',
      descripcion_contrato: emp?.descripcion_contrato || '',
      contrato_inicio: isEditing ? (f.fecha_inicio || contrato.fecha_inicio) : contrato.fecha_inicio,
      contrato_fin:    isEditing ? (f.fecha_fin   || contrato.fecha_fin)    : contrato.fecha_fin,
      sueldo_base:     isEditing
        ? (parseFloat(f.sueldo_base) || parseFloat(emp?.sueldo_base) || 0)
        : (parseFloat(emp?.sueldo_base) || 0),
      fecha_firma: isEditing ? (f.fecha_firma || contrato.fecha_inicio) : contrato.fecha_inicio,
      hora_inicio: emp?.hora_inicio || '07:00',
      hora_fin: emp?.hora_fin || '19:00',
      concepto: emp?.concepto || '',
      celular: emp?.celular || '',
      email:   emp?.email   || '',
    };
  };

  const handlePDFContratoHistorial = async (contrato) => {
    const datos = prepararDatosContratoHistorial(contrato);
    try {
      setGenerandoPDFDetalleId(contrato.id);
      toast.info('Generando PDF, por favor espere...');
      const { generarContratoPDFMake } = await import('../utils/contratoTemplatePdfMake');
      await generarContratoPDFMake(
        datos,
        `Contrato_${datos.nombre_completo.replace(/\s+/g, '_')}_N${contrato.contrato_numero}.pdf`
      );
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setGenerandoPDFDetalleId(null);
    }
  };

  const handleWordContratoHistorial = (contrato) => {
    const datos = prepararDatosContratoHistorial(contrato);
    try {
      const wordContent = generarContratoWord(datos);
      const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contrato_${datos.nombre_completo.replace(/\s+/g, '_')}_N${contrato.contrato_numero}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Archivo Word descargado correctamente');
    } catch (error) {
      toast.error('Error al generar el archivo Word');
    }
  };

  /** Helper standalone para construir datos del PDF sin depender de modalDetalle */
  const buildDatosParaPDF = (emp, contrato) => {
    const cargoNombre = contrato?.cargo || emp?.cargo || 'NO ASIGNADO';
    return {
      nombre_completo: `${emp?.apellidos || ''} ${emp?.nombres || ''}`.trim().toUpperCase(),
      dni:                 emp?.dni               || '',
      direccion:           emp?.direccion         || '',
      distrito:            emp?.distrito          || '',
      provincia:           emp?.provincia         || '',
      departamento:        emp?.departamento      || '',
      codigo_trabajador:   emp?.codigo_trabajador || 'S/C',
      cargo:               cargoNombre,
      categoria:           emp?.categoria         || 'OBRERO',
      unidad:              emp?.unidad            || 'NO ASIGNADO',
      descripcion_contrato: emp?.descripcion_contrato || '',
      contrato_inicio: contrato?.fecha_inicio,
      contrato_fin:    contrato?.fecha_fin,
      sueldo_base: parseFloat(emp?.sueldo_base) || 0,
      fecha_firma:  contrato?.fecha_inicio,
      hora_inicio:  emp?.hora_inicio || '07:00',
      hora_fin:     emp?.hora_fin    || '19:00',
      concepto: emp?.concepto || '',
      celular:  emp?.celular  || '',
      email:    emp?.email    || '',
    };
  };

  /** Genera PDFs de forma masiva según filtroMasivoUnidad + filtroMasivoArea */
  const handleGenerarMasivo = async () => {
    const empleadosFiltrados = empleadosConHistorial.filter(e => {
      const mismaUnidad = !filtroMasivoUnidad || e.empleado?.unidad === filtroMasivoUnidad;
      const mismaArea   = !filtroMasivoArea   || String(e.empleado?.area_id) === filtroMasivoArea;
      return mismaUnidad && mismaArea;
    });
    if (empleadosFiltrados.length === 0) {
      toast.warn('No hay empleados con los filtros seleccionados');
      return;
    }
    setGenerandoMasivo(true);
    setProgresoMasivo({ actual: 0, total: empleadosFiltrados.length, nombre: '' });
    const { generarContratoPDFMake } = await import('../utils/contratoTemplatePdfMake');
    let exitosos = 0;
    for (let i = 0; i < empleadosFiltrados.length; i++) {
      const item = empleadosFiltrados[i];
      const nombreDisplay = `${item.empleado?.apellidos || ''}, ${item.empleado?.nombres || ''}`.trim();
      setProgresoMasivo({ actual: i + 1, total: empleadosFiltrados.length, nombre: nombreDisplay });
      try {
        const empleadoDatos = await getDatosContrato(item.empleado_id);
        const contrato = item.contratos[0];
        const datos = buildDatosParaPDF(empleadoDatos, contrato);
        const filename = `Contrato_${datos.nombre_completo.replace(/\s+/g, '_')}_N${contrato?.contrato_numero || i + 1}.pdf`;
        await generarContratoPDFMake(datos, filename);
        exitosos++;
        // Pequeña pausa para no saturar el navegador
        await new Promise(r => setTimeout(r, 600));
      } catch (e) {
        console.error(`Error masivo para ${nombreDisplay}:`, e);
        toast.error(`Error generando contrato de ${nombreDisplay}`);
      }
    }
    setGenerandoMasivo(false);
    setModalMasivo(false);
    setFiltroMasivoUnidad('');
    setFiltroMasivoArea('');
    if (exitosos > 0) toast.success(`✅ ${exitosos} contrato${exitosos !== 1 ? 's' : ''} generado${exitosos !== 1 ? 's' : ''} correctamente`);
  };

  const handleAbrirRecontratar = (empleado) => {
    setModalRecontratar({ show: true, empleado });
    setFormRecontratar({
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      tipo_contrato: empleado.tipo_contrato || 'PLAZO_FIJO',
      cargo_id: empleado.cargo_id || '',
      area_id: empleado.area_id || '',
      sueldo_base: empleado.sueldo_base || '',
      observaciones: 'Recontratación',
    });
  };

  const handleRecontratar = async () => {
    const { empleado } = modalRecontratar;
    if (!formRecontratar.fecha_inicio) {
      toast.error('La fecha de inicio es obligatoria');
      return;
    }
    setSubmitting(true);
    try {
      await recontratarEmpleado({
        empleado_id: empleado.id,
        ...formRecontratar,
        sueldo_base: parseFloat(formRecontratar.sueldo_base) || undefined,
      });
      toast.success(`${empleado.apellidos}, ${empleado.nombres} ha sido recontratado exitosamente`);
      setModalRecontratar({ show: false, empleado: null });
      cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al recontratar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerarHistorial = async () => {
    if (!confirm('Esto generará el historial inicial para todos los empleados que aún no tienen registro. ¿Continuar?')) return;
    try {
      const result = await generarHistorialExistente();
      toast.success(result.message);
      cargarDatos();
    } catch (error) {
      toast.error('Error al generar historial');
    }
  };

  // ===== RENOVAR =====
  const handleAbrirRenovar = async (empleado) => {
    try {
      setVistaRenovar(false);
      const datos = await getDatosContrato(empleado.id);
      const nuevaInicio = empleado.contrato_fin
        ? (() => { const d = new Date(empleado.contrato_fin + 'T00:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()
        : new Date().toISOString().split('T')[0];
      const nuevaFin = (() => { const d = new Date(nuevaInicio + 'T00:00:00'); d.setMonth(d.getMonth() + 3); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
      setFormRenovar({
        fecha_inicio: nuevaInicio,
        fecha_fin: nuevaFin,
        tipo_contrato: empleado.tipo_contrato || 'PLAZO_FIJO',
        cargo_id: String(empleado.cargo_id || ''),
        area_id: String(empleado.area_id || ''),
        unidad: empleado.unidad || '',
        categoria: empleado.categoria || 'OBRERO',
        sueldo_base: String(empleado.sueldo_base || ''),
        fecha_firma: new Date().toISOString().split('T')[0],
        concepto: empleado.concepto || '',
        contrato_unidad_id: empleado.contrato_unidad_id ? String(empleado.contrato_unidad_id) : '',
        hora_inicio: '07:00',
        hora_fin: '19:00',
        con_alimentacion: false,
      });
      // Cargar contratos de la unidad del empleado
      if (empleado.unidad) {
        getContratosUnidad(empleado.unidad)
          .then(data => setContratosUnidadRenovar(data))
          .catch(() => setContratosUnidadRenovar([]));
      } else {
        setContratosUnidadRenovar([]);
      }
      setModalRenovar({ show: true, empleado, empleadoDatos: datos });
      setRenovacionGuardada(false);
      setContratoGuardadoId(null); // siempre null al abrir: el primer guardado CREA contrato nuevo
    } catch (error) {
      toast.error('Error al cargar datos del empleado');
    }
  };

  const handleGuardarConcepto = async () => {
    const emp = modalRenovar.empleado;
    if (!emp?.id) return;
    setGuardandoConcepto(true);
    try {
      await updateConcepto(emp.id, formRenovar.concepto || null);
      setConceptoGuardado(true);
      toast.success('Concepto guardado correctamente');
      setTimeout(() => setConceptoGuardado(false), 2500);
    } catch {
      toast.error('Error al guardar el concepto');
    } finally {
      setGuardandoConcepto(false);
    }
  };

  const handleGuardarContratoUnidad = async () => {
    const emp = modalRenovar.empleado;
    if (!emp?.id) return;
    setGuardandoContratoUnidad(true);
    try {
      await updateContratoUnidadEmpleado(emp.id, formRenovar.contrato_unidad_id || null);
      setContratoUnidadGuardado(true);
      toast.success('Contrato de unidad guardado correctamente');
      setTimeout(() => setContratoUnidadGuardado(false), 2500);
    } catch {
      toast.error('Error al guardar el contrato de unidad');
    } finally {
      setGuardandoContratoUnidad(false);
    }
  };

  const prepararDatosRenovacion = () => {
    const emp = modalRenovar.empleadoDatos;
    if (!emp) return null;
    const cargoNombre = formRenovar.cargo_id
      ? (catalogos.cargos?.find(c => String(c.id) === formRenovar.cargo_id)?.nombre || emp.cargo)
      : emp.cargo;
    const areaNombre = formRenovar.area_id
      ? (catalogos.areas?.find(a => String(a.id) === formRenovar.area_id)?.nombre || emp.area)
      : emp.area;
    // Busca la descripción en la lista cargada; si aún no cargó, cae al valor
    // que ya devuelve el backend directamente desde la relación contratoUnidad.
    const contratoUnidadDesc = formRenovar.contrato_unidad_id
      ? (contratosUnidadRenovar.find(c => String(c.id) === String(formRenovar.contrato_unidad_id))?.descripcion
         || emp.descripcion_contrato
         || '')
      : (emp.descripcion_contrato || '');
    return {
      nombre_completo: `${emp.apellidos || ''} ${emp.nombres || ''}`.trim().toUpperCase(),
      dni: emp.dni || '',
      direccion: emp.direccion || '',
      distrito: emp.distrito || '',
      provincia: emp.provincia || '',
      departamento: emp.departamento || '',
      codigo_trabajador: emp.codigo_trabajador || 'S/C',
      cargo: cargoNombre || 'NO ASIGNADO',
      categoria: formRenovar.categoria || emp.categoria || 'OBRERO',
      unidad: formRenovar.unidad || emp.unidad || 'NO ASIGNADO',
      descripcion_contrato: contratoUnidadDesc,
      contrato_inicio: formRenovar.fecha_inicio,
      contrato_fin: formRenovar.fecha_fin,
      hora_inicio: formRenovar.hora_inicio || '07:00',
      hora_fin: formRenovar.hora_fin || '19:00',
      sueldo_base: parseFloat(formRenovar.sueldo_base) || parseFloat(emp.sueldo_base) || 0,
      fecha_firma: formRenovar.fecha_firma,
      concepto: formRenovar.concepto || emp.concepto || '',
      con_alimentacion: formRenovar.con_alimentacion || false,
      celular: emp.celular || '',
      email:   emp.email   || '',
    };
  };

  const handleGuardarRenovacion = async () => {
    const emp = modalRenovar.empleado;
    if (!formRenovar.fecha_inicio || !formRenovar.fecha_fin) {
      toast.error('Las fechas de inicio y fin son obligatorias');
      return;
    }
    setGuardandoRenovar(true);
    try {
      const payload = {
        fecha_inicio: formRenovar.fecha_inicio,
        fecha_fin: formRenovar.fecha_fin,
        tipo_contrato: formRenovar.tipo_contrato || undefined,
        cargo_id: formRenovar.cargo_id || undefined,
        area_id: formRenovar.area_id || undefined,
        sueldo_base: formRenovar.sueldo_base ? parseFloat(formRenovar.sueldo_base) : undefined,
        unidad: formRenovar.unidad || undefined,
        categoria: formRenovar.categoria || undefined,
      };

      // Actualizar concepto en la tabla empleados
      if (formRenovar.concepto !== undefined) {
        await updateConcepto(emp.id, formRenovar.concepto || null);
      }

      if (contratoGuardadoId) {
        await actualizarRenovacion(contratoGuardadoId, payload);
        toast.success('✅ Datos actualizados correctamente');
      } else {
        const result = await recontratarEmpleado({
          empleado_id: emp.id,
          ...payload,
          observaciones: 'Renovación de contrato',
        });
        setContratoGuardadoId(result.contrato?.id);
        toast.success('✅ Contrato renovado y guardado correctamente');
      }
      setRenovacionGuardada(true);
      cargarDatos();
      cargarProximosVencer();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar la renovación');
    } finally {
      setGuardandoRenovar(false);
    }
  };

  const handleVistaPreviaRenovar = () => {
    const datos = prepararDatosRenovacion();
    if (!datos) return;
    setVistaRenovar(true);
    setTimeout(() => {
      if (iframeRenovarRef.current) iframeRenovarRef.current.srcdoc = generarContratoHTML(datos);
    }, 100);
  };

  const handlePDFRenovacion = async () => {
    const datos = prepararDatosRenovacion();
    if (!datos) { toast.error('No hay datos para generar el PDF'); return; }
    try {
      setGenerandoPDFRenovar(true);
      toast.info('Generando PDF, por favor espere...');
      const { generarContratoPDFMake } = await import('../utils/contratoTemplatePdfMake');
      await generarContratoPDFMake(
        datos,
        `Renovacion_${datos.nombre_completo.replace(/\s+/g, '_')}.pdf`
      );
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setGenerandoPDFRenovar(false);
    }
  };

  const handleWordRenovacion = () => {
    const datos = prepararDatosRenovacion();
    if (!datos) return;
    try {
      const wordContent = generarContratoWord(datos);
      const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Renovacion_${datos.nombre_completo.replace(/\s+/g, '_')}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Archivo Word descargado correctamente');
    } catch (error) {
      toast.error('Error al generar el archivo Word');
    }
  };

  // ===== SUBIR FIRMADO =====
  const handleSubirFirmado = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    if (!contratoGuardadoId) {
      toast.error('Primero debe guardar la renovación');
      return;
    }
    setUploadingFirmado(true);
    try {
      await subirContratoFirmado(contratoGuardadoId, archivo);
      toast.success('✅ Contrato firmado subido correctamente');
      cargarProximosVencer();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al subir el documento firmado');
    } finally {
      setUploadingFirmado(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ===== SUBIR FIRMADO DESDE MODAL DETALLE =====
  const handleSubirFirmadoDetalle = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo || !uploadTargetId) return;

    // Validar PDF únicamente
    if (archivo.type !== 'application/pdf') {
      toast.error('Solo se aceptan archivos PDF');
      if (fileInputDetalleRef.current) fileInputDetalleRef.current.value = '';
      return;
    }
    // Validar 2MB
    if (archivo.size > 2 * 1024 * 1024) {
      toast.error('El archivo no puede superar los 2 MB');
      if (fileInputDetalleRef.current) fileInputDetalleRef.current.value = '';
      return;
    }

    setUploadingDetalleId(uploadTargetId);
    try {
      await subirContratoFirmado(uploadTargetId, archivo);
      toast.success('✅ Contrato firmado guardado correctamente');
      // Recargar contratos del modal
      const contratos = await getContratosEmpleado(modalDetalle.empleadoId);
      setModalDetalle(prev => ({ ...prev, contratos }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al subir el documento');
    } finally {
      setUploadingDetalleId(null);
      setUploadTargetId(null);
      if (fileInputDetalleRef.current) fileInputDetalleRef.current.value = '';
    }
  };

  // ===== NO RENOVAR =====
  const handleAbrirNoRenovar = (empleado) => {
    setModalNoRenovar({ show: true, empleado });
    setMotivoNoRenovar('');
  };

  const handleConfirmarNoRenovar = async () => {
    if (!motivoNoRenovar.trim()) {
      toast.error('Debe ingresar un motivo');
      return;
    }
    const emp = modalNoRenovar.empleado;
    setSubmittingNoRenovar(true);
    try {
      await noRenovarContrato(emp.id, motivoNoRenovar);
      toast.success(`Contrato de ${emp.nombre_completo} marcado como NO RENOVADO. Empleado cesado.`);
      setModalNoRenovar({ show: false, empleado: null });
      cargarDatos();
      cargarProximosVencer();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la no renovación');
    } finally {
      setSubmittingNoRenovar(false);
    }
  };

  // ===== REACTIVAR CONTRATO CESADO =====
  const handleReactivarContrato = async (contrato) => {
    const nombre = modalDetalle.empleadoDatos?.nombre_completo || modalDetalle.empleado || '';
    if (!confirm(`¿Confirma reactivar el contrato Nº ${contrato.contrato_numero} de ${nombre}?\n\nEl empleado volverá a estar en estado VIGENTE.`)) return;
    setReactivandoId(contrato.id);
    try {
      await reactivarContrato(contrato.id);
      toast.success(`✅ Contrato reactivado. ${nombre} está nuevamente VIGENTE.`);
      // Recargar contratos en el modal
      const contratos = await getContratosEmpleado(modalDetalle.empleadoId);
      setModalDetalle(prev => ({ ...prev, contratos }));
      // Recargar tablas principales
      cargarDatos();
      cargarProximosVencer();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al reactivar el contrato');
    } finally {
      setReactivandoId(null);
    }
  };

  // ===== DESCARGAR FIRMADO =====
  const handleDescargarFirmado = async (contratoId) => {
    try {
      await descargarContratoFirmado(contratoId);
      toast.success('Descarga iniciada');
    } catch (error) {
      toast.error('Error al descargar el documento firmado');
    }
  };

  const handleEliminarContrato = async (id) => {
    if (!confirm('¿Eliminar este registro del historial?')) return;
    try {
      await eliminarContratoHistorial(id);
      toast.success('Registro eliminado');

      // Recargar historial y próximos vencer en paralelo
      await Promise.all([cargarDatos(), cargarProximosVencer()]);

      if (modalDetalle.empleadoId) {
        const contratos = await getContratosEmpleado(modalDetalle.empleadoId);
        if (contratos.length === 0) {
          // Sin contratos → cerrar modal y llevar a "Por Vencer" para que pueda recontratar
          setModalDetalle({ show: false, empleado: null, contratos: [], empleadoId: null, empleadoDatos: null });
          setActiveTab('proximos');
          toast.info('El empleado aparece ahora en la pestaña "Por Vencer" para ser renovado.');
        } else {
          setModalDetalle(prev => ({ ...prev, contratos }));
        }
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // ===== EDICIÓN INLINE DE CONTRATO (Modal Detalle) =====
  const handleAbrirEdicion = (contrato) => {
    setEditandoContratoId(contrato.id);
    setFormEditContrato({
      fecha_inicio:  contrato.fecha_inicio?.substring(0, 10) || '',
      fecha_fin:     contrato.fecha_fin?.substring(0, 10)    || '',
      tipo_contrato: contrato.tipo_contrato || 'PLAZO_FIJO',
      sueldo_base:   String(contrato.sueldo || ''),
      cargo_id:      '',
      area_id:       '',
      fecha_firma:   contrato.fecha_inicio?.substring(0, 10) || '',
      observaciones: contrato.observaciones || '',
    });
  };

  const handleCancelarEdicion = () => {
    setEditandoContratoId(null);
    setFormEditContrato({});
  };

  const handleGuardarEdicion = async () => {
    if (!formEditContrato.fecha_inicio) {
      toast.error('La fecha de inicio es obligatoria');
      return;
    }
    setGuardandoEditContrato(true);
    try {
      const payload = {
        fecha_inicio:  formEditContrato.fecha_inicio,
        fecha_fin:     formEditContrato.fecha_fin     || undefined,
        tipo_contrato: formEditContrato.tipo_contrato || undefined,
        sueldo_base:   formEditContrato.sueldo_base   ? parseFloat(formEditContrato.sueldo_base) : undefined,
        cargo_id:      formEditContrato.cargo_id      || undefined,
        area_id:       formEditContrato.area_id       || undefined,
        observaciones: formEditContrato.observaciones || undefined,
        fecha_firma:   formEditContrato.fecha_firma   || undefined,
      };
      await actualizarRenovacion(editandoContratoId, payload);
      toast.success('✅ Contrato actualizado correctamente');
      // Recargar tarjetas con datos del servidor
      const contratos = await getContratosEmpleado(modalDetalle.empleadoId);
      setModalDetalle(prev => ({ ...prev, contratos }));
      setEditandoContratoId(null);
      setFormEditContrato({});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar el contrato');
    } finally {
      setGuardandoEditContrato(false);
    }
  };

  // Agrupar historial por empleado
  const empleadosConHistorial = (() => {
    const mapa = {};
    historial
      .filter(h => !filtroUnidad || h.empleado?.unidad === filtroUnidad)
      .forEach(h => {
      const empId = h.empleado_id;
      if (!mapa[empId]) {
        mapa[empId] = { empleado_id: empId, empleado: h.empleado, contratos: [], total_contratos: 0 };
      }
      const yaExiste = mapa[empId].contratos.some(c => c.contrato_numero === h.contrato_numero);
      if (!yaExiste) {
        mapa[empId].contratos.push(h);
        mapa[empId].total_contratos++;
      }
    });
    return Object.values(mapa).sort((a, b) => b.total_contratos - a.total_contratos);
  })();

  const proximosVencerFiltrados = filtroUnidad
    ? proximosVencer.filter(p => p.unidad === filtroUnidad)
    : proximosVencer;

  // ===== COLUMNAS =====

  const columnsHistorial = [
    {
      header: 'Código', accessor: 'codigo', width: '90px',
      render: (row) => <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{row.empleado?.codigo_trabajador || '-'}</span>,
    },
    {
      header: 'Personal', accessor: 'empleado',
      render: (row) => <span style={{ fontWeight: 500 }}>{row.empleado?.apellidos}, {row.empleado?.nombres}</span>,
    },
    { header: 'DNI', render: (row) => row.empleado?.dni || '-', width: '85px' },
    {
      header: 'Contratos', accessor: 'total_contratos', width: '100px',
      render: (row) => (
        <span style={{
          fontWeight: 700,
          color: row.total_contratos > 1 ? 'var(--warning)' : 'var(--success)',
          background: row.total_contratos > 1 ? 'var(--warning-bg)' : 'var(--success-bg)',
          padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem',
        }}>{row.total_contratos}</span>
      ),
    },
    {
      header: 'Último Contrato',
      render: (row) => {
        const ultimo = row.contratos[0];
        if (!ultimo) return '-';
        const finReal = ultimo.fecha_cese || ultimo.fecha_fin || null;
        const dur = calcDuracion(ultimo.fecha_inicio, finReal);
        return (
          <div>
            <span>{formatDate(ultimo.fecha_inicio)} → {ultimo.fecha_fin ? formatDate(ultimo.fecha_fin) : 'Indefinido'}</span>
            {dur && <><br /><small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>⏱ {dur}</small></>}
          </div>
        );
      },
    },
    {
      header: 'Situación', width: '120px',
      render: (row) => {
        const ultimo = row.contratos[0];
        const sit = ultimo?.situacion || 'N/A';
        return (
          <span className="badge" style={{
            backgroundColor: sit === 'VIGENTE'
              ? (isDark ? 'rgba(52,211,153,.12)' : '#4caf50')
              : sit === 'CESADO'
                ? (isDark ? 'rgba(248,113,113,.12)' : '#f44336')
                : (isDark ? 'rgba(148,163,184,.12)' : '#9e9e9e'),
            color: isDark
              ? (sit === 'VIGENTE' ? '#6ee7b7' : sit === 'CESADO' ? '#fca5a5' : '#94a3b8')
              : '#fff',
          }}>{sit}</span>
        );
      },
    },
    {
      header: 'Firmado', width: '110px',
      render: (row) => {
        const conFirmado = row.contratos.filter(c => c.documento_firmado_ruta);
        const total = row.contratos.length;
        if (conFirmado.length === 0) {
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#6b7280', fontStyle: 'italic',
            }}>
              <FiXCircle size={13} /> Sin archivo
            </span>
          );
        }
        // Si solo tiene 1 contrato con firmado → botón descargar directo
        if (conFirmado.length === 1) {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); handleDescargarFirmado(conFirmado[0].id); }}
              title="Descargar contrato firmado"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px', borderRadius: '8px', border: 'none',
                background: isDark ? 'rgba(5,150,105,.15)' : '#059669',
                color: isDark ? '#6ee7b7' : '#fff',
                fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
              }}>
              <FiDownload size={12} /> PDF
            </button>
          );
        }
        // Varios contratos con firmado → botón individual por cada uno
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {conFirmado.map((c) => (
              <button
                key={c.id}
                onClick={(e) => { e.stopPropagation(); handleDescargarFirmado(c.id); }}
                title={`Descargar Contrato #${c.contrato_numero} firmado`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 8px', borderRadius: '6px', border: 'none',
                  background: isDark ? 'rgba(5,150,105,.15)' : '#059669',
                  color: isDark ? '#6ee7b7' : '#fff',
                  fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                <FiDownload size={11} /> Contrato-{String(c.contrato_numero).padStart(2, '0')}
              </button>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Acciones', width: '80px',
      render: (row) => (
        <button className="btn-sm btn-info"
          onClick={(e) => { e.stopPropagation(); handleVerHistorial(row.empleado_id, `${row.empleado?.apellidos}, ${row.empleado?.nombres}`); }}
          title="Ver historial completo">
          <FiEye size={14} /> Ver
        </button>
      ),
    },
  ];

  const columnsProximos = [
    {
      header: 'Código', accessor: 'codigo_trabajador', width: '85px',
      render: (row) => <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{row.codigo_trabajador}</span>,
    },
    {
      header: 'Personal', accessor: 'apellidos',
      render: (row) => <span style={{ fontWeight: 500 }}>{row.nombre_completo}</span>,
    },
    { header: 'DNI', accessor: 'dni', width: '80px' },
    { header: 'Cargo' , accessor: 'cargo',render: (row) => row.cargo || '-', width: '110px' },
    { header: 'Área', accessor: 'area', render: (row) => row.area || '-', width: '100px' },
    {
      header: 'Vence el', accessor: 'contrato_fin', width: '135px',
      render: (row) => {
        const dias = row.dias_restantes;
        const vencido = dias < 0;
        const color = vencido ? '#7c3aed' : dias <= 7 ? '#dc2626' : dias <= 15 ? '#d97706' : '#0284c7';
        const diasAbs = Math.abs(dias);
        return (
          <div>
            <strong style={{ color }}>{formatDate(row.contrato_fin)}</strong><br />
            <small style={{ color, fontSize: '0.75rem', fontWeight: 700 }}>
              {vencido
                ? `⚠ Vencido hace ${diasAbs} día${diasAbs !== 1 ? 's' : ''}`
                : `⏱ ${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`
              }
            </small>
          </div>
        );
      },
    },
    {
      header: 'Estado', width: '115px',
      render: (row) => {
        const est = row.estado_proceso || 'borrador';
        const cfg = ESTADO_CONFIG[est] || ESTADO_CONFIG.borrador;
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 10px', borderRadius: '12px', fontSize: '0.76rem', fontWeight: 600,
            background: isDark ? cfg.bgDark : cfg.bg,
            color: isDark ? cfg.colorDark : '#fff',
          }}>
            {cfg.icon} {cfg.label}
          </span>
        );
      },
    },
    { header: 'Sueldo', render: (row) => formatMoney(row.sueldo_base), width: '90px' },
    {
      header: 'Acciones', width: '195px',
      render: (row) => {
        const est = row.estado_proceso || 'borrador';
        return (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {hasPermission('contratos.editar') && (
              <>
                <button className="btn-sm btn-primary"
                  onClick={(e) => { e.stopPropagation(); handleAbrirRenovar(row); }}
                  title="Renovar contrato"
                  style={{ display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', fontSize: '0.76rem' }}>
                  <FiRefreshCw size={12} /> Renovar
                </button>
                {est !== 'no_renovado' && (
                <button className="btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleAbrirNoRenovar(row); }}
                  title="No renovar contrato"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap',
                    fontSize: '0.76rem', background: '#dc2626', color: '#fff', border: 'none',
                    borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
                  }}>
                  <FiXCircle size={12} /> No Renovar
                </button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiRefreshCw size={24} style={{ color: 'var(--accent)' }} />
          <div>
            <h2>Historial de Contratos</h2>
            <small style={{ color: 'var(--text-muted)' }}>
              Registro de contrataciones, ceses y recontrataciones
            </small>
          </div>
        </div>
        <div className="page-actions">
          {user?.unidad?.length === 1 ? (
            <div style={{ padding: '7px 14px', background: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '8px', fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📍 {user.unidad[0]}
            </div>
          ) : user?.unidad?.length > 1 ? (
            <select className="form-select" value={filtroUnidad} onChange={e => setFiltroUnidad(e.target.value)}>
              <option value="">Todas mis unidades</option>
              {user.unidad.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          ) : (
            <select className="form-select" value={filtroUnidad} onChange={e => setFiltroUnidad(e.target.value)}>
              <option value="">Todas las unidades</option>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
          {hasPermission('contratos.editar') && (
            <button className="btn-primary" onClick={handleGenerarHistorial} title="Generar historial inicial para empleados sin registro">
              <FiDatabase size={16} /> Generar Historial Inicial
            </button>
          )}
          {hasPermission('contratos.ver') && (
            <button
              className="btn-secondary"
              onClick={() => { setFiltroMasivoUnidad(filtroUnidad); setFiltroMasivoArea(''); setModalMasivo(true); }}
              title="Imprimir contratos en masa filtrados por Unidad y Área"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiPrinter size={16} /> Impresión Masiva
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
        <button onClick={() => setActiveTab('proximos')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === 'proximos' ? '3px solid #dc2626' : '3px solid transparent',
            color: activeTab === 'proximos' ? '#dc2626' : 'var(--text-muted)',
            fontWeight: activeTab === 'proximos' ? 600 : 400, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s',
          }}>
          ⚠️ Por Vencer
          {proximosVencerFiltrados.length > 0 && (
            <span style={{
              background: '#dc2626', color: '#fff', borderRadius: '12px',
              padding: '1px 8px', fontSize: '0.75rem', marginLeft: '6px', fontWeight: 700,
            }}>{proximosVencerFiltrados.length}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('historial')}
          style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === 'historial' ? '3px solid var(--accent)' : '3px solid transparent',
            color: activeTab === 'historial' ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: activeTab === 'historial' ? 600 : 400, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s',
          }}>
          📋 Historial de Contratos
        </button>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'proximos' ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', margin: 0 }}>
              <FiAlertTriangle /> Contratos vencidos o por vencer (próximos 30 días)
            </h4>
            <button className="btn-secondary" onClick={cargarProximosVencer} disabled={loadingProximos}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem' }}>
              <FiRefreshCw size={14} /> Actualizar
            </button>
          </div>

          {/* Leyenda */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
              <strong style={{ color: '#7c3aed' }}>Vencido</strong> (&lt;0 días)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
              <strong style={{ color: '#dc2626' }}>Crítico</strong> (≤7 días)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
              <strong style={{ color: '#d97706' }}>Urgente</strong> (≤15 días)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
              <strong style={{ color: '#0284c7' }}>Próximo</strong> (≤30 días)
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {cfg.icon} <span style={{ fontSize: '0.75rem' }}>{cfg.label}</span>
                </span>
              ))}
            </span>
          </div>

          {loadingProximos ? (
            <Loading />
          ) : proximosVencerFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <FiAlertTriangle size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '1rem' }}>No hay contratos vencidos ni próximos a vencer en los próximos 30 días. ✅</p>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                Use <strong>"Renovar"</strong> para generar el nuevo contrato o <strong>"No Renovar"</strong> para cesar al empleado.
              </p>
              <DataTable columns={columnsProximos} data={proximosVencerFiltrados} searchable pageSize={15}
                filterFn={(row, term) => {
                  const t = term.toLowerCase();
                  return (
                    (row.apellidos     || '').toLowerCase().includes(t) ||
                    (row.nombres       || '').toLowerCase().includes(t) ||
                    (row.nombre_completo || '').toLowerCase().includes(t) ||
                    (row.codigo_trabajador || '').toLowerCase().includes(t) ||
                    (row.dni           || '').toLowerCase().includes(t)
                  );
                }}
              />
            </>
          )}
        </div>
      ) : (
        <div className="card">
          {empleadosConHistorial.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p>No hay historial de contratos registrado.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                Haz clic en <strong>"Generar Historial Inicial"</strong> para crear registros a partir de los datos actuales.
              </p>
            </div>
          ) : (
            <DataTable columns={columnsHistorial} data={empleadosConHistorial} searchable pageSize={15}
              filterFn={(row, term) => {
                const apellidos = (row.empleado?.apellidos || '').toLowerCase();
                const nombres   = (row.empleado?.nombres   || '').toLowerCase();
                const dni       = (row.empleado?.dni       || '').toLowerCase();
                const codigo    = (row.empleado?.codigo_trabajador || '').toLowerCase();
                return apellidos.includes(term) || nombres.includes(term) || dni.includes(term) || codigo.includes(term);
              }}
            />
          )}
        </div>
      )}

      {/* ========== Modal Detalle Historial ========== */}
      <Modal
        isOpen={modalDetalle.show}
        onClose={() => setModalDetalle({ show: false, empleado: null, contratos: [], empleadoId: null, empleadoDatos: null })}
        title={`Historial - ${modalDetalle.empleado || ''}`}
        size="large"
      >
        <div style={{ padding: '0' }}>
          {modalDetalle.contratos.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              No hay registros de contratos para este empleado.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {modalDetalle.contratos.map((contrato) => (
                <div key={contrato.id} style={{
                  border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px',
                  background: contrato.situacion === 'VIGENTE' ? 'var(--success-bg)' : 'var(--bg-tertiary)',
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: 'var(--accent)', color: '#fff', borderRadius: '50%',
                        width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem',
                      }}>{contrato.contrato_numero}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Contrato #{contrato.contrato_numero}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Badge Estado Proceso */}
                      {contrato.estado_proceso && contrato.estado_proceso !== 'borrador' && (() => {
                        const cfg = ESTADO_CONFIG[contrato.estado_proceso] || ESTADO_CONFIG.borrador;
                        return (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600,
                            background: isDark ? cfg.bgDark : cfg.bg, color: isDark ? cfg.colorDark : '#fff',
                          }}>{cfg.icon} {cfg.label}</span>
                        );
                      })()}
                      <span className="badge" style={{
                        backgroundColor: contrato.situacion === 'VIGENTE'
                          ? (isDark ? 'rgba(52,211,153,.12)' : '#4caf50')
                          : (isDark ? 'rgba(248,113,113,.12)' : '#f44336'),
                        color: isDark
                          ? (contrato.situacion === 'VIGENTE' ? '#6ee7b7' : '#fca5a5') : '#fff',
                      }}>{contrato.situacion}</span>
                      {contrato.documento_firmado_ruta && (
                        <button onClick={() => handleDescargarFirmado(contrato.id)} title="Descargar contrato firmado"
                          style={{
                            background: '#059669', color: '#fff', border: 'none',
                            borderRadius: '4px', padding: '4px 8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem',
                          }}>
                          <FiDownload size={12} /> Firmado
                        </button>
                      )}
                      <button
                        className="btn-icon-sm"
                        onClick={() => editandoContratoId === contrato.id ? handleCancelarEdicion() : handleAbrirEdicion(contrato)}
                        title={editandoContratoId === contrato.id ? 'Cancelar edición' : 'Editar datos del contrato'}
                        style={{
                          background: 'none', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer',
                          border: `1px solid ${editandoContratoId === contrato.id ? '#d97706' : 'var(--accent)'}`,
                          color: editandoContratoId === contrato.id ? '#d97706' : 'var(--accent)',
                        }}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button className="btn-icon-sm btn-danger" onClick={() => handleEliminarContrato(contrato.id)}
                        disabled={modalDetalle.contratos.length <= 1}
                        style={{
                          background: 'none',
                          border: `1px solid ${modalDetalle.contratos.length <= 1 ? 'var(--border-color)' : c.danger}`,
                          color: modalDetalle.contratos.length <= 1 ? 'var(--text-muted)' : c.danger,
                          borderRadius: '4px', padding: '4px 6px',
                          cursor: modalDetalle.contratos.length <= 1 ? 'not-allowed' : 'pointer',
                          opacity: modalDetalle.contratos.length <= 1 ? 0.4 : 1,
                        }}
                        title={modalDetalle.contratos.length <= 1 ? 'No se puede eliminar el único contrato del empleado' : 'Eliminar registro'}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Periodo</span><br />
                      <strong>{formatDate(contrato.fecha_inicio)}</strong> → <strong>{contrato.fecha_fin ? formatDate(contrato.fecha_fin) : 'Indefinido'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Duración</span><br />
                      <strong style={{ color: 'var(--accent)' }}>
                        {calcDuracion(contrato.fecha_inicio, contrato.fecha_cese || contrato.fecha_fin || null) || '—'}
                      </strong>
                      {!contrato.fecha_fin && !contrato.fecha_cese && (
                        <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>(hasta hoy)</small>
                      )}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Tipo Contrato</span><br />
                      <strong>{contrato.tipo_contrato || '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Sueldo</span><br />
                      <strong>{contrato.sueldo ? formatMoney(contrato.sueldo) : '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Cargo</span><br />
                      {contrato.cargo || '-'}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Área</span><br />
                      {contrato.area || '-'}
                    </div>
                    {contrato.situacion === 'CESADO' && (
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Fecha Cese</span><br />
                        <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{formatDate(contrato.fecha_cese)}</span>
                      </div>
                    )}
                    {contrato.motivo_cese && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Motivo de Cese</span><br />
                        {contrato.motivo_cese}
                      </div>
                    )}
                    {contrato.motivo_no_renovacion && (
                      <div style={{ gridColumn: 'span 3' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Motivo No Renovación</span><br />
                        <em style={{ color: '#dc2626' }}>{contrato.motivo_no_renovacion}</em>
                      </div>
                    )}
                    {contrato.observaciones && (
                      <div style={{ gridColumn: 'span 3' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Observaciones</span><br />
                        <em>{contrato.observaciones}</em>
                      </div>
                    )}
                  </div>

                  {/* Botón Reactivar — solo visible cuando el contrato está CESADO */}
                  {contrato.situacion === 'CESADO' && (
                    <div style={{
                      marginTop: '10px', padding: '10px 14px', borderRadius: '8px',
                      background: isDark ? 'rgba(234,179,8,.07)' : '#fefce8',
                      border: `1px solid ${isDark ? '#ca8a04' : '#fde047'}`,
                      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                    }}>
                      <span style={{ fontSize: '0.8rem', color: isDark ? '#fbbf24' : '#92400e', flex: 1 }}>
                        ⚠️ Este contrato fue cesado por error. Puedes revertirlo a <strong>VIGENTE</strong>.
                      </span>
                      <button
                        disabled={reactivandoId === contrato.id}
                        onClick={() => handleReactivarContrato(contrato)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 16px', borderRadius: '6px', border: 'none',
                          background: reactivandoId === contrato.id ? '#6b7280' : '#16a34a',
                          color: '#fff', fontWeight: 700, fontSize: '0.82rem',
                          cursor: reactivandoId === contrato.id ? 'not-allowed' : 'pointer',
                          opacity: reactivandoId === contrato.id ? 0.7 : 1,
                          whiteSpace: 'nowrap',
                        }}>
                        <FiUserCheck size={14} />
                        {reactivandoId === contrato.id ? 'Reactivando...' : 'Reactivar a VIGENTE'}
                      </button>
                    </div>
                  )}

                  {/* Formulario de edición inline */}
                  {editandoContratoId === contrato.id && (
                    <div style={{
                      marginTop: '12px', padding: '14px', borderRadius: '8px',
                      background: isDark ? 'rgba(59,130,246,.08)' : '#eff6ff',
                      border: `1px solid ${isDark ? '#3b82f6' : '#93c5fd'}`,
                    }}>
                      <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <FiEdit2 size={14} /> Editando datos del contrato
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                          — Los cambios se reflejarán en el PDF/Word instantáneamente
                        </span>
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem' }}>Fecha Inicio *</label>
                          <input type="date" className="form-input" value={formEditContrato.fecha_inicio || ''}
                            onChange={e => setFormEditContrato(p => ({ ...p, fecha_inicio: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem' }}>Fecha Fin</label>
                          <input type="date" className="form-input" value={formEditContrato.fecha_fin || ''}
                            onChange={e => setFormEditContrato(p => ({ ...p, fecha_fin: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem' }}>Tipo Contrato</label>
                          <select className="form-select" value={formEditContrato.tipo_contrato || 'PLAZO_FIJO'}
                            onChange={e => setFormEditContrato(p => ({ ...p, tipo_contrato: e.target.value }))}>
                            <option value="PLAZO_FIJO">Plazo Fijo</option>
                            <option value="INDEFINIDO">Indefinido</option>
                            <option value="PARCIAL">Parcial</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem' }}>Sueldo (S/.)</label>
                          <input type="number" step="0.01" min="0" className="form-input" value={formEditContrato.sueldo_base || ''}
                            onChange={e => setFormEditContrato(p => ({ ...p, sueldo_base: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem' }}>Cargo (vacío = mantener actual)</label>
                          <select className="form-select" value={formEditContrato.cargo_id || ''}
                            onChange={e => setFormEditContrato(p => ({ ...p, cargo_id: e.target.value }))}>
                            <option value="">— {contrato.cargo || 'Mantener actual'} —</option>
                            {catalogos.cargos?.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem' }}>Área (vacío = mantener actual)</label>
                          <select className="form-select" value={formEditContrato.area_id || ''}
                            onChange={e => setFormEditContrato(p => ({ ...p, area_id: e.target.value }))}>
                            <option value="">— {contrato.area || 'Mantener actual'} —</option>
                            {catalogos.areas?.map(a => <option key={a.id} value={String(a.id)}>{a.nombre}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem' }}>Fecha de Firma</label>
                          <input type="date" className="form-input" value={formEditContrato.fecha_firma || ''}
                            onChange={e => setFormEditContrato(p => ({ ...p, fecha_firma: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.78rem' }}>Observaciones</label>
                          <input type="text" className="form-input" value={formEditContrato.observaciones || ''}
                            onChange={e => setFormEditContrato(p => ({ ...p, observaciones: e.target.value }))}
                            placeholder="Observaciones..." />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                        <button onClick={handleCancelarEdicion}
                          style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                          Cancelar
                        </button>
                        <button onClick={handleGuardarEdicion} disabled={guardandoEditContrato}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '7px 18px', borderRadius: '6px', border: 'none',
                            background: guardandoEditContrato ? '#6b7280' : '#059669',
                            color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                            cursor: guardandoEditContrato ? 'not-allowed' : 'pointer',
                            opacity: guardandoEditContrato ? 0.6 : 1,
                          }}>
                          <FiSave size={14} /> {guardandoEditContrato ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botones descargar contrato */}
                  <div style={{
                    display: 'flex', gap: '8px', marginTop: '12px',
                    paddingTop: '10px', borderTop: '1px dashed var(--border-color)', alignItems: 'center', flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>📄 Descargar contrato:</span>
                    <button
                      onClick={() => handlePDFContratoHistorial(contrato)}
                      disabled={generandoPDFDetalleId === contrato.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 14px', borderRadius: '6px', border: 'none',
                        background: generandoPDFDetalleId === contrato.id ? '#6b7280' : '#dc2626',
                        color: '#fff', fontWeight: 600, fontSize: '0.8rem',
                        cursor: generandoPDFDetalleId === contrato.id ? 'not-allowed' : 'pointer',
                        opacity: generandoPDFDetalleId === contrato.id ? 0.7 : 1,
                      }}>
                      <FiDownload size={13} />
                      {generandoPDFDetalleId === contrato.id ? 'Generando...' : 'PDF'}
                    </button>
                    <button
                      onClick={() => handleWordContratoHistorial(contrato)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 14px', borderRadius: '6px', border: 'none',
                        background: '#1d4ed8', color: '#fff', fontWeight: 600,
                        fontSize: '0.8rem', cursor: 'pointer',
                      }}>
                      <FiFileText size={13} /> Word
                    </button>
                    {/* Separador */}
                    <div style={{ width: '1px', background: 'var(--border-color)', alignSelf: 'stretch', margin: '0 4px' }} />
                    {/* Subir firmado */}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📎 Firmado:</span>
                    {contrato.documento_firmado_ruta && (
                      <button onClick={() => handleDescargarFirmado(contrato.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '5px 12px', borderRadius: '6px', border: 'none',
                          background: '#059669', color: '#fff', fontWeight: 600,
                          fontSize: '0.8rem', cursor: 'pointer',
                        }}>
                        <FiDownload size={13} /> Descargar
                      </button>
                    )}
                    <button
                      disabled={uploadingDetalleId === contrato.id}
                      onClick={() => { setUploadTargetId(contrato.id); setTimeout(() => fileInputDetalleRef.current?.click(), 50); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '5px 12px', borderRadius: '6px',
                        border: '2px dashed #059669', background: 'rgba(5,150,105,.08)',
                        color: '#059669', fontWeight: 600, fontSize: '0.8rem',
                        cursor: uploadingDetalleId === contrato.id ? 'not-allowed' : 'pointer',
                        opacity: uploadingDetalleId === contrato.id ? 0.6 : 1,
                      }}>
                      <FiUpload size={13} />
                      {uploadingDetalleId === contrato.id ? 'Subiendo...' : contrato.documento_firmado_ruta ? 'Reemplazar' : 'Subir PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
      {/* Input oculto para subir firmado desde modal detalle */}
      <input
        ref={fileInputDetalleRef}
        type="file"
        accept="application/pdf"
        onChange={handleSubirFirmadoDetalle}
        style={{ display: 'none' }}
      />

      {/* ========== Modal Recontratar ========== */}
      <Modal
        isOpen={modalRecontratar.show}
        onClose={() => setModalRecontratar({ show: false, empleado: null })}
        title={`Recontratar - ${modalRecontratar.empleado ? `${modalRecontratar.empleado.apellidos}, ${modalRecontratar.empleado.nombres}` : ''}`}
        size="medium"
      >
        <div>
          {modalRecontratar.empleado && (
            <div style={{
              background: 'var(--info-bg)', border: '1px solid var(--info)',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.85rem',
            }}>
              <strong>Último contrato:</strong>{' '}
              {formatDate(modalRecontratar.empleado.contrato_inicio)} → {formatDate(modalRecontratar.empleado.contrato_fin)}<br />
              <strong>Cesado el:</strong>{' '}
              <span style={{ color: 'var(--danger)' }}>{formatDate(modalRecontratar.empleado.fecha_cese)}</span>
              {modalRecontratar.empleado.motivo_cese && <> — {modalRecontratar.empleado.motivo_cese}</>}
            </div>
          )}
          <div className="form-section">
            <h4>Datos del Nuevo Contrato</h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Fecha Inicio *</label>
                <input type="date" value={formRecontratar.fecha_inicio}
                  onChange={(e) => setFormRecontratar({ ...formRecontratar, fecha_inicio: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Fecha Fin</label>
                <input type="date" value={formRecontratar.fecha_fin}
                  onChange={(e) => setFormRecontratar({ ...formRecontratar, fecha_fin: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tipo Contrato</label>
                <select value={formRecontratar.tipo_contrato}
                  onChange={(e) => setFormRecontratar({ ...formRecontratar, tipo_contrato: e.target.value })}>
                  <option value="PLAZO_FIJO">Plazo Fijo</option>
                  <option value="INDEFINIDO">Indefinido</option>
                  <option value="PARCIAL">Parcial</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sueldo Base</label>
                <input type="number" step="0.01" min="0" value={formRecontratar.sueldo_base}
                  onChange={(e) => setFormRecontratar({ ...formRecontratar, sueldo_base: e.target.value })}
                  placeholder={modalRecontratar.empleado?.sueldo_base || 'Mismo sueldo'} />
              </div>
              <div className="form-group">
                <label>Área</label>
                <select value={formRecontratar.area_id}
                  onChange={(e) => setFormRecontratar({ ...formRecontratar, area_id: e.target.value })}>
                  <option value="">Misma área</option>
                  {catalogos.areas?.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Cargo</label>
                <select value={formRecontratar.cargo_id}
                  onChange={(e) => setFormRecontratar({ ...formRecontratar, cargo_id: e.target.value })}>
                  <option value="">Mismo cargo</option>
                  {catalogos.cargos?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Observaciones</label>
                <input type="text" value={formRecontratar.observaciones}
                  onChange={(e) => setFormRecontratar({ ...formRecontratar, observaciones: e.target.value })}
                  placeholder="Motivo de recontratación..." />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setModalRecontratar({ show: false, empleado: null })} disabled={submitting}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleRecontratar} disabled={submitting} style={{ backgroundColor: '#059669' }}>
              {submitting ? 'Procesando...' : '✓ Recontratar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========== Modal Renovar Contrato ========== */}
      <Modal
        isOpen={modalRenovar.show}
        onClose={() => { setModalRenovar({ show: false, empleado: null, empleadoDatos: null }); setVistaRenovar(false); setRenovacionGuardada(false); setContratoGuardadoId(null); setContratosUnidadRenovar([]); setContratoUnidadGuardado(false); }}
        title={`📄 Renovar Contrato — ${modalRenovar.empleado ? modalRenovar.empleado.nombre_completo : ''}`}
        size="large"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Info del contrato actual */}
          {modalRenovar.empleado && (
            <div style={{
              background: modalRenovar.empleado.dias_restantes <= 7 ? 'rgba(220,38,38,.08)' : 'rgba(217,119,6,.07)',
              border: `1px solid ${modalRenovar.empleado.dias_restantes <= 7 ? '#dc2626' : '#d97706'}`,
              borderRadius: '8px', padding: '12px 16px', fontSize: '0.85rem',
            }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Contrato vigente:</span>{' '}
                  <strong>{formatDate(modalRenovar.empleado.contrato_inicio)}</strong> →{' '}
                  <strong style={{ color: '#dc2626' }}>{formatDate(modalRenovar.empleado.contrato_fin)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Días restantes:</span>{' '}
                  <strong style={{ color: modalRenovar.empleado.dias_restantes <= 7 ? '#dc2626' : '#d97706', fontSize: '1rem' }}>
                    {modalRenovar.empleado.dias_restantes} días
                  </strong>
                </div>
                <div><span style={{ color: 'var(--text-muted)' }}>Cargo:</span> <strong>{modalRenovar.empleado.cargo}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Área:</span> <strong>{modalRenovar.empleado.area}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Sueldo:</span> <strong>{formatMoney(modalRenovar.empleado.sueldo_base)}</strong></div>
              </div>
            </div>
          )}

          {/* Formulario */}
          <div className="form-section">
            <h4 style={{ marginBottom: '14px', color: 'var(--accent)', fontSize: '0.95rem' }}>
              📝 Datos del Nuevo Contrato (editar según corresponda)
            </h4>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Fecha Inicio Nuevo Contrato *</label>
                <input type="date" value={formRenovar.fecha_inicio}
                  onChange={(e) => { setFormRenovar({ ...formRenovar, fecha_inicio: e.target.value }); setVistaRenovar(false); }} />
              </div>
              <div className="form-group">
                <label>Fecha Fin Nuevo Contrato *</label>
                <input type="date" value={formRenovar.fecha_fin}
                  onChange={(e) => { setFormRenovar({ ...formRenovar, fecha_fin: e.target.value }); setVistaRenovar(false); }} />
              </div>
              {/* Horario de Jornada – Cláusula 5.2 */}
              <div className="col-span-2" style={{
                background: 'rgba(59,130,246,0.04)',
                border: '1.5px solid var(--accent)',
                borderRadius: '10px',
                padding: '12px 14px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    ⏱ Horario de Jornada
                  </span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    background: 'var(--accent)', color: '#fff',
                    padding: '2px 9px', borderRadius: '20px', letterSpacing: '0.3px',
                  }}>Cláusula 5.2</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0 12px', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                      Hora de Entrada
                    </label>
                    <input type="time" value={formRenovar.hora_inicio}
                      onChange={(e) => { setFormRenovar({ ...formRenovar, hora_inicio: e.target.value }); setVistaRenovar(false); }}
                      style={{ fontWeight: 600, fontSize: '0.93rem', borderColor: 'rgba(34,197,94,0.45)' }} />
                  </div>
                  <div style={{ paddingBottom: '10px', color: 'var(--text-muted)', fontSize: '1.3rem', fontWeight: 300, lineHeight: 1, userSelect: 'none' }}>
                    →
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block', flexShrink: 0 }} />
                      Hora de Salida
                    </label>
                    <input type="time" value={formRenovar.hora_fin}
                      onChange={(e) => { setFormRenovar({ ...formRenovar, hora_fin: e.target.value }); setVistaRenovar(false); }}
                      style={{ fontWeight: 600, fontSize: '0.93rem', borderColor: 'rgba(248,113,113,0.45)' }} />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Tipo Contrato</label>
                <select value={formRenovar.tipo_contrato}
                  onChange={(e) => setFormRenovar({ ...formRenovar, tipo_contrato: e.target.value })}>
                  <option value="PLAZO_FIJO">Plazo Fijo</option>
                  <option value="INDEFINIDO">Indefinido</option>
                  <option value="PARCIAL">Parcial</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sueldo Base (S/.)</label>
                <input type="number" step="0.01" min="0" value={formRenovar.sueldo_base}
                  onChange={(e) => setFormRenovar({ ...formRenovar, sueldo_base: e.target.value })}
                  placeholder={`Actual: S/. ${modalRenovar.empleado?.sueldo_base || 0}`} />
              </div>
              {/* Checkbox alimentación */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={formRenovar.con_alimentacion}
                    onChange={(e) => { setFormRenovar({ ...formRenovar, con_alimentacion: e.target.checked }); setVistaRenovar(false); }}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#059669' }}
                  />
                  <span style={{ fontSize: '0.85rem' }}>
                    Incluir condición de trabajo por alimentación
                    <span style={{
                      marginLeft: '8px', fontSize: '0.78rem', fontWeight: 600,
                      background: formRenovar.con_alimentacion ? 'rgba(5,150,105,.12)' : 'var(--bg-secondary)',
                      color: formRenovar.con_alimentacion ? '#059669' : 'var(--text-muted)',
                      padding: '2px 8px', borderRadius: '20px',
                      border: `1px solid ${formRenovar.con_alimentacion ? '#059669' : 'var(--border-color)'}`,
                    }}>
                      + S/ 45.00 por día (21x7, según tareo)
                    </span>
                  </span>
                </label>
              </div>
              <div className="form-group">
                <label>Cargo (dejar vacío = mismo cargo)</label>
                <select value={formRenovar.cargo_id}
                  onChange={(e) => { setFormRenovar({ ...formRenovar, cargo_id: e.target.value }); setVistaRenovar(false); }}>
                  <option value="">— Mismo cargo: {modalRenovar.empleado?.cargo} —</option>
                  {catalogos.cargos?.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Área (dejar vacío = misma área)</label>
                <select value={formRenovar.area_id}
                  onChange={(e) => { setFormRenovar({ ...formRenovar, area_id: e.target.value }); setVistaRenovar(false); }}>
                  <option value="">— Misma área: {modalRenovar.empleado?.area} —</option>
                  {catalogos.areas?.map(a => <option key={a.id} value={String(a.id)}>{a.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Unidad</label>
                <select value={formRenovar.unidad}
                  onChange={(e) => {
                    const nuevaUnidad = e.target.value;
                    setFormRenovar({ ...formRenovar, unidad: nuevaUnidad, contrato_unidad_id: '' });
                    if (nuevaUnidad) {
                      getContratosUnidad(nuevaUnidad)
                        .then(data => setContratosUnidadRenovar(data))
                        .catch(() => setContratosUnidadRenovar([]));
                    } else {
                      setContratosUnidadRenovar([]);
                    }
                  }}>
                  <option value="">— Seleccione unidad —</option>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Contrato de Unidad</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <select
                      value={formRenovar.contrato_unidad_id || ''}
                      onChange={(e) => setFormRenovar({ ...formRenovar, contrato_unidad_id: e.target.value })}
                      disabled={!formRenovar.unidad || contratosUnidadRenovar.length === 0}
                      style={{ width: '100%' }}
                    >
                      <option value="">
                        {!formRenovar.unidad
                          ? '— Seleccione una unidad primero —'
                          : contratosUnidadRenovar.length === 0
                          ? '— Sin contratos registrados —'
                          : '— Seleccione contrato —'}
                      </option>
                      {contratosUnidadRenovar.map(c => (
                        <option key={c.id} value={String(c.id)}>
                          {c.descripcion.length > 90 ? c.descripcion.substring(0, 90) + '...' : c.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleGuardarContratoUnidad}
                    disabled={guardandoContratoUnidad || !formRenovar.contrato_unidad_id}
                    title="Guardar contrato de unidad en el empleado"
                    style={{
                      padding: '8px 14px', borderRadius: '6px', border: 'none',
                      background: contratoUnidadGuardado ? '#059669' : '#7c3aed',
                      color: '#fff', fontWeight: 600, fontSize: '0.82rem',
                      cursor: guardandoContratoUnidad || !formRenovar.contrato_unidad_id ? 'not-allowed' : 'pointer',
                      opacity: guardandoContratoUnidad || !formRenovar.contrato_unidad_id ? 0.55 : 1,
                      whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px',
                      transition: 'background 0.3s', flexShrink: 0,
                    }}
                  >
                    {contratoUnidadGuardado ? '✓ Guardado' : guardandoContratoUnidad ? 'Guardando...' : '💾 Guardar contrato'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={formRenovar.categoria}
                  onChange={(e) => setFormRenovar({ ...formRenovar, categoria: e.target.value })}>
                  <option value="OBRERO">Obrero</option>
                  <option value="EMPLEADO">Empleado</option>
                  <option value="EJECUTIVO">Ejecutivo</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Fecha de Firma del Documento</label>
                <input type="date" value={formRenovar.fecha_firma}
                  onChange={(e) => setFormRenovar({ ...formRenovar, fecha_firma: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Concepto</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <ConceptoSelect
                      value={formRenovar.concepto || ''}
                      onChange={(val) => setFormRenovar({ ...formRenovar, concepto: val })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGuardarConcepto}
                    disabled={guardandoConcepto || !formRenovar.concepto}
                    title="Guardar concepto en el empleado ahora"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: conceptoGuardado ? '#059669' : '#2563eb',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: guardandoConcepto || !formRenovar.concepto ? 'not-allowed' : 'pointer',
                      opacity: guardandoConcepto || !formRenovar.concepto ? 0.55 : 1,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'background 0.3s',
                      flexShrink: 0,
                    }}
                  >
                    {conceptoGuardado ? '✓ Guardado' : guardandoConcepto ? 'Guardando...' : '💾 Guardar concepto'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Banner éxito */}
          {renovacionGuardada && (
            <div style={{
              background: 'rgba(5,150,105,.1)', border: '1px solid #059669',
              borderRadius: '8px', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem',
            }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span>
              <div>
                <strong style={{ color: '#059669' }}>Renovación guardada.</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  Descargue PDF/Word, imprima, firme y luego suba el escaneo del contrato firmado.
                </span>
              </div>
            </div>
          )}

          {/* Botones: ① Revisar → ② Aceptar → ③ Subir Firmado */}
          <div style={{
            display: 'flex', gap: '10px', flexWrap: 'wrap',
            padding: '14px 0', borderTop: '1px solid var(--border-color)', alignItems: 'center',
          }}>

            {/* ① Revisar: Vista Previa / PDF / Word — siempre visibles */}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>① Revisar:</span>
            <button onClick={handleVistaPreviaRenovar}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'transparent',
                color: 'var(--text)', fontWeight: 600, cursor: 'pointer',
              }}>
              <FiEye size={16} /> Vista Previa
            </button>
            <button onClick={handlePDFRenovacion} disabled={generandoPDFRenovar}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', borderRadius: '8px', border: 'none',
                background: '#dc2626', color: '#fff', fontWeight: 700,
                cursor: generandoPDFRenovar ? 'not-allowed' : 'pointer',
                opacity: generandoPDFRenovar ? 0.6 : 1,
              }}>
              <FiDownload size={16} /> {generandoPDFRenovar ? 'Generando...' : 'PDF'}
            </button>
            <button onClick={handleWordRenovacion}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', borderRadius: '8px', border: 'none',
                background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: 'pointer',
              }}>
              <FiFileText size={16} /> Word
            </button>

            {/* Separador */}
            <div style={{ width: '1px', background: 'var(--border-color)', alignSelf: 'stretch', margin: '0 4px' }} />

            {/* ② Aceptar Contrato = guardar en BD */}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>② Aceptar:</span>
            <button onClick={handleGuardarRenovacion} disabled={guardandoRenovar}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 22px', borderRadius: '8px', border: 'none',
                background: guardandoRenovar ? '#6b7280' : '#059669',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                cursor: guardandoRenovar ? 'not-allowed' : 'pointer',
                opacity: guardandoRenovar ? 0.6 : 1,
                boxShadow: guardandoRenovar ? 'none' : '0 2px 8px rgba(5,150,105,.35)',
              }}>
              <FiCheckCircle size={16} />
              {guardandoRenovar ? 'Guardando...' : renovacionGuardada ? 'Actualizar Contrato' : 'Aceptar Contrato'}
            </button>

            {/* ③ Subir firmado — solo después de guardar */}
            {renovacionGuardada && (
              <>
                <div style={{ width: '1px', background: 'var(--border-color)', alignSelf: 'stretch', margin: '0 4px' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>③ Firmado:</span>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleSubirFirmado} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFirmado}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 18px', borderRadius: '8px', border: '2px dashed #059669',
                    background: 'rgba(5,150,105,.08)', color: '#059669', fontWeight: 700,
                    cursor: uploadingFirmado ? 'not-allowed' : 'pointer',
                  }}>
                  <FiUpload size={16} /> {uploadingFirmado ? 'Subiendo...' : 'Subir Firmado'}
                </button>
              </>
            )}

            <span style={{ flex: 1 }} />
            <button
              onClick={() => { setModalRenovar({ show: false, empleado: null, empleadoDatos: null }); setVistaRenovar(false); setRenovacionGuardada(false); setContratoGuardadoId(null); }}
              style={{
                padding: '9px 16px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}>
              Cerrar
            </button>
          </div>

          {/* Vista previa */}
          {vistaRenovar && (
            <div style={{ border: '2px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '8px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                📋 Vista previa del contrato de renovación
              </div>
              <iframe ref={iframeRenovarRef} style={{ width: '100%', height: '520px', border: 'none', display: 'block' }} title="Vista Previa Renovación" />
            </div>
          )}
        </div>
      </Modal>

      {/* ========== Modal No Renovar ========== */}
      <Modal
        isOpen={modalNoRenovar.show}
        onClose={() => setModalNoRenovar({ show: false, empleado: null })}
        title="❌ No Renovar Contrato"
        size="medium"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {modalNoRenovar.empleado && (
            <div style={{
              background: 'rgba(220,38,38,.06)', border: '1px solid #dc2626',
              borderRadius: '8px', padding: '14px 16px', fontSize: '0.9rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <FiAlertTriangle size={20} color="#dc2626" />
                <strong style={{ color: '#dc2626' }}>¿Está seguro de NO renovar este contrato?</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                <strong>Empleado:</strong> {modalNoRenovar.empleado.nombre_completo}<br />
                <strong>DNI:</strong> {modalNoRenovar.empleado.dni}<br />
                <strong>Contrato vigente:</strong> {formatDate(modalNoRenovar.empleado.contrato_inicio)} → {formatDate(modalNoRenovar.empleado.contrato_fin)}<br />
                <strong>Días restantes:</strong> <span style={{ color: '#dc2626', fontWeight: 700 }}>{modalNoRenovar.empleado.dias_restantes} días</span>
              </div>
            </div>
          )}

          <div style={{
            background: 'rgba(217,119,6,.08)', border: '1px solid #d97706',
            borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#92400e',
          }}>
            ⚠️ <strong>Esta acción cesará automáticamente al empleado</strong> al llegar la fecha de vencimiento del contrato.
            El contrato quedará registrado como "No Renovado" en el historial.
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              Motivo de la No Renovación *
            </label>
            <textarea
              value={motivoNoRenovar}
              onChange={(e) => setMotivoNoRenovar(e.target.value)}
              placeholder="Ingrese el motivo por el cual no se renovará el contrato..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn-secondary"
              onClick={() => setModalNoRenovar({ show: false, empleado: null })}
              disabled={submittingNoRenovar}>
              Cancelar
            </button>
            <button onClick={handleConfirmarNoRenovar}
              disabled={submittingNoRenovar || !motivoNoRenovar.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                background: submittingNoRenovar ? '#6b7280' : '#dc2626',
                color: '#fff', fontWeight: 700, cursor: submittingNoRenovar ? 'not-allowed' : 'pointer',
                opacity: (submittingNoRenovar || !motivoNoRenovar.trim()) ? 0.6 : 1,
              }}>
              <FiXCircle size={16} />
              {submittingNoRenovar ? 'Procesando...' : 'Confirmar No Renovación'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== MODAL IMPRESIÓN MASIVA ===== */}
      <Modal
        isOpen={modalMasivo}
        onClose={() => { if (!generandoMasivo) { setModalMasivo(false); setFiltroMasivoUnidad(''); setFiltroMasivoArea(''); } }}
        title="🖨️ Impresión Masiva de Contratos"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Filtro Unidad */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>
              1. Selecciona la Unidad
            </label>
            <select
              className="form-select"
              value={filtroMasivoUnidad}
              onChange={e => { setFiltroMasivoUnidad(e.target.value); setFiltroMasivoArea(''); }}
              disabled={generandoMasivo}
              style={{ width: '100%' }}
            >
              <option value="">— Todas las unidades —</option>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Filtro Área */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.9rem' }}>
              2. Selecciona el Área <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
            </label>
            <select
              className="form-select"
              value={filtroMasivoArea}
              onChange={e => setFiltroMasivoArea(e.target.value)}
              disabled={generandoMasivo}
              style={{ width: '100%' }}
            >
              <option value="">— Todas las áreas —</option>
              {(() => {
                // Solo mostrar áreas que tienen empleados en la unidad seleccionada
                const idsPresentes = new Set(
                  empleadosConHistorial
                    .filter(e => !filtroMasivoUnidad || e.empleado?.unidad === filtroMasivoUnidad)
                    .map(e => String(e.empleado?.area_id))
                    .filter(Boolean)
                );
                return (catalogos.areas || [])
                  .filter(a => idsPresentes.has(String(a.id)))
                  .map(a => <option key={a.id} value={String(a.id)}>{a.nombre}</option>);
              })()}
            </select>
          </div>

          {/* Contador de empleados encontrados */}
          {(() => {
            const count = empleadosConHistorial.filter(e => {
              const mismaUnidad = !filtroMasivoUnidad || e.empleado?.unidad === filtroMasivoUnidad;
              const mismaArea   = !filtroMasivoArea   || String(e.empleado?.area_id) === filtroMasivoArea;
              return mismaUnidad && mismaArea;
            }).length;
            return (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: count > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${count > 0 ? '#10b981' : '#ef4444'}`,
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '1.4rem' }}>{count > 0 ? '👥' : '⚠️'}</span>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: count > 0 ? '#059669' : '#dc2626' }}>
                    {count} empleado{count !== 1 ? 's' : ''}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '6px' }}>
                    {count > 0 ? 'se generarán sus contratos' : 'sin resultados para estos filtros'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Barra de progreso durante la generación */}
          {generandoMasivo && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Generando...</span>
                <span style={{ fontWeight: 700 }}>{progresoMasivo.actual} / {progresoMasivo.total}</span>
              </div>
              <div style={{ background: 'var(--border-color)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${progresoMasivo.total ? (progresoMasivo.actual / progresoMasivo.total) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  borderRadius: '6px',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              {progresoMasivo.nombre && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                  📄 {progresoMasivo.nombre}
                </p>
              )}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn-secondary"
              onClick={() => { setModalMasivo(false); setFiltroMasivoUnidad(''); setFiltroMasivoArea(''); }}
              disabled={generandoMasivo}
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerarMasivo}
              disabled={generandoMasivo || empleadosConHistorial.filter(e =>
                (!filtroMasivoUnidad || e.empleado?.unidad === filtroMasivoUnidad) &&
                (!filtroMasivoArea   || String(e.empleado?.area_id) === filtroMasivoArea)
              ).length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                background: generandoMasivo ? '#6b7280' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff', fontWeight: 700, cursor: generandoMasivo ? 'not-allowed' : 'pointer',
                opacity: (generandoMasivo || empleadosConHistorial.filter(e =>
                  (!filtroMasivoUnidad || e.empleado?.unidad === filtroMasivoUnidad) &&
                  (!filtroMasivoArea   || String(e.empleado?.area_id) === filtroMasivoArea)
                ).length === 0) ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              <FiPrinter size={16} />
              {generandoMasivo
                ? `Generando ${progresoMasivo.actual}/${progresoMasivo.total}...`
                : 'Generar PDFs'}
            </button>
          </div>

        </div>
      </Modal>
    </div>
  );
}

export default HistorialContratos;
