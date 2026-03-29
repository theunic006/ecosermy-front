import { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { getEmpleadosSctr } from '../services/empleadoService';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function TramasSCTR() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const data = await getEmpleadosSctr();
      setEmpleados(data);
    } catch (error) {
      toast.error('Error al cargar personal');
    } finally {
      setLoading(false);
    }
  };

  const parseFecha = (fecha) => {
    if (!fecha) return null;
    // Tomar solo la parte YYYY-MM-DD sin importar el formato que venga
    const solo = String(fecha).substring(0, 10);
    const [y, m, d] = solo.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const formatFecha = (fecha) => {
    const d = parseFecha(fecha);
    if (!d) return '';
    const dia  = String(d.getDate()).padStart(2, '0');
    const mes  = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const getApePaterno = (apellidos) => {
    if (!apellidos) return '';
    return apellidos.split(' ')[0] || '';
  };

  const getApeMaterno = (apellidos) => {
    if (!apellidos) return '';
    const partes = apellidos.split(' ');
    return partes.slice(1).join(' ') || '';
  };

  const getSituacion = (emp) => {
    const ahora      = new Date();
    const mesActual  = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    // 1. Ingresó este mes → Nuevo
    const fechaIng = parseFecha(emp.fecha_ingreso);
    if (fechaIng && fechaIng.getMonth() === mesActual && fechaIng.getFullYear() === anioActual) {
      return { texto: 'Nuevo', color: '#16a34a' };
    }

    // 2. Tiene fecha_cese
    const fechaCese = parseFecha(emp.fecha_cese);
    if (fechaCese) {
      if (fechaCese.getMonth() === mesActual && fechaCese.getFullYear() === anioActual) {
        return { texto: `Cesado ${MESES[mesActual]}`, color: '#dc2626' };
      }
      return { texto: `Cesado ${MESES[fechaCese.getMonth()]}`, color: '#dc2626' };
    }

    // 3. Sin cese → Estable
    return { texto: 'Estable', color: '' };
  };

  const exportarExcel = () => {
    const datos = empleados.map((emp) => ({
      TipDoc: 'DNI',
      NumDoc: emp.dni || '',
      ApePaterno: getApePaterno(emp.apellidos),
      ApeMaterno: getApeMaterno(emp.apellidos),
      Nombres: emp.nombres || '',
      'Nombre Completo': emp.nombre_completo || '',
      Nacimiento: formatFecha(emp.fecha_nacimiento),
      Sueldo: emp.sueldo_base ? Number(emp.sueldo_base) : 0,
      'Fecha Inicio': formatFecha(emp.fecha_ingreso),
      'Fecha Cese': formatFecha(emp.fecha_cese),
      Situacion: getSituacion(emp).texto,
    }));

    const ws = XLSX.utils.json_to_sheet(datos);

    ws['!cols'] = [
      { wch: 8 },   // TipDoc
      { wch: 12 },  // NumDoc
      { wch: 18 },  // ApePaterno
      { wch: 18 },  // ApeMaterno
      { wch: 20 },  // Nombres
      { wch: 35 },  // Nombre Completo
      { wch: 13 },  // Nacimiento
      { wch: 12 },  // Sueldo
      { wch: 14 },  // Fecha Inicio
      { wch: 13 },  // Fecha Cese
      { wch: 18 },  // Situacion
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trama SCTR');
    XLSX.writeFile(wb, 'trama_sctr.xlsx');
    toast.success('Trama SCTR exportada correctamente');
  };

  const columns = [
    { header: 'TipDoc', render: () => 'DNI', width: '70px' },
    { header: 'NumDoc', accessor: 'dni', width: '105px' },
    { header: 'ApePaterno', render: (row) => getApePaterno(row.apellidos), width: '140px' },
    { header: 'ApeMaterno', render: (row) => getApeMaterno(row.apellidos), width: '140px' },
    { header: 'Nombres', accessor: 'nombres', width: '160px' },
    { header: 'Nombre Completo', accessor: 'nombre_completo' },
    {
      header: 'Nacimiento',
      render: (row) => formatFecha(row.fecha_nacimiento),
      width: '105px',
    },
    {
      header: 'Sueldo',
      render: (row) =>
        row.sueldo_base
          ? Number(row.sueldo_base).toLocaleString('es-PE', { minimumFractionDigits: 2 })
          : '-',
      width: '110px',
    },
    {
      header: 'Fecha Inicio',
      render: (row) => formatFecha(row.fecha_ingreso),
      width: '110px',
    },
    {
      header: 'Fecha Cese',
      render: (row) => formatFecha(row.fecha_cese) || '-',
      width: '110px',
    },
    {
      header: 'Situación',
      render: (row) => {
        const sit = getSituacion(row);
        if (!sit.texto || sit.texto === 'Estable') {
          return (
            <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>
              {sit.texto || '—'}
            </span>
          );
        }
        return (
          <span
            style={{
              background: sit.color + '18',
              color: sit.color,
              border: `1px solid ${sit.color}40`,
              borderRadius: '999px',
              padding: '2px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {sit.texto}
          </span>
        );
      },
      width: '130px',
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Tramas SCTR</h2>
        <div className="page-actions">
          <button className="btn-secondary" onClick={cargarEmpleados}>
            <FiRefreshCw size={16} /> Actualizar
          </button>
          <button className="btn-primary" onClick={exportarExcel}>
            <FiDownload size={16} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={empleados}
          searchable
          pageSize={20}
        />
      </div>
    </div>
  );
}

export default TramasSCTR;
