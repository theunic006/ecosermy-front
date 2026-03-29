import { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { getEmpleadosVigentes } from '../services/empleadoService';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

function Tramas() {
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
      NombreCompleto: emp.nombre_completo || '',
      Nacimiento: formatFecha(emp.fecha_nacimiento),
      Sueldo: emp.sueldo_base ? Number(emp.sueldo_base) : 0,
      Ocupacion: emp.cargo?.nombre || '',
      TipRiesgo: emp.categoria || '',
      LugarExposicion: emp.unidad || '',
      Sexo: emp.sexo || '',
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trama');
    XLSX.writeFile(wb, 'trama_personal.xlsx');
    toast.success('Trama exportada correctamente');
  };

  const columns = [
    { header: 'TipDoc', render: () => 'DNI', width: '70px' },
    { header: 'NumDoc', accessor: 'dni', width: '105px' },
    { header: 'ApePaterno', render: (row) => getApePaterno(row.apellidos), width: '130px' },
    { header: 'ApeMaterno', render: (row) => getApeMaterno(row.apellidos), width: '130px' },
    { header: 'Nombres', accessor: 'nombres', width: '150px' },
    { header: 'NombreCompleto', accessor: 'nombre_completo' },
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
      width: '100px',
    },
    { header: 'Ocupacion', render: (row) => row.cargo?.nombre || '-' },
    { header: 'TipRiesgo', accessor: 'categoria', width: '120px', render: (row) => row.categoria || '-' },
    { header: 'LugarExposicion', accessor: 'unidad', width: '140px', render: (row) => row.unidad || '-' },
    { header: 'Sexo', accessor: 'sexo', width: '65px', render: (row) => row.sexo || '-' },
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Tramas</h2>
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

export default Tramas;
