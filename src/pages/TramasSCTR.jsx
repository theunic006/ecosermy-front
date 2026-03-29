import { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { getEmpleadosVigentes } from '../services/empleadoService';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

function TramasSCTR() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const data = await getEmpleadosVigentes();
      setEmpleados(data);
    } catch (error) {
      toast.error('Error al cargar personal');
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const anio = d.getUTCFullYear();
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
    }));

    const ws = XLSX.utils.json_to_sheet(datos);

    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 8 },   // TipDoc
      { wch: 12 },  // NumDoc
      { wch: 18 },  // ApePaterno
      { wch: 18 },  // ApeMaterno
      { wch: 20 },  // Nombres
      { wch: 35 },  // Nombre Completo
      { wch: 13 },  // Nacimiento
      { wch: 12 },  // Sueldo
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
