import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiUserX, FiUserCheck, FiUpload, FiDownload, FiFile, FiAlertTriangle } from 'react-icons/fi';
import { getEmpleados, getEmpleado, deleteEmpleado, reactivarEmpleado, getEmpleadosInactivos, descargarPlantilla, importarEmpleados } from '../services/empleadoService';
import { useCatalogos } from '../contexts/CatalogosContext';
import { useAuth } from '../hooks/useAuth';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import EmpleadoForm from '../components/empleados/EmpleadoForm';
import EmpleadoDetail from '../components/empleados/EmpleadoDetail';
import DescuentoJudicialModal from '../components/empleados/DescuentoJudicialModal';
import { formatMoney, formatDate, getSituacionColor } from '../utils/helpers';
import { UNIDADES } from '../utils/constants';
import { toast } from 'react-toastify';
import { useThemeColors } from '../utils/darkColors';

function Empleados() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('empleados.crear');
  const canEdit   = hasPermission('empleados.editar');
  const canDelete = hasPermission('empleados.eliminar');
  const { isDark, c } = useThemeColors();
  const [empleados, setEmpleados] = useState([]);
  const [inactivos, setInactivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { catalogos, loading: catalogosLoading } = useCatalogos();
  const [modalForm, setModalForm] = useState(false);
  const [modalDetail, setModalDetail] = useState(false);
  const [modalDescuentoJudicial, setModalDescuentoJudicial] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [filtroSituacion, setFiltroSituacion] = useState('TODOS');
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [filtroMesContrato, setFiltroMesContrato] = useState('');
  const [modalImportar, setModalImportar] = useState(false);
  const [archivoImport, setArchivoImport] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    cargarEmpleados();
    cargarInactivos();
  }, []);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const emps = await getEmpleados();
      setEmpleados(emps);
    } catch (error) {
      toast.error('Error al cargar empleados');
      console.error('Error cargando empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarInactivos = async () => {
    try {
      const data = await getEmpleadosInactivos();
      setInactivos(data);
    } catch (error) {
      console.error('Error cargando inactivos:', error);
    }
  };

  const handleInactivar = async (id) => {
    if (!confirm('¿Está seguro de marcar este empleado como inactivo? Podrá reactivarlo después.')) return;
    try {
      const emp = await deleteEmpleado(id);
      setEmpleados(prev => prev.filter(e => e.id !== id));
      if (emp?.empleado) setInactivos(prev => [emp.empleado, ...prev]);
      toast.success('Empleado marcado como inactivo');
    } catch (error) {
      toast.error('Error al inactivar empleado');
      cargarEmpleados();
    }
  };

  const handleReactivar = async (id) => {
    try {
      const emp = await reactivarEmpleado(id);
      setInactivos(prev => prev.filter(e => e.id !== id));
      if (emp?.empleado) setEmpleados(prev => [emp.empleado, ...prev]);
      toast.success('Empleado reactivado correctamente');
    } catch (error) {
      toast.error('Error al reactivar empleado');
    }
  };

  const handleNew = () => {
    setSelectedEmpleado(null);
    setModalForm(true);
  };

  const handleEdit = (emp) => {
    setSelectedEmpleado(emp);
    setModalForm(true);
  };

  const handleView = (emp) => {
    setSelectedEmpleado(emp);
    setModalDetail(true);
  };

  const handleDescuentoJudicial = (emp) => {
    setSelectedEmpleado(emp);
    setModalDescuentoJudicial(true);
  };

  const handleFormSaved = (empleadoGuardado, esNuevo) => {
    // Actualización optimista: actualizar UI inmediatamente
    if (esNuevo) {
      // Agregar nuevo empleado al inicio
      setEmpleados(prev => [empleadoGuardado, ...prev]);
    } else {
      // Actualizar empleado existente
      setEmpleados(prev => prev.map(e => 
        e.id === empleadoGuardado.id ? empleadoGuardado : e
      ));
    }
    setModalForm(false);
  };

  const handleDescargarPlantilla = async () => {
    try {
      const response = await descargarPlantilla();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_empleados.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Plantilla descargada');
    } catch (error) {
      toast.error('Error al descargar plantilla');
    }
  };

  const handleImportar = async () => {
    if (!archivoImport) {
      toast.error('Seleccione un archivo Excel');
      return;
    }
    setImportando(true);
    setResultadoImport(null);
    try {
      const result = await importarEmpleados(archivoImport);
      setResultadoImport(result);
      if (result.importados > 0) {
        toast.success(`${result.importados} empleados importados correctamente`);
        cargarEmpleados();
      }
      if (result.total_errores > 0) {
        toast.warning(`${result.total_errores} filas con errores`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al importar');
    } finally {
      setImportando(false);
    }
  };

  const cerrarModalImportar = () => {
    setModalImportar(false);
    setArchivoImport(null);
    setResultadoImport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const empleadosFiltrados = empleados
    .filter(e => filtroSituacion === 'TODOS' || e.situacion_contractual === filtroSituacion)
    .filter(e => !filtroUnidad || e.unidad === filtroUnidad)
    .filter(e => {
      if (!filtroMesContrato) return true;
      if (!e.contrato_fin) return false;
      const fecha = new Date(e.contrato_fin);
      const [anio, mes] = filtroMesContrato.split('-');
      return fecha.getUTCFullYear() === parseInt(anio) && (fecha.getUTCMonth() + 1) === parseInt(mes);
    });

  const columns = [
    { header: 'Código', accessor: 'codigo_trabajador', width: '90px' },
    {
      header: 'Empleado',
      accessor: 'apellidos',
      render: (row) => `${row.apellidos}, ${row.nombres}`
    },
    { header: 'DNI', accessor: 'dni', width: '100px' },
    {
      header: 'F. Inicio',
      accessor: 'contrato_inicio',
      render: (row) => row.contrato_inicio ? (
        <span style={{ fontSize: '0.8rem' }}>{formatDate(row.contrato_inicio)}</span>
      ) : '-',
      width: '100px'
    },
    {
      header: 'F. Fin Contrato',
      accessor: 'contrato_fin',
      render: (row) => {
        if (!row.contrato_fin) return <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem' }}>ESTABLE</span>;
        const hoy = new Date();
        const fin = new Date(row.contrato_fin);
        const diffDias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
        let color = 'var(--text-primary)';
        let bg = 'transparent';
        if (diffDias < 0) { color = 'var(--danger)'; bg = 'var(--danger-bg)'; }
        else if (diffDias <= 30) { color = isDark ? '#fbbf24' : '#b45309'; bg = 'var(--warning-bg)'; }
        return (
          <span style={{ color, background: bg, padding: '2px 6px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: diffDias <= 30 ? 600 : 400 }}>
            {formatDate(row.contrato_fin)}
          </span>
        );
      },
      width: '130px'
    },
    { header: 'Área', render: (row) => row.area?.nombre || '-', width: '120px' },
    { header: 'Cargo', render: (row) => row.cargo?.nombre || '-', width: '150px' },
    {
      header: 'TESEO',
      width: '70px',
      render: (row) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22, height: 22,
            borderRadius: 5,
            background: row.teseo ? 'var(--success-bg)' : 'var(--bg-secondary)',
            border: `2px solid ${row.teseo ? 'var(--success)' : 'var(--border-color)'}`,
            color: row.teseo ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.75rem',
          }}
          title={row.teseo ? 'Registrado en TESEO' : 'No registrado en TESEO'}
        >
          {row.teseo ? '✓' : ''}
        </span>
      )
    },
    {
      header: 'Sueldo',
      accessor: 'sueldo_base',
      render: (row) => formatMoney(row.sueldo_base),
      width: '110px'
    },
    {
      header: 'Desc. Judicial',
      accessor: 'descuentos_judiciales',
      width: '200px',
      render: (row) => {
        const activos = (row.descuentos_judiciales || []).filter(d => d.activo);
        if (activos.length === 0) return (
          <button
            className="btn-icon-sm"
            title="Sin descuentos judiciales — Click para gestionar"
            style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '6px', border: `1px dashed ${c.borderNormal}` }}
            onClick={(e) => { e.stopPropagation(); handleDescuentoJudicial(row); }}
          >
            + Agregar
          </button>
        );
        const total = activos.reduce((s, d) => s + parseFloat(d.monto || 0), 0);
        return (
          <button
            onClick={(e) => { e.stopPropagation(); handleDescuentoJudicial(row); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
          >
            {activos.map((d, i) => (
              <div key={d.id} style={{
                borderLeft: `3px solid ${c.danger}`,
                paddingLeft: '6px',
                marginBottom: i < activos.length - 1 ? '6px' : 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ backgroundColor: isDark ? 'rgba(248,113,113,.15)' : '#dc2626', color: isDark ? c.dangerText : '#fff', fontSize: '0.68rem' }}>
                    <FiAlertTriangle size={9} style={{ marginRight: 2 }} />
                    {formatMoney(d.monto)}
                  </span>
                  {d.concepto && (
                    <span style={{ fontSize: '0.68rem', color: isDark ? '#fbbf24' : '#b45309', fontWeight: 600 }}>{d.concepto}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '185px' }}>
                  {d.apellidos_beneficiario}, {d.nombre_beneficiario}
                </div>
                {(d.banco_beneficiario || d.numero_cuenta_beneficiario) && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '185px' }}>
                    {d.banco_beneficiario}{d.banco_beneficiario && d.numero_cuenta_beneficiario ? ' · ' : ''}{d.numero_cuenta_beneficiario}
                  </div>
                )}
                {d.expediente && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    Exp: {d.expediente}
                  </div>
                )}
              </div>
            ))}
            {activos.length > 1 && (
              <div style={{ marginTop: '4px', fontSize: '0.72rem', fontWeight: 700, color: c.danger, borderTop: `1px dashed ${isDark ? 'rgba(248,113,113,.2)' : '#fca5a5'}`, paddingTop: '3px' }}>
                Total: {formatMoney(total)}
              </div>
            )}
          </button>
        );
      }
    },
    {
      header: 'Situación',
      accessor: 'situacion_contractual',
      render: (row) => (
        <span className="badge" style={{ backgroundColor: getSituacionColor(row.situacion_contractual) }}>
          {row.situacion_contractual}
        </span>
      ),
      width: '100px'
    },
    {
      header: 'Acciones',
      width: '130px',
      render: (row) => (
        <div className="table-actions">
          <button className="btn-icon-sm" title="Ver" onClick={(e) => { e.stopPropagation(); handleView(row); }}>
            <FiEye size={14} />
          </button>
          {canEdit && (
            <button className="btn-icon-sm" title="Editar" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
              <FiEdit2 size={14} />
            </button>
          )}
          {canDelete && (
            <button
              className="btn-icon-sm"
              style={{ color: '#f59e0b' }}
              title="Marcar como inactivo"
              onClick={(e) => { e.stopPropagation(); handleInactivar(row.id); }}
            >
              <FiUserX size={14} />
            </button>
          )}
        </div>
      )
    },
  ];

  if (loading) return <Loading />;
  if (loading || catalogosLoading) return <Loading />;

  const exportarExcel = () => {
    // Columnas por grupo
    const grupoPersonal = [
      { label: 'Código',            get: e => e.codigo_trabajador || '' },
      { label: 'Apellidos',          get: e => e.apellidos || '' },
      { label: 'Nombres',            get: e => e.nombres || '' },
      { label: 'DNI',                get: e => e.dni || '' },
      { label: 'F. Nacimiento',      get: e => e.fecha_nacimiento ? new Date(e.fecha_nacimiento).toLocaleDateString('es-PE') : '' },
      { label: 'Edad',               get: e => { if (!e.fecha_nacimiento) return ''; const h = new Date(), n = new Date(e.fecha_nacimiento); let a = h.getFullYear() - n.getFullYear(); if (h.getMonth() - n.getMonth() < 0 || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--; return a; } },
      { label: 'Sexo',               get: e => e.sexo === 'M' ? 'Masculino' : e.sexo === 'F' ? 'Femenino' : '' },
      { label: 'Estado Civil',       get: e => e.estado_civil || '' },
      { label: 'Grado Instrucción',  get: e => e.grado_instruccion || '' },
      { label: 'Dirección',          get: e => e.direccion || '' },
      { label: 'Celular',            get: e => e.celular || '' },
      { label: 'Email',              get: e => e.email || '' },
    ];
    const grupoLaboral = [
      { label: 'Área',             get: e => e.area?.nombre || '' },
      { label: 'Unidad',           get: e => e.unidad || '' },
      { label: 'Cargo',            get: e => e.cargo?.nombre || '' },
      { label: 'Categoría',        get: e => e.categoria || '' },
      { label: 'Turno',            get: e => e.turno?.nombre || '' },
      { label: 'Situación',        get: e => e.situacion_contractual || '' },
      { label: 'Tipo Contrato',    get: e => e.tipo_contrato || '' },
      { label: 'F. Ingreso',       get: e => e.fecha_ingreso ? new Date(e.fecha_ingreso).toLocaleDateString('es-PE') : '' },
      { label: 'Contrato Desde',   get: e => e.contrato_inicio ? new Date(e.contrato_inicio).toLocaleDateString('es-PE') : '' },
      { label: 'Contrato Hasta',   get: e => e.contrato_fin ? new Date(e.contrato_fin).toLocaleDateString('es-PE') : 'ESTABLE' },
      { label: 'Sueldo Base',      get: e => parseFloat(e.sueldo_base) || 0 },
      { label: 'Bono Regular',     get: e => parseFloat(e.bono_regular) || 0 },
      { label: 'TESEO',            get: e => e.teseo ? 'SÍ' : 'NO' },
      { label: 'Fecha Cese',       get: e => e.fecha_cese ? new Date(e.fecha_cese).toLocaleDateString('es-PE') : '' },
    ];
    const grupoPension = [
      { label: 'Sistema Pensión',      get: e => e.sistema_pension?.nombre || e.sistema_pensiones || '' },
      { label: 'CUSPP',                get: e => e.cuspp || '' },
      { label: 'Asig. Familiar',       get: e => e.tiene_asignacion_familiar ? 'SÍ' : 'NO' },
      { label: 'Val. Asig. Familiar',  get: e => e.tiene_asignacion_familiar ? (parseFloat(e.val_asig_familiar) || 0) : 0 },
      { label: 'Nº Hijos',             get: e => parseInt(e.numero_hijos) || 0 },
      { label: 'EsSalud +Vida',        get: e => e.essalud_vida ? 'SÍ' : 'NO' },
      { label: 'Banco',                get: e => e.banco || '' },
      { label: 'Cuenta Bancaria',      get: e => e.cuenta_bancaria || '' },
      { label: 'CCI',                  get: e => e.cci || '' },
    ];

    const C = {
      personal: { dark: '#1e3a8a', mid: '#3b82f6', light: '#dbeafe', text: '#1e3a8a' },
      laboral:  { dark: '#14532d', mid: '#16a34a', light: '#dcfce7', text: '#14532d' },
      pension:  { dark: '#4c1d95', mid: '#7c3aed', light: '#ede9fe', text: '#4c1d95' },
    };

    const cell = (val, bg, color, bold = false, align = 'left', size = '9pt') =>
      `<td style="background:${bg};color:${color};font-weight:${bold ? 'bold' : 'normal'};` +
      `text-align:${align};font-size:${size};font-family:Calibri,Arial,sans-serif;` +
      `border:1px solid #94a3b8;padding:4px 8px;white-space:nowrap;vertical-align:middle;">${val ?? ''}</td>`;

    const TOTAL = grupoPersonal.length + grupoLaboral.length + grupoPension.length;
    const fecha = new Date().toLocaleDateString('es-PE');

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Personal</x:Name><x:WorksheetOptions><x:Selected/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head><body><table border="0" cellspacing="0" cellpadding="0">`;

    // Fila 1: Título general
    html += `<tr><td colspan="${TOTAL}" style="background:#0f172a;color:#f8fafc;font-weight:bold;font-size:13pt;
      font-family:Calibri,Arial,sans-serif;padding:10px 14px;border:1px solid #0f172a;text-align:center;">` +
      `REPORTE DE PERSONAL — ECOSERMY &nbsp;&nbsp;|  ${fecha} &nbsp;&nbsp;|  ${empleadosFiltrados.length} empleados` +
      `${filtroSituacion !== 'TODOS' ? '&nbsp;&nbsp;|&nbsp;&nbsp;Situación: ' + filtroSituacion : ''}` +
      `${filtroUnidad ? '&nbsp;&nbsp;|&nbsp;&nbsp;Unidad: ' + filtroUnidad : ''}</td></tr>`;

    // Fila 2: Encabezados de grupo
    html += '<tr>';
    html += cell(`DATOS PERSONALES (${grupoPersonal.length} campos)`, C.personal.dark, '#fff', true, 'center', '10pt');
    for (let i = 1; i < grupoPersonal.length; i++) html += cell('', C.personal.dark, '#fff', true, 'center', '10pt');
    html += cell(`DATOS LABORALES (${grupoLaboral.length} campos)`, C.laboral.dark, '#fff', true, 'center', '10pt');
    for (let i = 1; i < grupoLaboral.length; i++) html += cell('', C.laboral.dark, '#fff', true, 'center', '10pt');
    html += cell(`PENSIONES Y BENEFICIOS (${grupoPension.length} campos)`, C.pension.dark, '#fff', true, 'center', '10pt');
    for (let i = 1; i < grupoPension.length; i++) html += cell('', C.pension.dark, '#fff', true, 'center', '10pt');
    html += '</tr>';

    // Fila 3: Sub-encabezados de columnas
    html += '<tr>';
    grupoPersonal.forEach(c => html += cell(c.label, C.personal.mid, '#fff', true, 'center'));
    grupoLaboral.forEach(c  => html += cell(c.label, C.laboral.mid,  '#fff', true, 'center'));
    grupoPension.forEach(c  => html += cell(c.label, C.pension.mid,  '#fff', true, 'center'));
    html += '</tr>';

    // Filas de datos con filas alternas por grupo
    empleadosFiltrados.forEach((e, i) => {
      const par = i % 2 === 0;
      html += '<tr>';
      grupoPersonal.forEach(c => html += cell(c.get(e), par ? C.personal.light : '#fff', C.personal.text));
      grupoLaboral.forEach(c  => html += cell(c.get(e), par ? C.laboral.light  : '#fff', C.laboral.text));
      grupoPension.forEach(c  => html += cell(c.get(e), par ? C.pension.light  : '#fff', C.pension.text));
      html += '</tr>';
    });

    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const filtroLabel = filtroSituacion !== 'TODOS' ? `_${filtroSituacion}` : '';
    const unidadLabel = filtroUnidad ? `_${filtroUnidad.replace(/\s+/g, '_')}` : '';
    a.href     = url;
    a.download = `Personal${filtroLabel}${unidadLabel}_${fecha.replace(/\//g, '-')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${empleadosFiltrados.length} empleados exportados correctamente`);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Gestión de Empleados</h2>
        <div className="page-actions">
          <select
            className="form-select"
            value={filtroSituacion}
            onChange={(e) => setFiltroSituacion(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            <option value="VIGENTE">Vigentes</option>
            <option value="CESADO">Cesados</option>
            <option value="SUSPENDIDO">Suspendidos</option>
            <option value="NUEVO">Nuevos</option>
          </select>
          <select
            className="form-select"
            value={filtroUnidad}
            onChange={(e) => setFiltroUnidad(e.target.value)}
            title="Filtrar por unidad"
          >
            <option value="">Todas las unidades</option>
            {UNIDADES.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <input
            type="month"
            className="form-input"
            style={{ maxWidth: '160px' }}
            value={filtroMesContrato}
            onChange={(e) => setFiltroMesContrato(e.target.value)}
            title="Filtrar por mes de vencimiento de contrato"
            placeholder="Mes fin contrato"
          />
          {filtroMesContrato && (
            <button
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              onClick={() => setFiltroMesContrato('')}
              title="Limpiar filtro"
            >
              ✕ Limpiar
            </button>
          )}
          {canCreate && (
            <>
              <button className="btn-primary" onClick={handleNew}>
                <FiPlus size={16} /> Nuevo Empleado
              </button>
              <button className="btn-secondary" onClick={exportarExcel} title="Exportar a Excel con 3 hojas: Personal, Laboral, Pensiones">
                <FiDownload size={16} /> Exportar Excel
              </button>
              <button className="btn-primary" style={{ backgroundColor: '#059669' }} onClick={() => setModalImportar(true)}>
                <FiUpload size={16} /> Importar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={empleadosFiltrados}
          searchable
          pageSize={15}
          filterFn={(row, term) =>
            [row.apellidos, row.nombres, row.codigo_trabajador, row.dni]
              .some(v => String(v || '').toLowerCase().includes(term))
          }
        />
      </div>

      {/* ─── Sección Personal Inactivo ─── */}
      {inactivos.length > 0 && (
        <div className="card" style={{ marginTop: '28px', borderTop: `3px solid #94a3b8` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '4px 0' }}>
            <FiUserX size={20} style={{ color: '#64748b' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
              Personal Inactivo
              <span style={{ marginLeft: 8, fontSize: '0.8rem', background: '#e2e8f0', color: '#475569', borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                {inactivos.length}
              </span>
            </h3>
          </div>
          <DataTable
            columns={[
              { header: 'Código', accessor: 'codigo_trabajador', width: '90px' },
              {
                header: 'Personal',
                accessor: 'apellidos',
                render: (row) => `${row.apellidos}, ${row.nombres}`
              },
              { header: 'DNI', accessor: 'dni', width: '100px' },
              { header: 'Área', render: (row) => row.area?.nombre || '-', width: '130px' },
              { header: 'Cargo', render: (row) => row.cargo?.nombre || '-', width: '160px' },
              {
                header: 'Acciones',
                width: '100px',
                render: (row) => (
                  <div className="table-actions">
                    {canDelete && (
                      <button
                        className="btn-icon-sm"
                        style={{ color: 'var(--success)' }}
                        title="Reactivar empleado"
                        onClick={(e) => { e.stopPropagation(); handleReactivar(row.id); }}
                      >
                        <FiUserCheck size={14} />
                      </button>
                    )}
                  </div>
                )
              },
            ]}
            data={inactivos}
            searchable
            pageSize={10}
            filterFn={(row, term) =>
              [row.apellidos, row.nombres, row.codigo_trabajador, row.dni]
                .some(v => String(v || '').toLowerCase().includes(term))
            }
          />
        </div>
      )}

      {/* Modal Formulario */}
      <Modal
        isOpen={modalForm}
        onClose={() => setModalForm(false)}
        title={selectedEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
        size="large"
      >
        <EmpleadoForm
          empleado={selectedEmpleado}
          catalogos={catalogos}
          onSaved={handleFormSaved}
          onCancel={() => setModalForm(false)}
        />
      </Modal>

      {/* Modal Detalle */}
      <Modal
        isOpen={modalDetail}
        onClose={() => setModalDetail(false)}
        title="Detalle del Empleado"
        size="large"
      >
        {selectedEmpleado && <EmpleadoDetail empleado={selectedEmpleado} />}
      </Modal>

      {/* Modal Descuento Judicial */}
      <Modal
        isOpen={modalDescuentoJudicial}
        onClose={() => setModalDescuentoJudicial(false)}
        title="Descuentos Judiciales"
        size="large"
      >
        {selectedEmpleado && (
          <DescuentoJudicialModal
            empleado={selectedEmpleado}
            onDescuentosChange={(descuentos) => {
              // Actualizar descuentos_judiciales en la lista local
              setEmpleados(prev => prev.map(e =>
                e.id === selectedEmpleado.id
                  ? { ...e, descuentos_judiciales: descuentos }
                  : e
              ));
            }}
          />
        )}
      </Modal>

      {/* Modal Importar */}
      {modalImportar && (
        <div className="modal-overlay" onClick={cerrarModalImportar}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3><FiUpload size={20} style={{ marginRight: 8 }} />Importar Empleados</h3>
              <button className="btn-close" onClick={cerrarModalImportar}>×</button>
            </div>
            <div className="modal-body">
              {/* Paso 1: Descargar plantilla */}
              <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: '0 0 8px', color: '#166534', fontSize: '0.95rem' }}>Paso 1: Descargar Plantilla</h4>
                <p style={{ margin: '0 0 12px', color: '#15803d', fontSize: '0.85rem' }}>
                  Descarga la plantilla Excel con las columnas requeridas y la hoja de catálogos (cargos, áreas, turnos, pensiones).
                </p>
                <button
                  className="btn-primary"
                  style={{ backgroundColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleDescargarPlantilla}
                >
                  <FiDownload size={16} /> Descargar Plantilla Excel
                </button>
              </div>

              {/* Paso 2: Subir archivo */}
              <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', marginBottom: '16px', border: '1px solid #bfdbfe' }}>
                <h4 style={{ margin: '0 0 8px', color: '#1e40af', fontSize: '0.95rem' }}>Paso 2: Subir archivo completado</h4>
                <p style={{ margin: '0 0 12px', color: '#1d4ed8', fontSize: '0.85rem' }}>
                  Llena la plantilla con los datos reales y súbela aquí. La fila de ejemplo será ignorada si la borras.
                </p>
                <div
                  style={{
                    border: '2px dashed #93c5fd',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: archivoImport ? '#dbeafe' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {archivoImport ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <FiFile size={20} color="#2563eb" />
                      <span style={{ color: '#1e40af', fontWeight: 600 }}>{archivoImport.name}</span>
                    </div>
                  ) : (
                    <div>
                      <FiUpload size={28} color="#93c5fd" />
                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Click para seleccionar archivo .xlsx</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    setArchivoImport(e.target.files[0] || null);
                    setResultadoImport(null);
                  }}
                />
              </div>

              {/* Resultado de importación */}
              {resultadoImport && (
                <div style={{ padding: '16px', borderRadius: '8px', marginBottom: '16px', backgroundColor: resultadoImport.total_errores > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${resultadoImport.total_errores > 0 ? '#fecaca' : '#bbf7d0'}` }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 700, color: resultadoImport.importados > 0 ? '#166534' : '#991b1b' }}>
                    ✓ {resultadoImport.importados} empleados importados
                    {resultadoImport.total_errores > 0 && ` | ✗ ${resultadoImport.total_errores} errores`}
                  </p>
                  {resultadoImport.errores?.length > 0 && (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.8rem', color: '#991b1b' }}>
                      {resultadoImport.errores.map((err, i) => (
                        <p key={i} style={{ margin: '2px 0' }}>• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={cerrarModalImportar} disabled={importando}>
                {resultadoImport ? 'Cerrar' : 'Cancelar'}
              </button>
              {!resultadoImport && (
                <button className="btn-primary" onClick={handleImportar} disabled={importando || !archivoImport}>
                  {importando ? 'Importando...' : 'Importar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Empleados;
