import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiSave, FiDollarSign, FiDownload, FiClock, FiPlus, FiTrash2, FiSearch, FiX, FiAlertTriangle, FiRefreshCw, FiCheck, FiCalendar } from 'react-icons/fi';
import { getTareoMes, getTareoPorArea, registrarMasivo, eliminarMasivo, guardarExtras, acumularDias, usarDiasAcumulados, guardarHorasExtraDetalles, guardarAdelantoDetalles, crearAdelanto, getAdelantosEmpleado, eliminarAdelanto, actualizarAdelanto, guardarOtrosDescuentos, guardarVacacionesCobro, eliminarVacacionesCobro } from '../services/tareoService';
import { cesarEmpleado } from '../services/empleadoService';
import { getAmonestacionesPorEmpleado, createAmonestacion as crearAmonestacion, deleteAmonestacion as borrarAmonestacion } from '../services/amonestacionService';
import { useCatalogos } from '../contexts/CatalogosContext';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/common/Loading';
import { MESES, TIPOS_REGISTRO, VALORES_REGISTRO, ORDEN_COLUMNAS_TAREO, UNIDADES } from '../utils/constants';
import { diasEnMes } from '../utils/helpers';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';

function Tareo() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const { catalogos } = useCatalogos();
  const { user, hasRole, hasPermission } = useAuth();
  const { isDark, c } = useThemeColors();
  const isAdmin = hasRole('Administrador');
  // Si el rol tiene permisos tareo.editar_YYYY → modo restringido por año.
  // Si no tiene ninguno → sin restricción (puede editar todos los años).
  const tieneRestriccionAnios = !isAdmin && user?.permissions?.some(p => /^tareo\.editar_\d{4}$/.test(p));
  const tieneRestriccionMeses = !isAdmin && user?.permissions?.some(p => /^tareo\.editar_mes_\d{1,2}$/.test(p));
  const canEditTareo = hasPermission('tareo.editar')
    && (!tieneRestriccionAnios || hasPermission(`tareo.editar_${anio}`))
    && (!tieneRestriccionMeses || hasPermission(`tareo.editar_mes_${mes}`));
  const canRegistrarCese = isAdmin || hasPermission('tareo.registrar_cese');
  // Permisos directos por columna (se requiere permiso explícito para cada una)
  const canEditBono          = isAdmin || hasPermission('tareo.editar_bono');
  const canEditViaticos      = isAdmin || hasPermission('tareo.editar_viaticos');
  const canEditAlimentacion  = isAdmin || hasPermission('tareo.editar_alimentacion');
  const canEditHoraExtra     = isAdmin || hasPermission('tareo.editar_hora_extra');
  const canEditAdelanto      = isAdmin || hasPermission('tareo.editar_adelanto');
  const canEditOtrosDesc     = isAdmin || hasPermission('tareo.editar_otros_desc');
  const canEditCobroVac      = isAdmin || hasPermission('tareo.editar_cobro_vac');
  const [unidad, setUnidad] = useState('');
  const [situacionFiltro, setSituacionFiltro] = useState('VIGENTE');
  const [apellidoInput, setApellidoInput] = useState('');
  const [apellidoBusqueda, setApellidoBusqueda] = useState('');
  const [tareoData, setTareoData] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cambios, setCambios] = useState({});
  const [extrasModificados, setExtrasModificados] = useState({}); // Para rastrear cambios en extras
  const [diasAcumulados, setDiasAcumulados] = useState({}); // {empleado_id-dia: 0.5}
  const [tipoSeleccionado, setTipoSeleccionado] = useState('TD');
  const [modalExtras, setModalExtras] = useState({ 
    show: false, 
    empleado: null, 
    empIdx: null,
    campo: null, 
    valor: 0,
    detalle: '',
    saving: false,
  });
  const [modalLT, setModalLT] = useState({ 
    show: false, 
    empleado: null, 
    dia: null 
  });
  const [modalDL, setModalDL] = useState({ 
    show: false, 
    empleado: null, 
    dia: null 
  });
  const [modalHorasExtra, setModalHorasExtra] = useState({
    show: false,
    empleado: null,
    empIdx: null,
    detalles: [], // [{fecha, hora_inicio, hora_fin, total_horas}]
    saving: false,
  });
  const [modalAdelantos, setModalAdelantos] = useState({
    show: false,
    empleado: null,
    empIdx: null,
    detalles: [],
    saving: false,
  });
  const [modalNuevoAdelanto, setModalNuevoAdelanto] = useState({
    show: false,
    empleado: null,
    empIdx: null,
    adelantos: [],         // lista de adelantos existentes del empleado
    loading: false,
    saving: false,
    editingAdelantoId: null, // id del adelanto que se está editando (null = crear nuevo)
    // campos del formulario nuevo adelanto
    monto_total: '',
    num_cuotas: 1,
    tasa: 0,
    fecha_adelanto: '',
    descripcion: '',
    mes_inicio_pago: '',
    anio_inicio_pago: '',
  });
  const [modalOtrosDescuentos, setModalOtrosDescuentos] = useState({
    show: false,
    empleado: null,
    empIdx: null,
    monto: '',
    descripcion: '',
    saving: false,
  });
  const [modalVacacionesCobro, setModalVacacionesCobro] = useState({
    show: false,
    empleado: null,
    empIdx: null,
    fecha_inicio: '',
    fecha_fin: '',
    detalle: '',
    periodos: [], // [{anio_periodo, selected}]
    saving: false,
  });
  const [modalCese, setModalCese] = useState({
    show: false,
    empleado: null,
    fechaCese: '',
    motivoCese: '',
    tabActiva: 'cese',
    tipoAmonestacion: '',
    motivoAmonestacion: '',
    fechaAmonestacion: '',
    saving: false,
  });
  const [amonestacionesEmpleado, setAmonestacionesEmpleado] = useState([]);
  const [loadingAmon, setLoadingAmon] = useState(false);

  const MODAL_CESE_INIT = { show: false, empleado: null, fechaCese: '', motivoCese: '', tabActiva: 'cese', tipoAmonestacion: '', motivoAmonestacion: '', fechaAmonestacion: '', saving: false };

  const cargarAmonestacionesEmpleado = async (empleadoId) => {
    setLoadingAmon(true);
    try {
      const data = await getAmonestacionesPorEmpleado(empleadoId);
      setAmonestacionesEmpleado(data);
    } catch { setAmonestacionesEmpleado([]); }
    finally { setLoadingAmon(false); }
  };

  const totalDias = useMemo(() => diasEnMes(anio, mes), [anio, mes]);
  const diasArray = useMemo(() => Array.from({ length: totalDias }, (_, i) => i + 1), [totalDias]);

  // Debounce para el filtro de apellido (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setApellidoBusqueda(apellidoInput);
      setPagination(p => ({ ...p, current_page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [apellidoInput]);

  // Actualizar unidad cuando el usuario cambie
  useEffect(() => {
    if (user?.unidad?.length === 1) {
      // Una sola unidad: auto-seleccionar
      setUnidad(user.unidad[0]);
    } else if (user?.unidad?.length > 1 && !unidad) {
      // Múltiples unidades: seleccionar la primera por defecto
      setUnidad(user.unidad[0]);
    }
  }, [user]);

  useEffect(() => {
    // Si el usuario tiene unidad(es) asignada(s) pero el estado aún no se ha sincronizado, esperar
    if (user?.unidad?.length > 0 && !unidad) {
      return;
    }
    cargarTareo();
  }, [anio, mes, unidad, situacionFiltro, apellidoBusqueda, pagination.current_page, pagination.per_page, user]);

  const cargarTareo = async (page = pagination.current_page) => {
    setLoading(true);
    setCambios({});
    setExtrasModificados({}); // Limpiar extras modificados al recargar
    try {
      const response = await getTareoMes(anio, mes, page, pagination.per_page, unidad || null, situacionFiltro || null, apellidoBusqueda || null);
      
      const empleados = response?.empleados || [];
      
      const empleadosTransformados = empleados.map(emp => ({
        empleado_id: emp.id,
        codigo: emp.codigo,
        apellidos: emp.nombre_completo.split(', ')[0] || emp.nombre_completo,
        nombres: emp.nombre_completo.split(', ')[1] || '',
        cargo: emp.cargo,
        area: emp.area,
        turno: emp.turno,
        sueldo_base: emp.sueldo_base,
        bono_regular: emp.bono_regular || 0,
        contrato_inicio: emp.contrato_inicio || null,
        contrato_fin: emp.contrato_fin || null,
        situacion_contractual: emp.situacion_contractual || 'VIGENTE',
        fecha_cese: emp.fecha_cese || null,
        motivo_cese: emp.motivo_cese || null,
        asistencias: emp.dias || {},
        totales: emp.totales || {},
        extras: emp.extras || { bono: 0, viaticos: 0, alimentacion: 0 }
      }));
      
      // Cargar días acumulados desde las asistencias
      const acumulados = {};
      empleados.forEach(emp => {
        const dias = emp.dias || {};
        Object.keys(dias).forEach(dia => {
          const asistencia = dias[dia];
          if (asistencia && asistencia.tipo === 'LT' && asistencia.lt_acumulado) {
            acumulados[`${emp.id}-${dia}`] = 0.5;
          }
        });
      });
      setDiasAcumulados(acumulados);
      
      setTareoData(empleadosTransformados);
      if (response?.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error cargando tareo:', error);
      toast.error('Error al cargar tareo: ' + (error.response?.data?.message || error.message));
      setTareoData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMesPrev = () => {
    if (mes === 1) { setMes(12); setAnio(anio - 1); }
    else setMes(mes - 1);
    // React batches these state updates, so only 1 re-render
    setPagination(p => ({ ...p, current_page: 1 }));
  };

  const handleMesNext = () => {
    if (mes === 12) { setMes(1); setAnio(anio + 1); }
    else setMes(mes + 1);
    setPagination(p => ({ ...p, current_page: 1 }));
  };

  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressStartTime, setLongPressStartTime] = useState(null);
  const [longPressCell, setLongPressCell] = useState(null);

  // Drag-to-fill: arrastrar mouse para marcar múltiples celdas
  const dragActiveRef = useRef(false);      // si el mouse está presionado
  const dragStartRef = useRef(null);        // { empIndex, dia } celda de inicio
  const isDraggingRef = useRef(false);      // si ya se movió a otra celda
  const [isDragging, setIsDragging] = useState(false); // para cursor visual

  // Verificar si una celda tiene asistencia ya guardada en BD
  const cellHasSavedData = (empIndex, dia) => {
    const emp = tareoData[empIndex];
    return emp?.asistencias?.[dia]?.tipo ? true : false;
  };

  // Helper compartido por click y drag para aplicar el tipo seleccionado a una celda
  const applyTipoCelda = (emp, dia) => {
    if (!emp) return;
    const key = `${emp.empleado_id}-${dia}`;
    if (tipoSeleccionado === 'BORRAR') {
      setCambios(prev => ({
        ...prev,
        [key]: {
          empleado_id: emp.empleado_id,
          fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
          tipo: '__BORRAR__',
        },
      }));
    } else {
      setCambios(prev => ({
        ...prev,
        [key]: {
          empleado_id: emp.empleado_id,
          fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
          tipo: tipoSeleccionado,
          bono: prev[key]?.bono || emp.asistencias?.[dia]?.bono || 0,
          viaticos: prev[key]?.viaticos || emp.asistencias?.[dia]?.viaticos || 0,
          alimentacion: prev[key]?.alimentacion || emp.asistencias?.[dia]?.alimentacion || 0,
        },
      }));
    }
  };

  // Terminar drag si el mouse se suelta fuera de la tabla
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragActiveRef.current) {
        dragActiveRef.current = false;
        isDraggingRef.current = false;
        setIsDragging(false);
        dragStartRef.current = null;
      }
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleCellMouseDown = (empIndex, dia) => {
    // Si no tiene permiso de edición y la celda ya tiene datos guardados, bloquear
    if (!canEditTareo && cellHasSavedData(empIndex, dia)) {
      return;
    }

    // Iniciar tracking de drag
    dragActiveRef.current = true;
    dragStartRef.current = { empIndex, dia };
    isDraggingRef.current = false;

    const startTime = Date.now();
    setLongPressStartTime(startTime);
    setLongPressCell({ empIndex, dia });
    
    const timer = setTimeout(() => {
      // Long press detectado (2 segundos)
      const emp = tareoData[empIndex];
      const key = `${emp.empleado_id}-${dia}`;
      const tipoActual = cambios[key]?.tipo || emp.asistencias?.[dia]?.tipo;
      
      // Si ya está marcado como LT o se está marcando como LT, abrir modal LT
      if (tipoActual === 'LT' || tipoSeleccionado === 'LT') {
        setModalLT({ show: true, empleado: emp, dia });
        setLongPressTimer(null);
        setLongPressStartTime(null);
        setLongPressCell(null);
        return;
      }
      
      // Si ya está marcado como DL o se está marcando como DL, abrir modal DL
      if (tipoActual === 'DL' || tipoSeleccionado === 'DL') {
        setModalDL({ show: true, empleado: emp, dia });
        setLongPressTimer(null);
        setLongPressStartTime(null);
        setLongPressCell(null);
        return;
      }
      
      setLongPressTimer(null);
      setLongPressStartTime(null);
      setLongPressCell(null);
    }, 2000); // 2 segundos
    
    setLongPressTimer(timer);
  };

  const handleCellMouseUp = (empIndex, dia) => {
    const wasDragging = isDraggingRef.current;

    // Terminar drag
    dragActiveRef.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
    dragStartRef.current = null;

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Si fue drag, no ejecutar lógica de click
    if (wasDragging) {
      setLongPressStartTime(null);
      setLongPressCell(null);
      return;
    }

    // Si se soltó antes de 2 segundos, hacer click normal
    if (longPressStartTime && (Date.now() - longPressStartTime) < 2000) {
      const emp = tareoData[empIndex];
      const key = `${emp.empleado_id}-${dia}`;
      const existing = cambios[key] || {};
      if (tipoSeleccionado === 'BORRAR') {
        // Marcar como pendiente de borrado
        setCambios({
          ...cambios,
          [key]: {
            empleado_id: emp.empleado_id,
            fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
            tipo: '__BORRAR__',
          },
        });
      } else {
        setCambios({
          ...cambios,
          [key]: {
            empleado_id: emp.empleado_id,
            fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
            tipo: tipoSeleccionado,
            bono: existing.bono || emp.asistencias?.[dia]?.bono || 0,
            viaticos: existing.viaticos || emp.asistencias?.[dia]?.viaticos || 0,
            alimentacion: existing.alimentacion || emp.asistencias?.[dia]?.alimentacion || 0,
          },
        });
      }
    }
    
    setLongPressStartTime(null);
    setLongPressCell(null);
  };

  const handleCellMouseLeave = () => {
    // Cancelar long press si el mouse sale de la celda
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    // No resetear si estamos en drag (el drag continua entre celdas)
    if (!dragActiveRef.current) {
      setLongPressStartTime(null);
      setLongPressCell(null);
    }
  };

  const handleCellMouseEnter = (empIndex, dia) => {
    if (!dragActiveRef.current) return;
    const start = dragStartRef.current;
    if (!start || (start.empIndex === empIndex && start.dia === dia)) return;

    // Es un drag — cancelar long press
    if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }

    // Primera celda diferente: confirmar drag y aplicar también a la celda inicial
    if (!isDraggingRef.current) {
      isDraggingRef.current = true;
      setIsDragging(true);
      const startEmp = tareoData[start.empIndex];
      if (startEmp && (canEditTareo || !cellHasSavedData(start.empIndex, start.dia))) {
        applyTipoCelda(startEmp, start.dia);
      }
    }

    // Aplicar a la celda actual
    if (!canEditTareo && cellHasSavedData(empIndex, dia)) return;
    const emp = tareoData[empIndex];
    if (emp) applyTipoCelda(emp, dia);
  };

  const DETALLE_CAMPO = { bono: 'detalle_bono', viaticos: 'detalle_movilidad', alimentacion: 'detalle_alimentacion' };

  const handleExtraClick = (empIdx, campo) => {
    const emp = tareoData[empIdx];
    const totalesExtras = calcularTotalesExtras(emp);

    // Verificar permiso de columna
    const permisoColumna = { bono: canEditBono, viaticos: canEditViaticos, alimentacion: canEditAlimentacion };
    if (!permisoColumna[campo]) {
      toast.warning('🔒 No tienes permiso para acceder a esta opción');
      return;
    }
    
    const detalleCampo = DETALLE_CAMPO[campo];
    setModalExtras({
      show: true,
      empleado: emp,
      empIdx: empIdx,
      campo: campo,
      valor: totalesExtras[campo],
      detalle: emp.extras?.[detalleCampo] || '',
    });
  };

  const handleGuardarExtra = async () => {
    const { empIdx, campo, valor, detalle } = modalExtras;
    const emp = tareoData[empIdx];
    
    const monto = parseFloat(valor);
    if (isNaN(monto) || monto < 0) {
      toast.error('Ingrese un monto válido');
      return;
    }

    const detalleCampo = DETALLE_CAMPO[campo]; // undefined para hora_extra_total

    setModalExtras(prev => ({ ...prev, saving: true }));

    try {
      await guardarExtras({
        empleado_id: emp.empleado_id,
        mes,
        anio,
        [campo]: monto,
        ...(detalleCampo ? { [detalleCampo]: detalle || null } : {}),
      });

      // Actualizar estado local
      const updatedTareo = [...tareoData];
      updatedTareo[empIdx] = {
        ...emp,
        extras: {
          ...emp.extras,
          [campo]: monto,
          ...(detalleCampo ? { [detalleCampo]: detalle || null } : {}),
        }
      };
      setTareoData(updatedTareo);

      // Limpiar de extrasModificados si existía
      setExtrasModificados(prev => {
        const nuevo = { ...prev };
        if (nuevo[emp.empleado_id]) {
          delete nuevo[emp.empleado_id][campo];
          if (detalleCampo) delete nuevo[emp.empleado_id][detalleCampo];
        }
        return nuevo;
      });

      toast.success(`✓ Horas extra guardadas`);
      setModalExtras({ show: false, empleado: null, empIdx: null, campo: null, valor: 0, detalle: '', saving: false });
    } catch (error) {
      toast.error('Error al guardar: ' + (error.response?.data?.message || error.message));
      setModalExtras(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCellRightClick = (e, empIndex, dia) => {
    e.preventDefault();
    // Si no tiene permiso de edición y la celda ya tiene datos guardados, bloquear
    if (!canEditTareo && cellHasSavedData(empIndex, dia)) {
      return;
    }
    const emp = tareoData[empIndex];
    const key = `${emp.empleado_id}-${dia}`;
    const nuevosCambios = { ...cambios };
    delete nuevosCambios[key];
    setCambios(nuevosCambios);
  };

  const getCellStyle = (empIndex, dia) => {
    const emp = tareoData[empIndex];
    if (!emp) return {};
    const key = `${emp.empleado_id}-${dia}`;
    const tipo = cambios[key]?.tipo || emp.asistencias?.[dia]?.tipo || null;
    if (!tipo) return {};
    if (tipo === '__BORRAR__') return {
      backgroundColor: '#fca5a5',
      color: '#991b1b',
      fontWeight: 600,
      fontSize: '0.65rem',
      cursor: 'pointer',
      textDecoration: 'line-through',
    };
    const config = TIPOS_REGISTRO[tipo];
    return {
      backgroundColor: config?.color || '#e2e8f0',
      color: '#fff',
      fontWeight: 600,
      fontSize: '0.65rem',
      cursor: 'pointer',
    };
  };

  const getCellLabel = (empIndex, dia) => {
    const emp = tareoData[empIndex];
    if (!emp) return '';
    const key = `${emp.empleado_id}-${dia}`;
    const tipo = cambios[key]?.tipo || emp.asistencias?.[dia]?.tipo || null;
    if (!tipo) return '';
    if (tipo === '__BORRAR__') return '✕';
    const config = TIPOS_REGISTRO[tipo];
    const label = config?.short || (typeof tipo === 'string' ? tipo.substring(0, 2) : '');
    
    // Si es LT y tiene acumulación, mostrar 0.5 debajo
    if (tipo === 'LT' && diasAcumulados[key]) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1' }}>
          <span>{label}</span>
          <span style={{ fontSize: '0.5rem', marginTop: '2px' }}>0.5</span>
        </div>
      );
    }
    
    return label;
  };

  const handleGuardar = async () => {
    // Solo procesar empleados de la página actual
    const empleadosVisiblesIds = tareoData.map(emp => emp.empleado_id);
    
    // Procesar registros de asistencia solo de página actual
    const todosLosCambios = Object.values(cambios)
      .filter(cambio => cambio.fecha && empleadosVisiblesIds.includes(cambio.empleado_id));

    const registros = todosLosCambios
      .filter(cambio => cambio.tipo !== '__BORRAR__')
      .map(cambio => {
        const [, , dia] = cambio.fecha.split('-');
        return { empleado_id: cambio.empleado_id, dia: parseInt(dia, 10), tipo_registro: cambio.tipo };
      });

    const borrados = todosLosCambios
      .filter(cambio => cambio.tipo === '__BORRAR__')
      .map(cambio => {
        const [, , dia] = cambio.fecha.split('-');
        return { empleado_id: cambio.empleado_id, dia: parseInt(dia, 10) };
      });
    
    // Recopilar extras solo de empleados visibles que fueron modificados
    const extrasAGuardar = Object.keys(extrasModificados)
      .filter(empId => empleadosVisiblesIds.includes(parseInt(empId)))
      .map(empId => {
        const emp = tareoData.find(e => e.empleado_id === parseInt(empId));
        return {
          empleado_id: parseInt(empId),
          bono: parseFloat(emp.extras.bono) || 0,
          detalle_bono: emp.extras.detalle_bono || null,
          viaticos: parseFloat(emp.extras.viaticos) || 0,
          detalle_movilidad: emp.extras.detalle_movilidad || null,
          alimentacion: parseFloat(emp.extras.alimentacion) || 0,
          detalle_alimentacion: emp.extras.detalle_alimentacion || null,
          hora_extra_inicio: emp.extras.hora_extra_inicio || null,
          hora_extra_fin: emp.extras.hora_extra_fin || null,
          hora_extra_total: parseFloat(emp.extras.hora_extra_total) || 0,
        };
      });
    
    if (registros.length === 0 && borrados.length === 0 && extrasAGuardar.length === 0) {
      toast.info('No hay cambios por guardar en esta página');
      return;
    }

    setSaving(true);
    try {
      let totalGuardados = 0;

      // Eliminar celdas borradas
      if (borrados.length > 0) {
        await eliminarMasivo({ mes, anio, registros: borrados });
        toast.success(`✓ ${borrados.length} celda(s) limpiadas`);
        totalGuardados += borrados.length;
      }

      // Guardar asistencias en paralelo para máxima velocidad
      if (registros.length > 0) {
        // Si hay muchos registros, dividir en chunks de 100
        const chunkSize = 100;
        const chunks = [];
        for (let i = 0; i < registros.length; i += chunkSize) {
          chunks.push(registros.slice(i, i + chunkSize));
        }
        
        // Procesar chunks en paralelo
        await Promise.all(chunks.map(chunk => 
          registrarMasivo({ mes, anio, registros: chunk })
        ));
        
        totalGuardados += registros.length;
        toast.success(`✓ ${registros.length} asistencia(s) guardadas`);
      }
      
      // Guardar extras en paralelo (son pocos, no necesitan chunks)
      if (extrasAGuardar.length > 0) {
        await Promise.all(extrasAGuardar.map(extra =>
          guardarExtras({
            empleado_id: extra.empleado_id,
            mes: mes,
            anio: anio,
            bono: extra.bono,
            detalle_bono: extra.detalle_bono,
            viaticos: extra.viaticos,
            detalle_movilidad: extra.detalle_movilidad,
            alimentacion: extra.alimentacion,
            detalle_alimentacion: extra.detalle_alimentacion,
            hora_extra_inicio: extra.hora_extra_total > 0 ? (extra.hora_extra_inicio || null) : null,
            hora_extra_fin: extra.hora_extra_total > 0 ? (extra.hora_extra_fin || null) : null,
            hora_extra_total: extra.hora_extra_total,
          })
        ));
        totalGuardados += extrasAGuardar.length;
        toast.success(`✓ ${extrasAGuardar.length} extra(s) guardado(s)`);
      }
      
      // Limpiar solo cambios guardados (registros normales + borrados)
      const nuevosCambios = { ...cambios };
      registros.forEach(r => {
        const key = `${r.empleado_id}-${r.dia}`;
        delete nuevosCambios[key];
      });
      borrados.forEach(r => {
        const key = `${r.empleado_id}-${r.dia}`;
        delete nuevosCambios[key];
      });
      setCambios(nuevosCambios);
      
      // Limpiar extras modificados guardados
      const nuevosExtrasModificados = { ...extrasModificados };
      extrasAGuardar.forEach(extra => {
        delete nuevosExtrasModificados[extra.empleado_id];
      });
      setExtrasModificados(nuevosExtrasModificados);
      
      // Recargar solo página actual
      await cargarTareo(pagination.current_page);
      
      if (totalGuardados > 0) {
        toast.success(`🎉 Guardado completo: ${totalGuardados} registro(s)`);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('❌ Error al guardar: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const getResumenEmpleado = (emp) => {
    if (!emp) return {};
    
    // Si vienen los totales guardados de la BD, usarlos
    if (emp.totales_resumen) {
      return emp.totales_resumen;
    }
    
    // Si no, calcular desde los días (para cambios pendientes)
    const totals = {};
    for (let d = 1; d <= totalDias; d++) {
      const key = `${emp.empleado_id}-${d}`;
      const cambio = cambios[key];
      // Si está marcado para borrar, tratar como celda vacía
      if (cambio?.tipo === '__BORRAR__') continue;
      const tipo = cambio?.tipo || emp.asistencias?.[d]?.tipo || null;
      if (tipo) totals[tipo] = (totals[tipo] || 0) + 1;
    }
    return totals;
  };

  const calcularTotales = (resumen, emp) => {
    // Si vienen los totales calculados de la BD, usarlos
    if (emp?.totales_calculados) {
      return emp.totales_calculados;
    }
    
    // Si no, calcular en el frontend con las nuevas fórmulas (V y R excluidos del conteo)
    // DIAS = conteo bruto | TOTAL = valor ponderado (0.5 vale medio día)
    const pCount = resumen['P'] || 0;
    const pEsExcluido = pCount > 3;
    const dias = ORDEN_COLUMNAS_TAREO.filter(k => k !== 'V' && k !== 'R' && k !== 'LSG' && !(pEsExcluido && k === 'P')).reduce((sum, key) => sum + (resumen[key] || 0), 0);
    const dExtra = (resumen['LT'] || 0) * 1.5 + (resumen['TF'] || 0) * 2;
    const dReducidos = (resumen['F'] || 0) * 1.5 + (resumen['SU'] || 0) * 1.5;
    // R, LSG y P>3 se excluyen del check de completitud (como BORRAR)
    const celdasRellenasTot = Object.entries(resumen).filter(([k]) => k !== 'R' && k !== 'LSG' && !(pEsExcluido && k === 'P')).reduce((s, [, v]) => s + v, 0);
    const hayRedondeo = (totalDias !== 30 && celdasRellenasTot >= totalDias);
    const redondeo = hayRedondeo ? 30 : null;
    const baseCalculo = hayRedondeo ? 30 : dias;
    const vacaciones = hayRedondeo ? (resumen['V'] || 0) : 0;
    const diasNoTrab = pEsExcluido ? 0 : pCount; // P≤3 → resta del TOTAL; P>3 → ya excluido de DIAS
    const total = baseCalculo - (resumen['0.5'] || 0) * 0.5 + dExtra - dReducidos - diasNoTrab - vacaciones;

    return { dias, d_extra: dExtra, d_reducidos: dReducidos, total };
  };

  // Redondeo: si el mes NO tiene 30 días y TODOS los días rellenados → 30
  // Si falta algún día sin llenar → copiar el mismo valor de DIAS
  // Si el mes ya tiene 30 días → null (no aplica)
  const calcularRedondeo = (resumen, diasBase) => {
    if (totalDias === 30) return null; // mes de 30 días: no aplica redondeo
    // R, LSG y P>3 se excluyen del check (tratados como celdas vacías, igual que BORRAR)
    const pExcluidoRed = (resumen['P'] || 0) > 3;
    const celdasRellenas = Object.entries(resumen).filter(([k]) => k !== 'R' && k !== 'LSG' && !(pExcluidoRed && k === 'P')).reduce((s, [, v]) => s + v, 0);
    if (celdasRellenas >= totalDias) return 30; // todas rellenas → redondear a 30
    return diasBase; // no todas rellenas → copiar valor de DIAS
  };

  const calcularTotalesExtras = (emp) => {
    // Los extras vienen directamente del backend
    // Asegurarse de que siempre sean números
    return {
      bono: parseFloat(emp.extras?.bono || 0),
      viaticos: parseFloat(emp.extras?.viaticos || 0),
      alimentacion: parseFloat(emp.extras?.alimentacion || 0),
    };
  };

  // Contar solo cambios de empleados en la página actual
  const empleadosVisiblesIds = tareoData.map(emp => emp.empleado_id);
  const cambiosAsistencias = Object.values(cambios).filter(c => 
    empleadosVisiblesIds.includes(c.empleado_id)
  ).length;
  const cambiosExtras = Object.keys(extrasModificados).filter(empId => 
    empleadosVisiblesIds.includes(parseInt(empId))
  ).length;
  const pendientesCount = cambiosAsistencias + cambiosExtras;

  // Función para cambiar página con advertencia si hay cambios
  const handleCambiarPagina = (nuevaPagina) => {
    if (pendientesCount > 0) {
      if (!confirm('Tienes cambios sin guardar en esta página. ¿Deseas continuar sin guardar?')) {
        return;
      }
    }
    setPagination(p => ({ ...p, current_page: nuevaPagina }));
  };

  // Función para exportar a Excel con colores usando tabla HTML
  const exportarExcel = async () => {
    try {
      toast.info('Generando reporte Excel...');
      
      // Obtener TODOS los datos del tareo sin paginación
      const response = await getTareoMes(anio, mes, 1, 9999, unidad, situacionFiltro || null, apellidoBusqueda || null);
      const empleadosRaw = response?.empleados || [];
      
      if (empleadosRaw.length === 0) {
        toast.warning('No hay datos para exportar');
        return;
      }

      // Transformar datos igual que cargarTareo
      const todosEmpleados = empleadosRaw.map(emp => ({
        empleado_id: emp.id,
        codigo: emp.codigo,
        apellidos: emp.nombre_completo.split(', ')[0] || emp.nombre_completo,
        nombres: emp.nombre_completo.split(', ')[1] || '',
        dni: emp.dni || '',
        unidad: emp.unidad || '',
        cargo: emp.cargo || '',
        area: emp.area,
        turno: emp.turno,
        sueldo_base: emp.sueldo_base,
        bono_regular: emp.bono_regular || 0,
        contrato_inicio: emp.contrato_inicio || '',
        contrato_fin: emp.contrato_fin || '',
        situacion_contractual: emp.situacion_contractual || 'VIGENTE',
        fecha_cese: emp.fecha_cese || '',
        asistencias: emp.dias || {},
        totales: emp.totales || {},
        extras: emp.extras || { bono: 0, viaticos: 0, alimentacion: 0 }
      }));

      const diasSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
      
      // Construir tabla HTML con estilos inline (Excel los interpreta)
      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Tareo ${MESES[mes - 1]} ${anio}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  td, th { mso-number-format:"\\@"; text-align: center; vertical-align: middle; font-size: 9pt; font-family: Calibri; border: 1px solid #d1d5db; padding: 2px; }
  .emp { text-align: left; font-size: 8pt; white-space: nowrap; }
  .num { mso-number-format:"0\\.0"; }
  .money { mso-number-format:"\\#\\,\\#\\#0\\.00"; }
</style>
</head><body><table border="1">`;

      // FILA 1: Encabezados
      html += '<tr>';
      html += '<th style="background:#334155;color:#fff;font-weight:bold;font-size:10pt;width:90px;">CÓDIGO</th>';
      html += '<th style="background:#334155;color:#fff;font-weight:bold;font-size:10pt;width:220px;">EMPLEADO</th>';
      html += '<th style="background:#475569;color:#fff;font-weight:bold;width:90px;">DNI</th>';
      html += '<th style="background:#475569;color:#fff;font-weight:bold;width:120px;">UNIDAD</th>';
      html += '<th style="background:#475569;color:#fff;font-weight:bold;width:150px;">CARGO</th>';
      html += '<th style="background:#1d4ed8;color:#fff;font-weight:bold;width:90px;">SUELDO</th>';
      html += '<th style="background:#0891b2;color:#fff;font-weight:bold;width:90px;">BONO REGULAR</th>';
      html += '<th style="background:#059669;color:#fff;font-weight:bold;width:90px;">F. INGRESO</th>';
      html += '<th style="background:#d97706;color:#fff;font-weight:bold;width:90px;">F. FIN CONTRATO</th>';
      html += '<th style="background:#dc2626;color:#fff;font-weight:bold;width:90px;">F. CESE</th>';
      diasArray.forEach(d => {
        const fecha = new Date(anio, mes - 1, d);
        const ds = fecha.getDay();
        let bg = '#d4e6f1'; let color = '#000';
        if (ds === 0) { bg = '#f8bbd0'; }
        else if (ds === 6) { bg = '#fff9c4'; }
        html += `<th style="background:${bg};color:${color};font-weight:bold;width:28px;">${d}<br/>${diasSemana[ds]}</th>`;
      });
      // 3 sub-columnas de extras
      html += '<th style="background:#f59e0b;color:#fff;font-weight:bold;">BONO</th>';
      html += '<th style="background:#8b5cf6;color:#fff;font-weight:bold;">VIÁTICOS</th>';
      html += '<th style="background:#06b6d4;color:#fff;font-weight:bold;">ALIMENT.</th>';
      html += '<th style="background:#8b5cf6;color:#fff;font-weight:bold;">H. EXTRA</th>';
      // Columnas de resumen por tipo
      ORDEN_COLUMNAS_TAREO.forEach(k => {
        html += `<th style="background:${TIPOS_REGISTRO[k].color};color:#fff;font-weight:bold;">${TIPOS_REGISTRO[k].short}</th>`;
      });
      // Columnas de totales
      html += '<th style="background:#6366f1;color:#fff;font-weight:bold;">DIAS</th>';
      html += '<th style="background:#7c3aed;color:#fff;font-weight:bold;">REDONDEO</th>';
      html += '<th style="background:#f59e0b;color:#fff;font-weight:bold;">D.EXTRA</th>';
      html += '<th style="background:#f97316;color:#fff;font-weight:bold;">DIAS NO TRAB.</th>';
      html += '<th style="background:#ef4444;color:#fff;font-weight:bold;">D.REDUCIDOS</th>';
      html += '<th style="background:#1e293b;color:#fff;font-weight:bold;">TOTAL</th>';
      html += '</tr>';

      // FILAS DE DATOS
      todosEmpleados.forEach((emp) => {
        const resumen = {};
        for (let d = 1; d <= totalDias; d++) {
          const tipo = emp.asistencias?.[d]?.tipo || null;
          if (tipo) resumen[tipo] = (resumen[tipo] || 0) + 1;
        }
        const bono = parseFloat(emp.extras?.bono || 0);
        const viaticos = parseFloat(emp.extras?.viaticos || 0);
        const alimentacion = parseFloat(emp.extras?.alimentacion || 0);
        
        // DIAS = conteo bruto (V, R, LSG excluidos; P excluido si >3) | TOTAL = valor ponderado
        const pCountXls = resumen['P'] || 0;
        const pExXls = pCountXls > 3;
        const dias = ORDEN_COLUMNAS_TAREO.filter(k => k !== 'V' && k !== 'R' && k !== 'LSG' && !(pExXls && k === 'P')).reduce((sum, key) => sum + (resumen[key] || 0), 0);
        const dExtra = (resumen['LT'] || 0) * 1.5 + (resumen['TF'] || 0) * 2;
        const dNoTrab = pExXls ? 0 : pCountXls; // P≤3 → resta del TOTAL; P>3 → ya excluido de DIAS
        const dReducidos = (resumen['F'] || 0) * 1.5 + (resumen['SU'] || 0) * 1.5;
        // Redondeo: R, LSG y P>3 se excluyen del check de completitud
        const celdasRellenas = Object.entries(resumen).filter(([k]) => k !== 'R' && k !== 'LSG' && !(pExXls && k === 'P')).reduce((s, [, v]) => s + v, 0);
        const redondeoExcel = totalDias !== 30 ? (celdasRellenas >= totalDias ? 30 : dias) : null;
        const esRedondeadoExcel = redondeoExcel === 30;
        // TOTAL = (Redondeo ?? Dias) - (0.5×n_medios) + D.Extra - D.Reducidos - Dias No Trab - Vacaciones (solo si hay redondeo).
        const total = (redondeoExcel ?? dias) - (resumen['0.5'] || 0) * 0.5 + dExtra - dReducidos - dNoTrab
                      - (redondeoExcel === 30 ? (resumen['V'] || 0) : 0);

        html += '<tr>';
        html += `<td class="emp" style="background:${emp.situacion_contractual === 'CESADO' ? '#fee2e2' : '#f8fafc'};font-weight:bold;color:#1d4ed8;">${emp.codigo}</td>`;
        html += `<td class="emp" style="background:${emp.situacion_contractual === 'CESADO' ? '#fee2e2' : '#f8fafc'};font-weight:bold;${emp.situacion_contractual === 'CESADO' ? 'color:#dc2626;' : ''}">${emp.apellidos}, ${emp.nombres}${emp.situacion_contractual === 'CESADO' ? ' (CESADO)' : ''}</td>`;
        html += `<td class="emp" style="background:#f8fafc;">${emp.dni}</td>`;
        html += `<td class="emp" style="background:#f8fafc;">${emp.unidad}</td>`;
        html += `<td class="emp" style="background:#f8fafc;">${emp.cargo}</td>`;
        html += `<td class="money" style="background:#dbeafe;font-weight:bold;">${parseFloat(emp.sueldo_base || 0).toFixed(2)}</td>`;
        html += `<td class="money" style="background:#ecfeff;">${parseFloat(emp.bono_regular || 0).toFixed(2)}</td>`;
        html += `<td style="background:#f0fdf4;">${emp.contrato_inicio || '-'}</td>`;
        html += `<td style="background:#fffbeb;">${emp.contrato_fin || '-'}</td>`;
        html += `<td style="background:${emp.situacion_contractual === 'CESADO' ? '#fee2e2;color:#dc2626;font-weight:bold' : '#fafafa'};">${emp.fecha_cese || '-'}</td>`;
        
        // Celdas de días con colores
        diasArray.forEach(dia => {
          const tipo = emp.asistencias?.[dia]?.tipo || null;
          if (tipo && TIPOS_REGISTRO[tipo]) {
            html += `<td style="background:${TIPOS_REGISTRO[tipo].color};color:#fff;font-weight:bold;">${TIPOS_REGISTRO[tipo].short}</td>`;
          } else {
            html += '<td></td>';
          }
        });
        
        // Extras: Bono, Viáticos, Alimentación
        html += `<td class="money" style="background:#fffbeb;">${bono.toFixed(2)}</td>`;
        html += `<td class="money" style="background:#f5f3ff;">${viaticos.toFixed(2)}</td>`;
        html += `<td class="money" style="background:#ecfeff;">${alimentacion.toFixed(2)}</td>`;
        html += `<td class="num" style="background:#f3e8ff;">${parseFloat(emp.extras?.hora_extra_total || 0).toFixed(2)}</td>`;
        
        // Columnas de resumen por tipo
        ORDEN_COLUMNAS_TAREO.forEach(key => {
          const val = resumen[key] || 0;
          html += `<td style="background:#f1f5f9;">${val}</td>`;
        });
        
        // Totales
        html += `<td class="num" style="background:#e0e7ff;font-weight:bold;">${dias}</td>`;
        html += `<td class="num" style="background:${esRedondeadoExcel ? '#ede9fe' : redondeoExcel !== null ? '#e0e7ff' : '#f3f4f6'};font-weight:bold;color:${esRedondeadoExcel ? '#6d28d9' : redondeoExcel !== null ? '#4338ca' : '#9ca3af'};">${redondeoExcel !== null ? redondeoExcel : '—'}</td>`;
        html += `<td class="num" style="background:#fef3c7;font-weight:bold;">${dExtra.toFixed(1)}</td>`;
        html += `<td class="num" style="background:#ffedd5;font-weight:bold;">${dNoTrab.toFixed(1)}</td>`;
        html += `<td class="num" style="background:#fee2e2;font-weight:bold;">${dReducidos.toFixed(1)}</td>`;
        html += `<td class="num" style="background:#e2e8f0;font-weight:bold;">${total.toFixed(1)}</td>`;
        html += '</tr>';
      });

      html += '</table></body></html>';

      // Descargar como .xls (Excel lo abre con colores)
      const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const nombreArchivo = `Tareo_${MESES[mes - 1]}_${anio}${unidad ? `_${unidad}` : ''}.xls`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Reporte Excel generado correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el reporte: ' + error.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Tareo Mensual</h2>
        <div className="page-actions">
          {pendientesCount > 0 && (
            <span className="badge badge-warning">{pendientesCount} cambio(s) en esta página</span>
          )}
          <button className="btn-secondary" onClick={exportarExcel} disabled={loading}>
            <FiDownload size={16} /> Exportar Excel
          </button>
          {canEditTareo && (
          <button className="btn-primary" onClick={handleGuardar} disabled={saving || pendientesCount === 0}>
            <FiSave size={16} /> {saving ? 'Guardando...' : 'Guardar Página'}
          </button>
          )}
        </div>
      </div>

      <div className="card tareo-controls">
        <div className="tareo-nav">
          <button className="btn-icon" onClick={handleMesPrev}><FiChevronLeft size={20} /></button>
          <h3>{MESES[mes - 1]} {anio}</h3>
          <button className="btn-icon" onClick={handleMesNext}><FiChevronRight size={20} /></button>
        </div>
        <div className="tareo-filters">
          {user?.unidad?.length === 1 && (
            <div style={{ padding: '10px 16px', backgroundColor: '#dbeafe', border: '2px solid #3b82f6', borderRadius: '8px', fontWeight: 700, color: '#1e40af', fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2em' }}>📍</span> {user.unidad[0]}
            </div>
          )}
          {user?.unidad?.length > 1 && (
            <select className="form-select" value={unidad} onChange={(e) => { setUnidad(e.target.value); setPagination(p => ({ ...p, current_page: 1 })); }}>
              {user.unidad.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
          {!user?.unidad?.length && (
            <select className="form-select" value={unidad} onChange={(e) => { setUnidad(e.target.value); setPagination(p => ({ ...p, current_page: 1 })); }}>
              <option value="">UNIDAD</option>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
          <select className="form-select" value={pagination.per_page} onChange={(e) => setPagination(p => ({ ...p, per_page: parseInt(e.target.value), current_page: 1 }))}>
            <option value="10">10 por página</option>
            <option value="15">15 por página</option>
            <option value="20">20 por página</option>
            <option value="30">30 por página</option>
          </select>
          <select
            className="form-select"
            value={situacionFiltro}
            onChange={(e) => setSituacionFiltro(e.target.value)}
          >
            <option value="">Todas las situaciones</option>
            <option value="VIGENTE">VIGENTE</option>
            <option value="NUEVO">NUEVO</option>
            <option value="CESADO">CESADO</option>
            <option value="SUSPENDIDO">SUSPENDIDO</option>
          </select>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FiSearch style={{ position: 'absolute', left: 10, color: '#9ca3af', pointerEvents: 'none', zIndex: 1 }} size={15} />
            <input
              type="text"
              className="form-select"
              placeholder="Buscar por apellido..."
              value={apellidoInput}
              onChange={(e) => setApellidoInput(e.target.value)}
              style={{ paddingLeft: 32, paddingRight: apellidoInput ? 32 : 12, minWidth: 200 }}
            />
            {apellidoInput && (
              <button
                onClick={() => setApellidoInput('')}
                style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 0 }}
                title="Limpiar búsqueda"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Paginación superior */}
      {pagination.last_page > 1 && (
        <div className="pagination-info">
          <span>Mostrando {pagination.from} - {pagination.to} de {pagination.total} empleados</span>
          <div className="pagination-buttons">
            <button 
              className="btn-icon" 
              onClick={() => handleCambiarPagina(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
            >
              <FiChevronLeft size={16} />
            </button>
            <span>Página {pagination.current_page} de {pagination.last_page}</span>
            <button 
              className="btn-icon" 
              onClick={() => handleCambiarPagina(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="card tareo-legend">
        <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
          Selecciona el tipo de registro a aplicar:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Object.entries(TIPOS_REGISTRO).filter(([key]) => key !== 'ACU').map(([key, val]) => (
            <div 
              key={key} 
              className={`legend-item ${tipoSeleccionado === key ? 'legend-item-selected' : ''}`}
              onClick={() => setTipoSeleccionado(key)}
              style={{ 
                cursor: 'pointer', 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: tipoSeleccionado === key ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span className="legend-color" style={{ backgroundColor: val.color }}></span>
              <span className="legend-label">{val.short} - {val.label}</span>
            </div>
          ))}
          {/* Botón especial BORRAR */}
          <div
            className={`legend-item ${tipoSeleccionado === 'BORRAR' ? 'legend-item-selected' : ''}`}
            onClick={() => setTipoSeleccionado('BORRAR')}
            style={{
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '6px',
              border: tipoSeleccionado === 'BORRAR' ? '2px solid #ef4444' : '2px solid transparent',
              backgroundColor: tipoSeleccionado === 'BORRAR' ? '#fee2e2' : '',
              transition: 'all 0.2s',
            }}
          >
            <span className="legend-color" style={{ backgroundColor: '#6b7280', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✕</span>
            <span className="legend-label" style={{ color: '#dc2626', fontWeight: 600 }}>BORRAR - Limpiar celda</span>
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          💡 Click rápido: aplicar tipo seleccionado | Mantener presionado 2 seg: opciones LT/DL | Click derecho: limpiar celda
        </div>
      </div>

      {loading ? <Loading /> : (
        <div className="card tareo-table-wrapper">
          <div className="tareo-scroll">
            <table className="tareo-table">
              <thead>
                <tr>
                  <th className="tareo-th-emp sticky-col">Empleado</th>
                  {diasArray.map(d => {
                    const date = new Date(anio, mes - 1, d);
                    const isDom = date.getDay() === 0;
                    return (
                      <th key={d} className={`tareo-th-dia ${isDom ? 'domingo' : ''}`}>
                        <span className="dia-num">{d}</span>
                        <span className="dia-name">{['D', 'L', 'M', 'X', 'J', 'V', 'S'][date.getDay()]}</span>
                      </th>
                    );
                  })}
                  <th className="tareo-th-extra" style={{ backgroundColor: '#f59e0b', color: '#fff', minWidth: 90 }} title="Con. de Trabajo">
                    Con. de Trabajo
                  </th>
                  <th className="tareo-th-resumen" style={{ backgroundColor: '#8b5cf6', color: '#fff', minWidth: 90 }} title="Horas Extra">
                    H. Extra
                  </th>
                  <th className="tareo-th-resumen" style={{ backgroundColor: '#ef4444', color: '#fff', minWidth: 90 }} title="Adelanto de Sueldo">
                    Adelanto
                  </th>
                  <th className="tareo-th-resumen" style={{ backgroundColor: '#7c3aed', color: '#fff', minWidth: 110 }} title="Otros Descuentos">
                    Otros Desc.
                  </th>
                  <th className="tareo-th-resumen" style={{ backgroundColor: '#0891b2', color: '#fff', minWidth: 100 }} title="Cobro de Vacaciones">
                    Cobro Vac.
                  </th>
                  {ORDEN_COLUMNAS_TAREO.map((key) => (
                    <th 
                      key={key}
                      className="tareo-th-resumen" 
                      title={TIPOS_REGISTRO[key].label}
                      style={{ backgroundColor: TIPOS_REGISTRO[key].color, color: '#fff' }}
                    >
                      {TIPOS_REGISTRO[key].short}
                    </th>
                  ))}
                  <th className="tareo-th-resumen tareo-th-total" style={{ backgroundColor: '#6366f1', color: '#fff', fontWeight: 'bold' }} title="Total de Días Registrados">
                    DIAS
                  </th>
                  <th className="tareo-th-resumen tareo-th-total" style={{ backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold' }} title="Redondeo a 30 días cuando el mes ≠ 30 y está completo">
                    REDONDEO
                  </th>
                  <th className="tareo-th-resumen tareo-th-total" style={{ backgroundColor: '#f59e0b', color: '#fff', fontWeight: 'bold' }} title="Días Extra: (LT*1.5) + (TF*2)">
                    D.EXTRA
                  </th>
                  <th className="tareo-th-resumen tareo-th-total" style={{ backgroundColor: '#f97316', color: '#fff', fontWeight: 'bold' }} title="Días No Trabajados: P + R">
                    DIAS NO TRAB.
                  </th>
                  <th className="tareo-th-resumen tareo-th-total" style={{ backgroundColor: '#ef4444', color: '#fff', fontWeight: 'bold' }} title="Días Reducidos: (F*1.5) + (SU*1.5)">
                    D.REDUCIDOS
                  </th>
                  <th className="tareo-th-resumen tareo-th-total" style={{ backgroundColor: c.tableHeaderBg, color: '#fff', fontWeight: 'bold' }} title="Total General">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {tareoData && tareoData.length > 0 ? tareoData.map((emp, empIdx) => {
                  const resumen = getResumenEmpleado(emp);
                  const totales = calcularTotales(resumen, emp);
                  return (
                    <tr key={emp.empleado_id}>
                      {(() => {
                        const esCesado = emp.situacion_contractual === 'CESADO';
                        const tieneCeseEsteMes = esCesado && emp.fecha_cese && (() => {
                          const fc = new Date(emp.fecha_cese + 'T00:00:00');
                          return fc.getFullYear() === anio && (fc.getMonth() + 1) === mes;
                        })();
                        return (
                          <td 
                            className="tareo-td-emp sticky-col"
                            style={{ 
                              backgroundColor: esCesado ? '#fee2e2' : (emp.extras?.dias_acumulados || 0) > 0 ? '#ffd700' : undefined,
                              borderLeft: esCesado ? '4px solid #dc2626' : undefined,
                              transition: 'background-color 0.3s',
                              cursor: 'pointer',
                            }}
                            title={`${emp.cargo || 'Sin cargo'} - Sueldo: S/ ${emp.sueldo_base || '0.00'}${esCesado ? `\n⚠️ CESADO: ${emp.fecha_cese || 'S/F'}${emp.motivo_cese ? ' - ' + emp.motivo_cese : ''}` : ''}${(emp.extras?.dias_acumulados || 0) > 0 ? `\nDías acumulados: ${Number(emp.extras?.dias_acumulados || 0).toFixed(1)}` : ''}`}
                            onDoubleClick={() => {
                              if (!canRegistrarCese) return;
                              setModalCese({
                                show: true,
                                empleado: emp,
                                fechaCese: emp.fecha_cese || '',
                                motivoCese: emp.motivo_cese || '',
                                tabActiva: 'cese',
                                tipoAmonestacion: '',
                                motivoAmonestacion: '',
                                fechaAmonestacion: '',
                                saving: false,
                              });
                              setAmonestacionesEmpleado([]);
                            }}
                          >
                            <span className="emp-code">{emp.codigo}</span>
                            <span className="emp-name" style={{ color: esCesado ? '#dc2626' : undefined, fontWeight: esCesado ? '700' : undefined }}>
                              {emp.apellidos}, {emp.nombres}
                              {esCesado && <span style={{ fontSize: '0.6rem', marginLeft: '4px', background: '#dc2626', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>CESADO</span>}
                            </span>
                          </td>
                        );
                      })()}
                      {diasArray.map(d => {
                        const savedAndLocked = !canEditTareo && cellHasSavedData(empIdx, d);
                        return (
                          <td
                            key={d}
                            className="tareo-td-dia"
                            style={{
                              ...getCellStyle(empIdx, d),
                              cursor: savedAndLocked ? 'not-allowed' : isDragging ? 'crosshair' : 'pointer',
                              userSelect: 'none',
                              ...(savedAndLocked ? { opacity: 0.85 } : {})
                            }}
                            onMouseDown={() => handleCellMouseDown(empIdx, d)}
                            onMouseUp={() => handleCellMouseUp(empIdx, d)}
                            onMouseEnter={() => handleCellMouseEnter(empIdx, d)}
                            onMouseLeave={handleCellMouseLeave}
                            onContextMenu={(e) => handleCellRightClick(e, empIdx, d)}
                            title={savedAndLocked ? `${emp.apellidos} - Día ${d} (🔒 Solo admin puede editar)` : `${emp.apellidos} - Día ${d}`}
                          >
                            {getCellLabel(empIdx, d)}
                          </td>
                        );
                      })}
                      {(() => {
                        const totalesExtras = calcularTotalesExtras(emp);
                        const bgColor = empIdx % 2 === 0 ? '#e5e7eb' : '#d1d5db';
                        return (
                          <td
                            className="tareo-td-extra"
                            style={{ backgroundColor: bgColor, padding: '2px 6px', fontSize: '0.72rem', verticalAlign: 'middle' }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <div style={{ cursor: canEditBono ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', opacity: canEditBono ? 1 : 0.45 }} onClick={() => handleExtraClick(empIdx, 'bono')} title={canEditBono ? 'BONOS' : '🔒 Sin permiso'}>
                                <span style={{ marginRight: 2, fontSize: '0.7rem' }}>S/</span>{totalesExtras.bono.toFixed(2)}
                              </div>
                              <div style={{ cursor: canEditViaticos ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', opacity: canEditViaticos ? 1 : 0.45 }} onClick={() => handleExtraClick(empIdx, 'viaticos')} title={canEditViaticos ? 'MOVILIDAD' : '🔒 Sin permiso'}>
                                <span style={{ marginRight: 2, fontSize: '0.7rem' }}>S/</span>{totalesExtras.viaticos.toFixed(2)}
                              </div>
                              <div style={{ cursor: canEditAlimentacion ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', opacity: canEditAlimentacion ? 1 : 0.45 }} onClick={() => handleExtraClick(empIdx, 'alimentacion')} title={canEditAlimentacion ? 'ALIMENTACION' : '🔒 Sin permiso'}>
                                <span style={{ marginRight: 2, fontSize: '0.7rem' }}>S/</span>{totalesExtras.alimentacion.toFixed(2)}
                              </div>
                            </div>
                          </td>
                        );
                      })()}
                      <td
                        className="tareo-td-resumen"
                        style={{ backgroundColor: '#ede9fe', cursor: canEditHoraExtra ? 'pointer' : 'not-allowed', color: canEditHoraExtra ? '#6d28d9' : '#a78bfa', fontWeight: 600, opacity: canEditHoraExtra ? 1 : 0.6 }}
                        onClick={() => {
                          if (!canEditHoraExtra) {
                            toast.warning('🔒 No tienes permiso para acceder a esta opción');
                            return;
                          }
                          const detalles = emp.extras?.horas_extra_detalles || [];
                          const normalizarFecha = (f) => f ? String(f).substring(0, 10) : '';
                          const normalizarHora  = (h) => h ? String(h).substring(0, 5) : '';
                          setModalHorasExtra({
                            show: true,
                            empleado: emp,
                            empIdx: empIdx,
                            detalles: detalles.length > 0
                              ? detalles.map(d => ({
                                  fecha: normalizarFecha(d.fecha),
                                  hora_inicio: normalizarHora(d.hora_inicio),
                                  hora_fin: normalizarHora(d.hora_fin),
                                  total_horas: parseFloat(d.total_horas || 0),
                                }))
                              : [],
                            saving: false,
                          });
                        }}
                        title="HORAS EXTRA — clic para editar detalle"
                      >
                        <FiClock size={10} style={{ marginRight: 3 }} />
                        {parseFloat(emp.extras?.hora_extra_total || 0).toFixed(2)}
                      </td>
                      <td
                        className="tareo-td-resumen"
                        style={{ backgroundColor: '#fee2e2', cursor: canEditAdelanto ? 'pointer' : 'not-allowed', color: canEditAdelanto ? '#dc2626' : '#fca5a5', fontWeight: 600, opacity: canEditAdelanto ? 1 : 0.6 }}
                        onClick={async () => {
                          if (!canEditAdelanto) {
                            toast.warning('🔒 No tienes permiso para acceder a esta opción');
                            return;
                          }
                          // "Adelantos" = registrar/ver adelantos tomados este mes
                          setModalNuevoAdelanto(prev => ({
                            ...prev,
                            show: true,
                            empleado: emp,
                            empIdx: empIdx,
                            loading: true,
                            adelantos: [],
                            monto_total: '',
                            num_cuotas: 1,
                            tasa: 0,
                            fecha_adelanto: `${anio}-${String(mes).padStart(2, '0')}-01`,
                            descripcion: '',
                            mes_inicio_pago: mes,
                            anio_inicio_pago: anio,
                          }));
                          try {
                            const data = await getAdelantosEmpleado(emp.empleado_id);
                            setModalNuevoAdelanto(prev => ({ ...prev, adelantos: data, loading: false }));
                          } catch {
                            setModalNuevoAdelanto(prev => ({ ...prev, loading: false }));
                          }
                        }}
                        title="Adelanto de sueldo — clic para gestionar"
                      >
                        <FiDollarSign size={10} style={{ marginRight: 3 }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>S/</span>
                        {parseFloat(emp.extras?.adelantos_tomados_total || 0).toFixed(2)}
                      </td>
                      <td
                        className="tareo-td-resumen"
                        style={{ backgroundColor: '#ede9fe', cursor: canEditOtrosDesc ? 'pointer' : 'not-allowed', color: canEditOtrosDesc ? '#7c3aed' : '#c4b5fd', fontWeight: 600, opacity: canEditOtrosDesc ? 1 : 0.6 }}
                        onClick={() => {
                          if (!canEditOtrosDesc) {
                            toast.warning('🔒 No tienes permiso para acceder a esta opción');
                            return;
                          }
                          setModalOtrosDescuentos({
                            show: true,
                            empleado: emp,
                            empIdx: empIdx,
                            monto: parseFloat(emp.extras?.otros_descuentos || 0) > 0 ? parseFloat(emp.extras.otros_descuentos).toFixed(2) : '',
                            descripcion: emp.extras?.descripcion_otros_descuentos || '',
                            saving: false,
                          });
                        }}
                        title={emp.extras?.descripcion_otros_descuentos ? `${emp.extras.descripcion_otros_descuentos}` : 'Otros Descuentos — clic para gestionar'}
                      >
                        <FiDollarSign size={10} style={{ marginRight: 3 }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>S/</span>
                        {parseFloat(emp.extras?.otros_descuentos || 0).toFixed(2)}
                      </td>
                      <td
                        className="tareo-td-resumen"
                        style={{ backgroundColor: '#ecfeff', cursor: canEditCobroVac ? 'pointer' : 'not-allowed', color: canEditCobroVac ? '#0891b2' : '#67e8f9', fontWeight: 600, opacity: canEditCobroVac ? 1 : 0.6 }}
                        onClick={() => {
                          if (!canEditCobroVac) {
                            toast.warning('🔒 No tienes permiso para acceder a esta opción');
                            return;
                          }
                          const cobros = emp.extras?.vacaciones_cobro || [];
                          const aniosDisponibles = [2022, 2023, 2024, 2025, 2026];
                          const periodos = aniosDisponibles.map(a => ({
                            anio_periodo: a,
                            selected: cobros.some(c => c.anio_periodo === a),
                          }));
                          setModalVacacionesCobro({
                            show: true,
                            empleado: emp,
                            empIdx: empIdx,
                            fecha_inicio: cobros.length > 0 ? (cobros[0].fecha_inicio || '') : '',
                            fecha_fin: cobros.length > 0 ? (cobros[0].fecha_fin || '') : '',
                            detalle: cobros.length > 0 ? (cobros[0].detalle || '') : '',
                            periodos,
                            saving: false,
                          });
                        }}
                      title={(() => {
                          const cobros = emp.extras?.vacaciones_cobro || [];
                          if (cobros.length === 0) return 'Cobro Vacaciones — clic para gestionar';
                          return `Cobro Vac: ${cobros.map(c => {
                            const d = c.dias ?? (c.fecha_inicio && c.fecha_fin ? Math.max(0, Math.round((new Date(c.fecha_fin + 'T00:00:00') - new Date(c.fecha_inicio + 'T00:00:00')) / 86400000) + 1) : null);
                            return d != null ? `${c.anio_periodo}-${d}d` : c.anio_periodo;
                          }).join(', ')}`;
                        })()}
                      >
                        <FiCalendar size={10} style={{ marginRight: 3 }} />
                        {(() => {
                          const cobros = emp.extras?.vacaciones_cobro || [];
                          if (cobros.length === 0) return <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>—</span>;
                          return <span style={{ fontSize: '0.7rem' }}>{cobros.map(c => {
                            const d = c.dias ?? (c.fecha_inicio && c.fecha_fin ? Math.max(0, Math.round((new Date(c.fecha_fin + 'T00:00:00') - new Date(c.fecha_inicio + 'T00:00:00')) / 86400000) + 1) : null);
                            return d != null ? `${c.anio_periodo}-${d}d` : c.anio_periodo;
                          }).join(', ')}</span>;
                        })()}
                      </td>
                      {ORDEN_COLUMNAS_TAREO.map((key) => (
                        <td key={key} className="tareo-td-resumen">
                          {resumen[key] || 0}
                        </td>
                      ))}
                      <td className="tareo-td-resumen tareo-td-total" style={{ backgroundColor: '#e0e7ff', fontWeight: 'bold', fontSize: '1.1em', color: '#4338ca' }}>
                        {emp.totales_calculados?.dias !== undefined
                          ? emp.totales_calculados.dias
                          : (() => { const pEx = (resumen['P'] || 0) > 3; return ORDEN_COLUMNAS_TAREO.filter(k => k !== 'V' && k !== 'R' && k !== 'LSG' && !(pEx && k === 'P')).reduce((sum, key) => sum + (resumen[key] || 0), 0); })()}
                      </td>
                      {(() => {
                        const pEx = (resumen['P'] || 0) > 3;
                        const dias = ORDEN_COLUMNAS_TAREO.filter(k => k !== 'V' && k !== 'R' && k !== 'LSG' && !(pEx && k === 'P')).reduce((sum, key) => sum + (resumen[key] || 0), 0);
                        // Usar valor guardado en BD si existe, si no calcular en frontend
                        const redondeoGuardado = emp.totales_calculados?.redondeo ?? undefined;
                        const redondeo = redondeoGuardado !== undefined ? (redondeoGuardado !== null ? redondeoGuardado : null) : calcularRedondeo(resumen, dias);
                        const esRedondeado = redondeo === 30;
                        const esCopia = redondeo !== null && redondeo !== 30;
                        return (
                          <td className="tareo-td-resumen tareo-td-total" style={{
                            backgroundColor: esRedondeado ? '#ede9fe' : esCopia ? '#e0e7ff' : '#f3f4f6',
                            fontWeight: 'bold', fontSize: '1.1em',
                            color: esRedondeado ? '#6d28d9' : esCopia ? '#4338ca' : '#9ca3af',
                          }} title={esRedondeado ? `Mes de ${totalDias}d completo → redondeado a 30` : esCopia ? 'Días rellenados (no completo)' : 'No aplica'}
                          >
                            {redondeo !== null ? redondeo : '—'}
                          </td>
                        );
                      })()}
                      <td className="tareo-td-resumen tareo-td-total" style={{ backgroundColor: '#fef3c7', fontWeight: 'bold', fontSize: '1.1em', color: '#92400e' }}>
                        {((resumen['LT'] || 0) * 1.5 + (resumen['TF'] || 0) * 2).toFixed(1)}
                      </td>
                      <td className="tareo-td-resumen tareo-td-total" style={{ backgroundColor: '#fed7aa', fontWeight: 'bold', fontSize: '1.1em', color: '#9a3412' }}>
                        {(() => { const pC = resumen['P'] || 0; return pC > 3 ? 0 : pC; })()}
                      </td>
                      <td className="tareo-td-resumen tareo-td-total" style={{ backgroundColor: '#fee2e2', fontWeight: 'bold', fontSize: '1.1em', color: '#991b1b' }}>
                        {((resumen['F'] || 0) * 1.5 + (resumen['SU'] || 0) * 1.5).toFixed(1)}
                      </td>
                      <td className="tareo-td-resumen tareo-td-total" style={{ backgroundColor: isDark ? c.surfaceSubtle : '#e2e8f0', fontWeight: 'bold', fontSize: '1.1em' }}>
                        {(() => {
                          // Prioridad: valor guardado en BD
                          if (emp.totales_calculados?.total !== undefined) {
                            return parseFloat(emp.totales_calculados.total).toFixed(1);
                          }
                          // Fallback: calcular en frontend (cambios no guardados aún)
                          const pCountTot = resumen['P'] || 0;
                          const pExTot = pCountTot > 3;
                          const dias = ORDEN_COLUMNAS_TAREO.filter(k => k !== 'V' && k !== 'R' && k !== 'LSG' && !(pExTot && k === 'P')).reduce((sum, key) => sum + (resumen[key] || 0), 0);
                          const dExtra = (resumen['LT'] || 0) * 1.5 + (resumen['TF'] || 0) * 2;
                          const dReducidos = (resumen['F'] || 0) * 1.5 + (resumen['SU'] || 0) * 1.5;
                          const diasNoTrab = pCountTot > 3 ? 0 : pCountTot; // P≤3 → resta del TOTAL; P>3 → ya excluido de DIAS
                          const redondeo = calcularRedondeo(resumen, dias);
                          // Solo restar V cuando redondeo=30 (base sube de diasTotal a 30, V no estaba excluida)
                          // Si redondeo es copia de dias, V ya fue excluida en el cálculo de dias → no restar
                          const vacaciones = redondeo === 30 ? (resumen['V'] || 0) : 0;
                          const baseCalculo = redondeo ?? dias;
                          return (baseCalculo - (resumen['0.5'] || 0) * 0.5 + dExtra - dReducidos - diasNoTrab - vacaciones).toFixed(1);
                        })()}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={totalDias + Object.keys(TIPOS_REGISTRO).length + 11} className="empty-state">
                      No hay empleados vigentes para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación inferior */}
      {pagination.last_page > 1 && (
        <div className="pagination-info" style={{ marginTop: '20px' }}>
          <span>Mostrando {pagination.from} - {pagination.to} de {pagination.total} empleados</span>
          <div className="pagination-buttons">
            <button 
              className="btn-icon" 
              onClick={() => handleCambiarPagina(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
            >
              <FiChevronLeft size={16} />
            </button>
            <span>Página {pagination.current_page} de {pagination.last_page}</span>
            <button 
              className="btn-icon" 
              onClick={() => handleCambiarPagina(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal para editar extras */}
      {modalExtras.show && (
        <div className="modal-overlay" onClick={() => setModalExtras({ ...modalExtras, show: false })}>
          <div className="modal-content modal-extras" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{
                modalExtras.campo === 'hora_extra_total' ? '⏱️ Horas Extra' :
                modalExtras.campo === 'bono' ? '🎁 Bono' :
                modalExtras.campo === 'viaticos' ? '🚗 Viáticos' :
                modalExtras.campo === 'alimentacion' ? '🍽️ Alimentación' :
                `Editar ${modalExtras.campo?.toUpperCase()}`
              }</h3>
              <button className="btn-close" onClick={() => setModalExtras({ ...modalExtras, show: false })}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-empleado-info">
                {modalExtras.empleado?.codigo} - {modalExtras.empleado?.apellidos}, {modalExtras.empleado?.nombres}
              </p>
              <div className="form-group">
                <label>{modalExtras.campo === 'hora_extra_total' ? 'Total Horas Extra (hh.mm)' : 'Monto Total Mensual (S/)'}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control form-control-lg"
                  value={modalExtras.valor}
                  onChange={(e) => setModalExtras({ ...modalExtras, valor: e.target.value })}
                  onFocus={(e) => e.target.select()}
                  autoFocus
                />
              </div>
              {modalExtras.campo !== 'hora_extra_total' && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Descripción / Detalle</label>
                  <input
                    type="text"
                    className="form-control"
                    value={modalExtras.detalle}
                    onChange={(e) => setModalExtras({ ...modalExtras, detalle: e.target.value })}
                    placeholder={`Ej: ${
                      modalExtras.campo === 'bono' ? 'Bono por productividad' :
                      modalExtras.campo === 'viaticos' ? 'Movilidad Lima-Yauli' :
                      'Almuerzo y cena'
                    }`}
                    maxLength={200}
                  />
                </div>
              )}
              <div className="modal-info">
                <small>
                  {modalExtras.campo === 'hora_extra_total'
                    ? 'Ingrese el total de horas extra del mes (ej: 8.5 = 8 horas 30 min)'
                    : 'Este monto se guardará para todos los días trabajados del mes'}
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalExtras({ ...modalExtras, show: false })} disabled={modalExtras.saving}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleGuardarExtra} disabled={modalExtras.saving}>
                {modalExtras.saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para LT - Libre Trabajado */}
      {modalLT.show && (
        <div className="modal-overlay" onClick={() => setModalLT({ show: false, empleado: null, dia: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>🎯 Libre Trabajado (LT)</h3>
              <button className="btn-close" onClick={() => setModalLT({ show: false, empleado: null, dia: null })}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-empleado-info">
                <strong>{modalLT.empleado?.codigo}</strong> - {modalLT.empleado?.apellidos}, {modalLT.empleado?.nombres}
                <br />
                <small>Día {modalLT.dia} de {MESES[mes - 1]} {anio}</small>
              </p>
              <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>
                  LT = 1.5 días (1 día normal + 0.5 extra)
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: c.textSecondary }}>
                  ¿Qué deseas hacer con el 0.5 día extra?
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn-primary" 
                  style={{ padding: '15px', fontSize: '1rem' }}
                  onClick={async () => {
                    try {
                      const key = `${modalLT.empleado.empleado_id}-${modalLT.dia}`;
                      
                      await acumularDias({
                        empleado_id: modalLT.empleado.empleado_id,
                        mes: mes,
                        anio: anio,
                        dia: modalLT.dia
                      });
                      
                      // Marcar que este día tiene acumulación
                      setDiasAcumulados(prev => ({
                        ...prev,
                        [key]: 0.5
                      }));
                      
                      toast.success('✓ 0.5 días acumulados para el futuro');
                      setModalLT({ show: false, empleado: null, dia: null });
                      cargarTareo();
                    } catch (error) {
                      toast.error('Error al acumular días: ' + (error.response?.data?.message || error.message));
                    }
                  }}
                >
                  💰 Acumular para el futuro
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '15px', fontSize: '1rem' }}
                  onClick={async () => {
                    try {
                      const key = `${modalLT.empleado.empleado_id}-${modalLT.dia}`;
                      
                      await acumularDias({
                        empleado_id: modalLT.empleado.empleado_id,
                        mes: mes,
                        anio: anio,
                        dia: modalLT.dia,
                        acumular: false
                      });
                      
                      // Quitar de días acumulados
                      setDiasAcumulados(prev => {
                        const newState = { ...prev };
                        delete newState[key];
                        return newState;
                      });
                      
                      toast.info('El 0.5 se cobrará en este mes como bono');
                      setModalLT({ show: false, empleado: null, dia: null });
                      cargarTareo();
                    } catch (error) {
                      toast.error('Error: ' + (error.response?.data?.message || error.message));
                    }
                  }}
                >
                  💵 Cobrarlo en este mes
                </button>
              </div>
              {(() => {
                const key = `${modalLT.empleado?.empleado_id}-${modalLT.dia}`;
                const tieneAcumulacion = diasAcumulados[key];
                return tieneAcumulacion ? (
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}>
                    ✓ Este día ya tiene 0.5 acumulado. Puedes cambiar la decisión.
                  </div>
                ) : null;
              })()}
              <div style={{ marginTop: '15px', fontSize: '0.85rem', color: c.textSecondary, textAlign: 'center' }}>
                Días acumulados actuales: <strong>{Number(modalLT.empleado?.extras?.dias_acumulados || 0).toFixed(1)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para DL - Día Libre */}
      {modalDL.show && (
        <div className="modal-overlay" onClick={() => setModalDL({ show: false, empleado: null, dia: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>🏖️ Día Libre (DL)</h3>
              <button className="btn-close" onClick={() => setModalDL({ show: false, empleado: null, dia: null })}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-empleado-info">
                <strong>{modalDL.empleado?.codigo}</strong> - {modalDL.empleado?.apellidos}, {modalDL.empleado?.nombres}
                <br />
                <small>Día {modalDL.dia} de {MESES[mes - 1]} {anio}</small>
              </p>
              <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>
                  Días acumulados: {Number(modalDL.empleado?.extras?.dias_acumulados || 0).toFixed(1)}
                </p>
                {(modalDL.empleado?.extras?.dias_acumulados || 0) >= 1.0 ? (
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#065f46' }}>
                    ✓ Puedes usar 1 día acumulado
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#dc2626' }}>
                    ⚠️ Te faltan {Number(1.0 - (modalDL.empleado?.extras?.dias_acumulados || 0)).toFixed(1)} días para completar 1 día
                  </p>
                )}
              </div>
              {(modalDL.empleado?.extras?.dias_acumulados || 0) >= 1.0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '15px', fontSize: '1rem', backgroundColor: '#10b981' }}
                    onClick={async () => {
                      try {
                        await usarDiasAcumulados({
                          empleado_id: modalDL.empleado.empleado_id,
                          mes: mes,
                          anio: anio
                        });
                        toast.success('✓ Día libre usado correctamente');
                        setModalDL({ show: false, empleado: null, dia: null });
                        cargarTareo();
                      } catch (error) {
                        toast.error('Error: ' + (error.response?.data?.message || error.message));
                      }
                    }}
                  >
                    ✅ Usar día acumulado
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '15px', fontSize: '1rem' }}
                    onClick={() => setModalDL({ show: false, empleado: null, dia: null })}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button 
                  className="btn-secondary" 
                  style={{ padding: '15px', fontSize: '1rem', width: '100%' }}
                  onClick={() => setModalDL({ show: false, empleado: null, dia: null })}
                >
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Horas Extra */}
      {modalHorasExtra.show && (() => {
        const closeModal = () => setModalHorasExtra({ show: false, empleado: null, empIdx: null, detalles: [], saving: false });

        const updateDetalle = (index, field, value) => {
          const newDetalles = [...modalHorasExtra.detalles];
          newDetalles[index] = { ...newDetalles[index], [field]: value };

          // Auto-calcular total si se cambia hora_inicio o hora_fin
          if (field === 'hora_inicio' || field === 'hora_fin') {
            const inicio = field === 'hora_inicio' ? value : newDetalles[index].hora_inicio;
            const fin = field === 'hora_fin' ? value : newDetalles[index].hora_fin;
            if (inicio && fin) {
              const [h1, m1] = inicio.split(':').map(Number);
              const [h2, m2] = fin.split(':').map(Number);
              const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
              newDetalles[index].total_horas = diff > 0 ? parseFloat((diff / 60).toFixed(2)) : 0;
            }
          }

          setModalHorasExtra(prev => ({ ...prev, detalles: newDetalles }));
        };

        const addDetalle = () => {
          setModalHorasExtra(prev => ({
            ...prev,
            detalles: [...prev.detalles, { fecha: '', hora_inicio: '', hora_fin: '', total_horas: 0 }]
          }));
        };

        const removeDetalle = (index) => {
          setModalHorasExtra(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
          }));
        };

        const totalGeneral = modalHorasExtra.detalles.reduce((sum, d) => sum + (parseFloat(d.total_horas) || 0), 0);

        const handleGuardarHorasExtra = async () => {
          const { empIdx, detalles, empleado } = modalHorasExtra;
          const emp = tareoData[empIdx];

          // Validar que cada detalle tenga fecha
          const detallesValidos = detalles.filter(d => d.fecha && parseFloat(d.total_horas) > 0);
          const detallesSinFecha = detalles.filter(d => !d.fecha && parseFloat(d.total_horas) > 0);
          if (detallesSinFecha.length > 0) {
            toast.error('Todos los registros deben tener una fecha');
            return;
          }

          setModalHorasExtra(prev => ({ ...prev, saving: true }));
          try {
            const response = await guardarHorasExtraDetalles({
              empleado_id: emp.empleado_id,
              mes: mes,
              anio: anio,
              detalles: detallesValidos.map(d => ({
                fecha: String(d.fecha).substring(0, 10),
                hora_inicio: d.hora_inicio ? String(d.hora_inicio).substring(0, 5) : null,
                hora_fin: d.hora_fin ? String(d.hora_fin).substring(0, 5) : null,
                total_horas: parseFloat(d.total_horas) || 0,
              })),
            });

            // Actualizar estado local
            const updatedTareo = [...tareoData];
            updatedTareo[empIdx] = {
              ...emp,
              extras: {
                ...emp.extras,
                hora_extra_total: response.total,
                horas_extra_detalles: response.detalles,
              }
            };
            setTareoData(updatedTareo);

            toast.success(`✓ ${detallesValidos.length} registro(s) de horas extra guardado(s)`);
            closeModal();
          } catch (error) {
            toast.error('Error al guardar horas extra: ' + (error.response?.data?.message || error.message));
            setModalHorasExtra(prev => ({ ...prev, saving: false }));
          }
        };

        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header">
                <h3>⏱️ Horas Extra</h3>
                <button className="btn-close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                <p className="modal-empleado-info">
                  {modalHorasExtra.empleado?.codigo} - {modalHorasExtra.empleado?.apellidos}, {modalHorasExtra.empleado?.nombres}
                </p>

                {/* Lista de detalles */}
                {modalHorasExtra.detalles.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', borderRadius: '8px', marginBottom: '16px', color: c.textSecondary }}>
                    <FiClock size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No hay registros de horas extra</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Presiona el botón "+" para agregar</p>
                  </div>
                )}

                {modalHorasExtra.detalles.map((detalle, idx) => (
                  <div key={idx} style={{ padding: '12px', marginBottom: '10px', backgroundColor: isDark ? 'rgba(148,163,184,.04)' : '#f1f5f9', borderRadius: '8px', border: `1px solid ${c.borderSubtle}`, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: c.textSecondary }}>Registro #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeDetalle(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                        title="Eliminar registro"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Fecha</label>
                        <input
                          type="date"
                          className="form-control"
                          value={detalle.fecha}
                          min={`${anio}-${String(mes).padStart(2, '0')}-01`}
                          max={`${anio}-${String(mes).padStart(2, '0')}-${String(totalDias).padStart(2, '0')}`}
                          onChange={(e) => updateDetalle(idx, 'fecha', e.target.value)}
                          style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>H. Inicio</label>
                        <input
                          type="time"
                          className="form-control"
                          value={detalle.hora_inicio}
                          onChange={(e) => updateDetalle(idx, 'hora_inicio', e.target.value)}
                          style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>H. Fin</label>
                        <input
                          type="time"
                          className="form-control"
                          value={detalle.hora_fin}
                          onChange={(e) => updateDetalle(idx, 'hora_fin', e.target.value)}
                          style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Hrs</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="24"
                          className="form-control"
                          value={detalle.total_horas}
                          onChange={(e) => updateDetalle(idx, 'total_horas', parseFloat(e.target.value) || 0)}
                          style={{ fontSize: '0.85rem', padding: '6px 8px', width: '70px', textAlign: 'center', fontWeight: 'bold' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Botón para agregar */}
                <button
                  type="button"
                  onClick={addDetalle}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#dbeafe', color: '#1d4ed8', border: '2px dashed #93c5fd', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#bfdbfe'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = '#dbeafe'; }}
                >
                  <FiPlus size={18} /> Agregar Hora Extra
                </button>

                {/* Total general */}
                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#ede9fe', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#5b21b6' }}>Total Horas Extra</span>
                  <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#6d28d9' }}>{totalGeneral.toFixed(2)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal} disabled={modalHorasExtra.saving}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleGuardarHorasExtra} disabled={modalHorasExtra.saving}>
                  {modalHorasExtra.saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal para Adelantos */}
      {modalAdelantos.show && (() => {
        const closeModal = () => setModalAdelantos({ show: false, empleado: null, empIdx: null, detalles: [], saving: false });

        const updateDetalle = (index, field, value) => {
          const newDetalles = [...modalAdelantos.detalles];
          newDetalles[index] = { ...newDetalles[index], [field]: value };
          setModalAdelantos(prev => ({ ...prev, detalles: newDetalles }));
        };

        const addDetalle = () => {
          setModalAdelantos(prev => ({
            ...prev,
            detalles: [...prev.detalles, { fecha: '', monto: 0, descripcion: '' }]
          }));
        };

        const removeDetalle = (index) => {
          setModalAdelantos(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
          }));
        };

        const totalGeneral = modalAdelantos.detalles.reduce((sum, d) => sum + (parseFloat(d.monto) || 0), 0);

        const handleGuardarAdelantos = async () => {
          const { empIdx, detalles } = modalAdelantos;
          const emp = tareoData[empIdx];

          const detallesValidos = detalles.filter(d => d.fecha && parseFloat(d.monto) > 0);
          const detallesSinFecha = detalles.filter(d => !d.fecha && parseFloat(d.monto) > 0);
          if (detallesSinFecha.length > 0) {
            toast.error('Todos los registros deben tener una fecha');
            return;
          }

          setModalAdelantos(prev => ({ ...prev, saving: true }));
          try {
            const response = await guardarAdelantoDetalles({
              empleado_id: emp.empleado_id,
              mes: mes,
              anio: anio,
              detalles: detallesValidos.map(d => ({
                fecha: d.fecha,
                monto: parseFloat(d.monto) || 0,
                descripcion: d.descripcion || null,
              })),
            });

            const updatedTareo = [...tareoData];
            updatedTareo[empIdx] = {
              ...emp,
              extras: {
                ...emp.extras,
                adelanto_detalles: response.detalles,
                adelanto_total: response.total,
              }
            };
            setTareoData(updatedTareo);

            toast.success(`✓ ${detallesValidos.length} adelanto(s) guardado(s)`);
            closeModal();
          } catch (error) {
            toast.error('Error al guardar adelantos: ' + (error.response?.data?.message || error.message));
            setModalAdelantos(prev => ({ ...prev, saving: false }));
          }
        };

        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header">
                <h3>💰 Adelantos de Sueldo</h3>
                <button className="btn-close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                <p className="modal-empleado-info">
                  {modalAdelantos.empleado?.codigo} - {modalAdelantos.empleado?.apellidos}, {modalAdelantos.empleado?.nombres}
                </p>

                {modalAdelantos.detalles.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', borderRadius: '8px', marginBottom: '16px', color: c.textSecondary }}>
                    <FiDollarSign size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No hay adelantos registrados</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Presiona el botón "+" para agregar</p>
                  </div>
                )}

                {modalAdelantos.detalles.map((detalle, idx) => (
                  <div key={idx} style={{ padding: '12px', marginBottom: '10px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#991b1b' }}>Adelanto #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeDetalle(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                        title="Eliminar registro"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Fecha</label>
                        <input
                          type="date"
                          className="form-control"
                          value={detalle.fecha}
                          min={`${anio}-${String(mes).padStart(2, '0')}-01`}
                          max={`${anio}-${String(mes).padStart(2, '0')}-${String(totalDias).padStart(2, '0')}`}
                          onChange={(e) => updateDetalle(idx, 'fecha', e.target.value)}
                          style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Monto (S/)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          value={detalle.monto}
                          onChange={(e) => updateDetalle(idx, 'monto', parseFloat(e.target.value) || 0)}
                          style={{ fontSize: '0.85rem', padding: '6px 8px', fontWeight: 'bold' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Descripción (opcional)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={detalle.descripcion}
                        onChange={(e) => updateDetalle(idx, 'descripcion', e.target.value)}
                        placeholder="Ej: Adelanto quincenal"
                        style={{ fontSize: '0.85rem', padding: '6px 8px' }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addDetalle}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: '2px dashed #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#fecaca'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = '#fee2e2'; }}
                >
                  <FiPlus size={18} /> Agregar Adelanto
                </button>

                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#fee2e2', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#991b1b' }}>Total Adelantos</span>
                  <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#dc2626' }}>S/ {totalGeneral.toFixed(2)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal} disabled={modalAdelantos.saving}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleGuardarAdelantos} disabled={modalAdelantos.saving}>
                  {modalAdelantos.saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Cese */}
      {modalNuevoAdelanto.show && (() => {
        const closeModal = () => setModalNuevoAdelanto(prev => ({
          ...prev, show: false, empleado: null, empIdx: null, adelantos: [], loading: false, saving: false,
          editingAdelantoId: null,
          monto_total: '', num_cuotas: 1, tasa: 0, fecha_adelanto: '', descripcion: '', mes_inicio_pago: '', anio_inicio_pago: '',
        }));

        const montoTotal = parseFloat(modalNuevoAdelanto.monto_total) || 0;
        const tasa = parseFloat(modalNuevoAdelanto.tasa) || 0;
        const montoConInteres = montoTotal * (1 + tasa / 100);
        const montoCuota = modalNuevoAdelanto.num_cuotas > 0 ? montoConInteres / modalNuevoAdelanto.num_cuotas : 0;

        const handleCrearAdelanto = async () => {
          if (!montoTotal || montoTotal <= 0) { toast.error('Ingrese un monto válido'); return; }
          if (!modalNuevoAdelanto.fecha_adelanto) { toast.error('Ingrese la fecha del adelanto'); return; }
          if (!modalNuevoAdelanto.mes_inicio_pago || !modalNuevoAdelanto.anio_inicio_pago) { toast.error('Ingrese mes/año de inicio de pago'); return; }
          setModalNuevoAdelanto(prev => ({ ...prev, saving: true }));
          const payload = {
            empleado_id: modalNuevoAdelanto.empleado.empleado_id,
            monto_total: montoTotal,
            num_cuotas: parseInt(modalNuevoAdelanto.num_cuotas),
            tasa: tasa,
            fecha_adelanto: modalNuevoAdelanto.fecha_adelanto,
            descripcion: modalNuevoAdelanto.descripcion || null,
            mes_inicio_pago: parseInt(modalNuevoAdelanto.mes_inicio_pago),
            anio_inicio_pago: parseInt(modalNuevoAdelanto.anio_inicio_pago),
          };
          try {
            if (modalNuevoAdelanto.editingAdelantoId) {
              await actualizarAdelanto(modalNuevoAdelanto.editingAdelantoId, payload);
              toast.success(`✓ Adelanto actualizado: ${parseInt(modalNuevoAdelanto.num_cuotas)} cuota(s) de S/ ${montoCuota.toFixed(2)}`);
            } else {
              await crearAdelanto(payload);
              toast.success(`✓ Adelanto creado: ${parseInt(modalNuevoAdelanto.num_cuotas)} cuota(s) de S/ ${montoCuota.toFixed(2)}`);
            }
            const data = await getAdelantosEmpleado(modalNuevoAdelanto.empleado.empleado_id);
            setModalNuevoAdelanto(prev => ({
              ...prev, adelantos: data, saving: false, editingAdelantoId: null,
              monto_total: '', num_cuotas: 1, tasa: 0, descripcion: '',
            }));
            cargarTareo();
          } catch (error) {
            toast.error('Error: ' + (error.response?.data?.message || error.message));
            setModalNuevoAdelanto(prev => ({ ...prev, saving: false }));
          }
        };

        const handleEditarAdelanto = (adel) => {
          // Extraer mes/año de la primera cuota pendiente
          const primerCuotaPendiente = adel.pagos?.find(p => p.estado === 'PENDIENTE');
          const mesPago = primerCuotaPendiente?.periodo?.mes || mes;
          const anioPago = primerCuotaPendiente?.periodo?.anio || anio;
          setModalNuevoAdelanto(prev => ({
            ...prev,
            editingAdelantoId: adel.id,
            monto_total: parseFloat(adel.monto_total).toString(),
            num_cuotas: adel.num_cuotas,
            tasa: parseFloat(adel.tasa) || 0,
            fecha_adelanto: adel.fecha_adelanto,
            descripcion: adel.descripcion || '',
            mes_inicio_pago: mesPago,
            anio_inicio_pago: anioPago,
          }));
          // Scroll al formulario
          setTimeout(() => document.querySelector('.modal-body')?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
        };

        const handleEliminarAdelanto = async (adelantoId) => {
          if (!confirm('¿Eliminar este adelanto y todas sus cuotas?')) return;
          try {
            await eliminarAdelanto(adelantoId);
            toast.success('Adelanto eliminado');
            const data = await getAdelantosEmpleado(modalNuevoAdelanto.empleado.empleado_id);
            setModalNuevoAdelanto(prev => ({ ...prev, adelantos: data }));
            cargarTareo();
          } catch (error) {
            toast.error('Error: ' + (error.response?.data?.message || error.message));
          }
        };

        const MESES_NOMBRES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)', color: '#fff' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiDollarSign size={20} /> Gestión de Adelantos
                </h3>
                <button className="btn-close" onClick={closeModal} style={{ color: '#fff' }}>×</button>
              </div>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
                <p className="modal-empleado-info" style={{ marginBottom: '16px', fontWeight: 600 }}>
                  {modalNuevoAdelanto.empleado?.codigo} - {modalNuevoAdelanto.empleado?.apellidos}, {modalNuevoAdelanto.empleado?.nombres}
                </p>

                {/* Formulario nuevo / editar adelanto */}
                <div style={{ padding: '16px', backgroundColor: modalNuevoAdelanto.editingAdelantoId ? '#fffbeb' : '#fef2f2', borderRadius: '10px', border: `1px solid ${modalNuevoAdelanto.editingAdelantoId ? '#fde68a' : '#fecaca'}`, marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, color: modalNuevoAdelanto.editingAdelantoId ? '#92400e' : '#991b1b', fontSize: '0.95rem' }}>
                      {modalNuevoAdelanto.editingAdelantoId ? '✏️ Editar Adelanto' : '📝 Registrar Nuevo Adelanto'}
                    </h4>
                    {modalNuevoAdelanto.editingAdelantoId && (
                      <button onClick={() => setModalNuevoAdelanto(prev => ({ ...prev, editingAdelantoId: null, monto_total: '', num_cuotas: 1, tasa: 0, fecha_adelanto: `${anio}-${String(mes).padStart(2,'0')}-01`, descripcion: '', mes_inicio_pago: mes, anio_inicio_pago: anio }))}
                        style={{ background: 'none', border: '1px solid #d97706', borderRadius: '6px', color: '#92400e', cursor: 'pointer', fontSize: '0.75rem', padding: '3px 10px', fontWeight: 600 }}
                        title="Cancelar edición">
                        ✕ Cancelar edición
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Monto Total (S/)</label>
                      <input type="number" step="0.01" min="0" className="form-control" value={modalNuevoAdelanto.monto_total}
                        onChange={(e) => setModalNuevoAdelanto(prev => ({ ...prev, monto_total: e.target.value }))}
                        style={{ fontSize: '0.9rem', padding: '8px', fontWeight: 'bold' }} placeholder="0.00" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Nº Cuotas</label>
                      <input type="number" min="1" max="48" className="form-control" value={modalNuevoAdelanto.num_cuotas}
                        onChange={(e) => setModalNuevoAdelanto(prev => ({ ...prev, num_cuotas: parseInt(e.target.value) || 1 }))}
                        style={{ fontSize: '0.9rem', padding: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Tasa % (opcional)</label>
                      <input type="number" step="0.01" min="0" max="100" className="form-control" value={modalNuevoAdelanto.tasa}
                        onChange={(e) => setModalNuevoAdelanto(prev => ({ ...prev, tasa: parseFloat(e.target.value) || 0 }))}
                        style={{ fontSize: '0.9rem', padding: '8px' }} placeholder="0" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Fecha Adelanto</label>
                      <input type="date" className="form-control" value={modalNuevoAdelanto.fecha_adelanto}
                        onChange={(e) => setModalNuevoAdelanto(prev => ({ ...prev, fecha_adelanto: e.target.value }))}
                        style={{ fontSize: '0.9rem', padding: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Mes Inicio Pago</label>
                      <select className="form-control" value={modalNuevoAdelanto.mes_inicio_pago}
                        onChange={(e) => setModalNuevoAdelanto(prev => ({ ...prev, mes_inicio_pago: parseInt(e.target.value) }))}
                        style={{ fontSize: '0.9rem', padding: '8px' }}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{MESES_NOMBRES[m]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Año Inicio Pago</label>
                      <input type="number" min="2020" className="form-control" value={modalNuevoAdelanto.anio_inicio_pago}
                        onChange={(e) => setModalNuevoAdelanto(prev => ({ ...prev, anio_inicio_pago: parseInt(e.target.value) || anio }))}
                        style={{ fontSize: '0.9rem', padding: '8px' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: c.textSecondary, display: 'block', marginBottom: '2px' }}>Descripción (opcional)</label>
                    <input type="text" className="form-control" value={modalNuevoAdelanto.descripcion}
                      onChange={(e) => setModalNuevoAdelanto(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Ej: Préstamo personal" style={{ fontSize: '0.9rem', padding: '8px' }} />
                  </div>

                  {/* Preview del cálculo */}
                  {montoTotal > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: c.textSecondary }}>
                        <span>Monto:</span><span style={{ fontWeight: 600 }}>S/ {montoTotal.toFixed(2)}</span>
                      </div>
                      {tasa > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: c.textSecondary }}>
                          <span>+ Interés ({tasa}%):</span><span style={{ fontWeight: 600 }}>S/ {(montoConInteres - montoTotal).toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#991b1b', fontWeight: 700, borderTop: '1px solid #fecaca', paddingTop: '6px', marginTop: '6px' }}>
                        <span>Total a pagar:</span><span>S/ {montoConInteres.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#7f1d1d', fontWeight: 700 }}>
                        <span>Cuota mensual ({modalNuevoAdelanto.num_cuotas}x):</span><span>S/ {montoCuota.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <button onClick={handleCrearAdelanto} disabled={modalNuevoAdelanto.saving}
                    style={{ marginTop: '12px', width: '100%', padding: '10px', backgroundColor: modalNuevoAdelanto.editingAdelantoId ? '#d97706' : '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: modalNuevoAdelanto.saving ? 0.6 : 1 }}>
                    {modalNuevoAdelanto.saving
                      ? <><FiRefreshCw size={16} className="spin" /> {modalNuevoAdelanto.editingAdelantoId ? 'Actualizando...' : 'Creando...'}</>
                      : modalNuevoAdelanto.editingAdelantoId
                        ? <><FiCheck size={16} /> Actualizar Adelanto</>
                        : <><FiPlus size={16} /> Crear Adelanto</>
                    }
                  </button>
                </div>

                {/* Lista de adelantos existentes */}
                <h4 style={{ margin: '0 0 10px', color: '#374151', fontSize: '0.95rem' }}>📋 Adelantos Registrados</h4>
                {modalNuevoAdelanto.loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: c.textSecondary }}>
                    <FiRefreshCw size={20} className="spin" /> Cargando...
                  </div>
                ) : modalNuevoAdelanto.adelantos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: c.textMuted, backgroundColor: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', borderRadius: '8px' }}>
                    No tiene adelantos registrados
                  </div>
                ) : (
                  modalNuevoAdelanto.adelantos.map(adel => (
                    <div key={adel.id} style={{ padding: '12px', marginBottom: '10px', backgroundColor: '#fef9f0', borderRadius: '8px', border: '1px solid #fde68a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.9rem' }}>
                            S/ {parseFloat(adel.monto_total).toFixed(2)}
                            {parseFloat(adel.tasa) > 0 && <span style={{ fontSize: '0.75rem', color: '#92400e' }}> (+{adel.tasa}%)</span>}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleEditarAdelanto(adel)}
                            style={{ background: 'none', border: '1px solid #d97706', borderRadius: '6px', color: '#d97706', cursor: 'pointer', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
                            title="Editar adelanto">
                            ✏️ Editar
                          </button>
                          <button onClick={() => handleEliminarAdelanto(adel.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Eliminar">
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: c.textSecondary }}>
                        {adel.descripcion && <span style={{ display: 'block', marginBottom: '2px' }}>{adel.descripcion}</span>}
                        <span>Fecha: {adel.fecha_adelanto} | Cuotas: {adel.cuotas_pagadas}/{adel.num_cuotas} | Cuota: S/ {parseFloat(adel.monto_cuota).toFixed(2)}</span>
                        <span style={{ display: 'block' }}>Saldo: S/ {parseFloat(adel.saldo_pendiente).toFixed(2)}</span>
                      </div>
                      {/* Detalle de pagos/cuotas */}
                      {adel.pagos && adel.pagos.length > 0 && (
                        <div style={{ marginTop: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: isDark ? 'rgba(148,163,184,.04)' : '#f1f5f9' }}>
                                <th style={{ padding: '3px 6px', textAlign: 'left' }}>#</th>
                                <th style={{ padding: '3px 6px', textAlign: 'left' }}>Periodo</th>
                                <th style={{ padding: '3px 6px', textAlign: 'right' }}>Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adel.pagos.map(pago => (
                                <tr key={pago.id} style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                                  <td style={{ padding: '3px 6px' }}>{pago.num_cuota}</td>
                                  <td style={{ padding: '3px 6px' }}>{pago.periodo ? `${MESES_NOMBRES[pago.periodo.mes]} ${pago.periodo.anio}` : '-'}</td>
                                  <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 600 }}>S/ {parseFloat(pago.monto).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Cese / Amonestaciones */}
      {modalCese.show && (
        <div className="modal-overlay" onClick={() => !modalCese.saving && (setModalCese(MODAL_CESE_INIT), setAmonestacionesEmpleado([]))}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: '#fff' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAlertTriangle size={20} />
                {modalCese.tabActiva === 'cese' ? 'Registrar Cese' : 'Amonestaciones'}
              </h3>
            </div>

            {/* Pestañas */}
            <div style={{ display: 'flex', borderBottom: `2px solid ${isDark ? 'rgba(220,38,38,.3)' : '#fee2e2'}`, background: isDark ? 'rgba(220,38,38,.06)' : '#fff5f5' }}>
              {[
                { key: 'cese', label: '⚠️ Registrar Cese' },
                { key: 'amonestacion', label: '📋 Amonestaciones' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setModalCese(prev => ({ ...prev, tabActiva: tab.key }));
                    if (tab.key === 'amonestacion' && modalCese.empleado?.empleado_id) {
                      cargarAmonestacionesEmpleado(modalCese.empleado.empleado_id);
                    }
                  }}
                  style={{
                    flex: 1, padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontWeight: modalCese.tabActiva === tab.key ? 700 : 500, fontSize: '0.85rem',
                    color: modalCese.tabActiva === tab.key ? '#dc2626' : (isDark ? '#94a3b8' : '#6b7280'),
                    borderBottom: modalCese.tabActiva === tab.key ? '3px solid #dc2626' : '3px solid transparent',
                    marginBottom: '-2px', transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              {/* Info del empleado */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: isDark ? 'rgba(148,163,184,.04)' : '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
                <strong>{modalCese.empleado?.codigo}</strong> - {modalCese.empleado?.apellidos}, {modalCese.empleado?.nombres}
              </div>

              {/* ===== TAB: REGISTRAR CESE ===== */}
              {modalCese.tabActiva === 'cese' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: isDark ? '#e2e8f0' : '#374151' }}>Fecha de Cese *</label>
                    <input type="date" className="form-control"
                      value={modalCese.fechaCese}
                      onChange={(e) => setModalCese(prev => ({ ...prev, fechaCese: e.target.value }))}
                      style={{ padding: '10px', fontSize: '0.95rem', width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: isDark ? '#e2e8f0' : '#374151' }}>Motivo de Cese</label>
                    <textarea className="form-control"
                      value={modalCese.motivoCese}
                      onChange={(e) => setModalCese(prev => ({ ...prev, motivoCese: e.target.value }))}
                      placeholder="Ej: Renuncia voluntaria, Término de contrato, Despido..."
                      rows={3} style={{ padding: '10px', fontSize: '0.95rem', width: '100%', resize: 'vertical' }} />
                  </div>
                  {modalCese.empleado?.fecha_cese && (
                    <div style={{ padding: '10px', backgroundColor: '#fef2f2', borderRadius: '6px', fontSize: '0.85rem', color: '#991b1b' }}>
                      <strong>⚠️ Este empleado ya tiene fecha de cese registrada:</strong> {modalCese.empleado.fecha_cese}
                      {modalCese.empleado.motivo_cese && <><br />Motivo: {modalCese.empleado.motivo_cese}</>}
                    </div>
                  )}
                </>
              )}

              {/* ===== TAB: AMONESTACIONES ===== */}
              {modalCese.tabActiva === 'amonestacion' && (
                <>
                  {/* Lista de amonestaciones existentes */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                      Historial de Amonestaciones
                    </div>
                    {loadingAmon ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.85rem' }}>Cargando...</div>
                    ) : amonestacionesEmpleado.length === 0 ? (
                      <div style={{ padding: '12px', background: isDark ? 'rgba(255,255,255,.03)' : '#f8fafc', borderRadius: 7, textAlign: 'center', color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.85rem' }}>
                        Sin amonestaciones registradas
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                        {amonestacionesEmpleado.map(a => {
                          const colores = { VERBAL: '#f59e0b', ESCRITA: '#dc2626', SUSPENSION: '#7c3aed', OTROS: '#64748b' };
                          const etiquetas = { VERBAL: 'Verbal', ESCRITA: 'Escrita', SUSPENSION: 'Suspensión', OTROS: 'Otros' };
                          const col = colores[a.tipo] || '#64748b';
                          return (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', background: isDark ? 'rgba(255,255,255,.03)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,.07)' : '#e2e8f0'}`, borderLeft: `3px solid ${col}`, borderRadius: 6, fontSize: '0.82rem' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 4, background: isDark ? `${col}22` : `${col}18`, color: col, fontWeight: 700, fontSize: '0.72rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{etiquetas[a.tipo] || a.tipo}</span>
                              <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.fecha ? String(a.fecha).split('T')[0] : '—'}</span>
                              <span style={{ color: isDark ? '#cbd5e1' : '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.motivo}>{a.motivo}</span>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('¿Eliminar esta amonestación?')) return;
                                  try { await borrarAmonestacion(a.id); toast.success('Amonestación eliminada'); cargarAmonestacionesEmpleado(modalCese.empleado.empleado_id); }
                                  catch (err) { toast.error('Error: ' + (err.response?.data?.message || err.message)); }
                                }}
                                style={{ flexShrink: 0, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0 2px' }} title="Eliminar">
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Separador */}
                  <div style={{ borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,.1)' : '#e2e8f0'}`, marginBottom: 16, paddingTop: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
                      <FiPlus size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Agregar Nueva Amonestación
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 5, color: isDark ? '#e2e8f0' : '#374151', fontSize: '0.85rem' }}>Tipo *</label>
                        <select className="form-control"
                          value={modalCese.tipoAmonestacion}
                          onChange={(e) => setModalCese(prev => ({ ...prev, tipoAmonestacion: e.target.value }))}
                          style={{ padding: '8px 10px', fontSize: '0.9rem', width: '100%' }}>
                          <option value="">-- Tipo --</option>
                          <option value="VERBAL">Verbal</option>
                          <option value="ESCRITA">Escrita</option>
                          <option value="SUSPENSION">Suspensión</option>
                          <option value="OTROS">Otros</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 5, color: isDark ? '#e2e8f0' : '#374151', fontSize: '0.85rem' }}>Fecha *</label>
                        <input type="date" className="form-control"
                          value={modalCese.fechaAmonestacion}
                          onChange={(e) => setModalCese(prev => ({ ...prev, fechaAmonestacion: e.target.value }))}
                          style={{ padding: '8px 10px', fontSize: '0.9rem', width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 5, color: isDark ? '#e2e8f0' : '#374151', fontSize: '0.85rem' }}>Motivo *</label>
                      <textarea className="form-control"
                        value={modalCese.motivoAmonestacion}
                        onChange={(e) => setModalCese(prev => ({ ...prev, motivoAmonestacion: e.target.value }))}
                        placeholder="Describa el motivo..."
                        rows={2} style={{ padding: '8px 10px', fontSize: '0.9rem', width: '100%', resize: 'vertical' }} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary"
                onClick={() => { setModalCese(MODAL_CESE_INIT); setAmonestacionesEmpleado([]); }}
                disabled={modalCese.saving}>
                Cancelar
              </button>

              {/* Botón TAB Cese */}
              {modalCese.tabActiva === 'cese' && (
                <button className="btn-primary"
                  style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                  disabled={modalCese.saving || !modalCese.fechaCese}
                  onClick={async () => {
                    setModalCese(prev => ({ ...prev, saving: true }));
                    try {
                      await cesarEmpleado(modalCese.empleado.empleado_id, {
                        fecha_cese: modalCese.fechaCese,
                        motivo_cese: modalCese.motivoCese || null,
                      });
                      toast.success(`✓ Cese registrado para ${modalCese.empleado.apellidos}, ${modalCese.empleado.nombres}`);
                      setModalCese(MODAL_CESE_INIT);
                      setAmonestacionesEmpleado([]);
                      await cargarTareo(pagination.current_page);
                    } catch (error) {
                      toast.error('Error al registrar cese: ' + (error.response?.data?.message || error.message));
                      setModalCese(prev => ({ ...prev, saving: false }));
                    }
                  }}>
                  {modalCese.saving ? 'Guardando...' : '⚠️ Registrar Cese'}
                </button>
              )}

              {/* Botón TAB Amonestación */}
              {modalCese.tabActiva === 'amonestacion' && (
                <button className="btn-primary"
                  style={{ backgroundColor: '#b45309', borderColor: '#b45309' }}
                  disabled={modalCese.saving || !modalCese.tipoAmonestacion || !modalCese.motivoAmonestacion || !modalCese.fechaAmonestacion}
                  onClick={async () => {
                    setModalCese(prev => ({ ...prev, saving: true }));
                    try {
                      await crearAmonestacion({
                        empleado_id:  modalCese.empleado.empleado_id,
                        tipo:         modalCese.tipoAmonestacion,
                        motivo:       modalCese.motivoAmonestacion,
                        fecha:        modalCese.fechaAmonestacion,
                      });
                      toast.success('📋 Amonestación registrada');
                      setModalCese(prev => ({ ...prev, tipoAmonestacion: '', motivoAmonestacion: '', fechaAmonestacion: '', saving: false }));
                      cargarAmonestacionesEmpleado(modalCese.empleado.empleado_id);
                    } catch (error) {
                      toast.error('Error: ' + (error.response?.data?.message || error.message));
                      setModalCese(prev => ({ ...prev, saving: false }));
                    }
                  }}>
                  {modalCese.saving ? 'Guardando...' : <><FiPlus size={13} style={{ marginRight: 4 }} />Agregar</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Otros Descuentos */}
      {modalOtrosDescuentos.show && (() => {
        const closeModal = () => setModalOtrosDescuentos({ show: false, empleado: null, empIdx: null, monto: '', descripcion: '', saving: false });

        const handleGuardar = async () => {
          const monto = parseFloat(modalOtrosDescuentos.monto) || 0;
          if (monto < 0) { toast.error('El monto no puede ser negativo'); return; }

          setModalOtrosDescuentos(prev => ({ ...prev, saving: true }));
          try {
            await guardarOtrosDescuentos(
              modalOtrosDescuentos.empleado.empleado_id,
              mes, anio,
              monto,
              modalOtrosDescuentos.descripcion || null
            );

            // Actualizar estado local
            const updatedTareo = [...tareoData];
            updatedTareo[modalOtrosDescuentos.empIdx] = {
              ...modalOtrosDescuentos.empleado,
              extras: {
                ...modalOtrosDescuentos.empleado.extras,
                otros_descuentos: monto,
                descripcion_otros_descuentos: modalOtrosDescuentos.descripcion || null,
              }
            };
            setTareoData(updatedTareo);

            toast.success('✓ Otros descuentos guardados');
            closeModal();
          } catch (error) {
            toast.error('Error al guardar: ' + (error.response?.data?.message || error.message));
            setModalOtrosDescuentos(prev => ({ ...prev, saving: false }));
          }
        };

        const handleEliminar = async () => {
          if (!confirm('¿Eliminar el descuento registrado?')) return;
          setModalOtrosDescuentos(prev => ({ ...prev, saving: true }));
          try {
            await guardarOtrosDescuentos(modalOtrosDescuentos.empleado.empleado_id, mes, anio, 0, null);

            const updatedTareo = [...tareoData];
            updatedTareo[modalOtrosDescuentos.empIdx] = {
              ...modalOtrosDescuentos.empleado,
              extras: {
                ...modalOtrosDescuentos.empleado.extras,
                otros_descuentos: 0,
                descripcion_otros_descuentos: null,
              }
            };
            setTareoData(updatedTareo);

            toast.success('✓ Descuento eliminado');
            closeModal();
          } catch (error) {
            toast.error('Error al eliminar: ' + (error.response?.data?.message || error.message));
            setModalOtrosDescuentos(prev => ({ ...prev, saving: false }));
          }
        };

        const tieneDescuento = parseFloat(modalOtrosDescuentos.empleado?.extras?.otros_descuentos || 0) > 0;

        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3>🔖 Otros Descuentos</h3>
                <button className="btn-close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-empleado-info">
                  <strong>{modalOtrosDescuentos.empleado?.codigo}</strong> — {modalOtrosDescuentos.empleado?.apellidos}, {modalOtrosDescuentos.empleado?.nombres}
                </p>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Monto del Descuento (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-lg"
                    value={modalOtrosDescuentos.monto}
                    onChange={(e) => setModalOtrosDescuentos(prev => ({ ...prev, monto: e.target.value }))}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                    autoFocus
                    style={{ fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Descripción</label>
                  <input
                    type="text"
                    className="form-control"
                    value={modalOtrosDescuentos.descripcion}
                    onChange={(e) => setModalOtrosDescuentos(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Ej: Préstamo interno, uniforme, multa..."
                    maxLength={255}
                    style={{ fontSize: '0.95rem' }}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <div>
                  {tieneDescuento && (
                    <button className="btn-secondary" style={{ color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleEliminar} disabled={modalOtrosDescuentos.saving}>
                      <FiTrash2 size={14} style={{ marginRight: 4 }} /> Eliminar
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={closeModal} disabled={modalOtrosDescuentos.saving}>
                    Cancelar
                  </button>
                  <button className="btn-primary" style={{ backgroundColor: '#7c3aed' }} onClick={handleGuardar} disabled={modalOtrosDescuentos.saving}>
                    {modalOtrosDescuentos.saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Cobro de Vacaciones */}
      {modalVacacionesCobro.show && (() => {
        const closeModal = () => setModalVacacionesCobro(prev => ({ ...prev, show: false }));

        const togglePeriodo = (idx) => {
          setModalVacacionesCobro(prev => {
            const periodos = [...prev.periodos];
            periodos[idx] = { ...periodos[idx], selected: !periodos[idx].selected };
            return { ...prev, periodos };
          });
        };

        const handleGuardar = async () => {
          const seleccionados = modalVacacionesCobro.periodos.filter(p => p.selected);
          if (seleccionados.length === 0) {
            toast.warning('Selecciona al menos un periodo');
            return;
          }
          if (!modalVacacionesCobro.fecha_inicio) {
            toast.warning('Ingresa la fecha de inicio del cobro');
            return;
          }
          setModalVacacionesCobro(prev => ({ ...prev, saving: true }));
          try {
            const res = await guardarVacacionesCobro({
              empleado_id: modalVacacionesCobro.empleado.empleado_id,
              mes,
              anio,
              fecha_inicio: modalVacacionesCobro.fecha_inicio || null,
              fecha_fin: modalVacacionesCobro.fecha_fin || null,
              detalle: modalVacacionesCobro.detalle || null,
              dias: modalVacacionesCobro.fecha_inicio && modalVacacionesCobro.fecha_fin
                ? Math.max(0, Math.round((new Date(modalVacacionesCobro.fecha_fin + 'T00:00:00') - new Date(modalVacacionesCobro.fecha_inicio + 'T00:00:00')) / 86400000) + 1)
                : null,
              periodos: seleccionados.map(p => ({
                anio_periodo: p.anio_periodo,
              })),
            });

            const updatedTareo = [...tareoData];
            updatedTareo[modalVacacionesCobro.empIdx] = {
              ...modalVacacionesCobro.empleado,
              extras: {
                ...modalVacacionesCobro.empleado.extras,
                vacaciones_cobro: res.cobros,
              }
            };
            setTareoData(updatedTareo);

            toast.success('Cobro de vacaciones guardado');
            closeModal();
          } catch (error) {
            toast.error('Error: ' + (error.response?.data?.message || error.message));
            setModalVacacionesCobro(prev => ({ ...prev, saving: false }));
          }
        };

        const handleEliminar = async () => {
          if (!confirm('Eliminar todos los cobros de vacaciones de este mes?')) return;
          setModalVacacionesCobro(prev => ({ ...prev, saving: true }));
          try {
            await eliminarVacacionesCobro(modalVacacionesCobro.empleado.empleado_id, mes, anio);

            const updatedTareo = [...tareoData];
            updatedTareo[modalVacacionesCobro.empIdx] = {
              ...modalVacacionesCobro.empleado,
              extras: {
                ...modalVacacionesCobro.empleado.extras,
                vacaciones_cobro: [],
              }
            };
            setTareoData(updatedTareo);

            toast.success('Cobros de vacaciones eliminados');
            closeModal();
          } catch (error) {
            toast.error('Error: ' + (error.response?.data?.message || error.message));
            setModalVacacionesCobro(prev => ({ ...prev, saving: false }));
          }
        };

        const tieneCobros = (modalVacacionesCobro.empleado?.extras?.vacaciones_cobro || []).length > 0;

        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="modal-header" style={{ backgroundColor: '#ecfeff', borderBottom: '2px solid #0891b2' }}>
                <h3 style={{ color: '#0891b2' }}>Cobro de Vacaciones</h3>
                <button className="btn-close" onClick={closeModal}>{String.fromCharCode(215)}</button>
              </div>
              <div className="modal-body">
                <p className="modal-empleado-info">
                  <strong>{modalVacacionesCobro.empleado?.codigo}</strong> {String.fromCharCode(8212)} {modalVacacionesCobro.empleado?.apellidos}, {modalVacacionesCobro.empleado?.nombres}
                </p>

                {/* Periodos - solo checkboxes de anio */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Periodo(s) a Cobrar</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {modalVacacionesCobro.periodos.map((p, idx) => (
                      <div
                        key={p.anio_periodo}
                        onClick={() => togglePeriodo(idx)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: p.selected ? '2px solid #0891b2' : `1px solid ${c.borderSubtle}`,
                          backgroundColor: p.selected ? '#0891b2' : isDark ? 'transparent' : '#fff',
                          color: p.selected ? '#fff' : c.textSecondary,
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          userSelect: 'none',
                        }}
                      >
                        {p.selected && <FiCheck size={14} />}
                        {p.anio_periodo}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fecha de cobro: inicio y fin */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Fecha de Cobro</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.78rem', color: c.textSecondary, fontWeight: 600, display: 'block', marginBottom: '3px' }}>Fecha Inicio</label>
                      <input
                        type="date"
                        className="form-control"
                        value={modalVacacionesCobro.fecha_inicio}
                        onChange={(e) => setModalVacacionesCobro(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                        style={{ fontSize: '0.9rem', padding: '8px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.78rem', color: c.textSecondary, fontWeight: 600, display: 'block', marginBottom: '3px' }}>Fecha Fin</label>
                      <input
                        type="date"
                        className="form-control"
                        value={modalVacacionesCobro.fecha_fin}
                        onChange={(e) => setModalVacacionesCobro(prev => ({ ...prev, fecha_fin: e.target.value }))}
                        style={{ fontSize: '0.9rem', padding: '8px' }}
                      />
                    </div>
                  </div>
                  {modalVacacionesCobro.fecha_inicio && modalVacacionesCobro.fecha_fin && (() => {
                    const dias = Math.round((new Date(modalVacacionesCobro.fecha_fin + 'T00:00:00') - new Date(modalVacacionesCobro.fecha_inicio + 'T00:00:00')) / 86400000) + 1;
                    return dias > 0 ? (
                      <div style={{ marginTop: '8px', padding: '6px 12px', backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '6px', display: 'inline-block' }}>
                        <span style={{ fontWeight: 700, color: '#0891b2', fontSize: '1.1rem' }}>{dias}</span>
                        <span style={{ color: c.textSecondary, fontSize: '0.85rem', marginLeft: '4px' }}>{dias === 1 ? 'día' : 'días'}</span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Detalle */}
                <div className="form-group">
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Detalle del Cobro</label>
                  <input
                    type="text"
                    className="form-control"
                    value={modalVacacionesCobro.detalle}
                    onChange={(e) => setModalVacacionesCobro(prev => ({ ...prev, detalle: e.target.value }))}
                    placeholder="Ej: Cobro vacaciones truncas, venta de vacaciones..."
                    maxLength={255}
                    style={{ fontSize: '0.95rem' }}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <div>
                  {tieneCobros && (
                    <button className="btn-secondary" style={{ color: '#dc2626', borderColor: '#fca5a5' }} onClick={handleEliminar} disabled={modalVacacionesCobro.saving}>
                      <FiTrash2 size={14} style={{ marginRight: 4 }} /> Eliminar
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={closeModal} disabled={modalVacacionesCobro.saving}>
                    Cancelar
                  </button>
                  <button className="btn-primary" style={{ backgroundColor: '#0891b2' }} onClick={handleGuardar} disabled={modalVacacionesCobro.saving}>
                    {modalVacacionesCobro.saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Tareo;