import { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import { getEmpleadosVigentes } from '../services/empleadoService';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function TramasVidaLey() {
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

  const parseFecha = (fecha) => {
    if (!fecha) return null;
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

  const getSexo = (sexo) => {
    if (!sexo) return '';
    const s = String(sexo).toLowerCase();
    if (s === 'masculino' || s === 'm') return 'M';
    if (s === 'femenino'  || s === 'f') return 'F';
    return sexo;
  };

  const getSituacion = (emp) => {
    const ahora      = new Date();
    const mesActual  = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    // 1. Tiene fecha_cese → Cese {mes}
    const fechaCese = parseFecha(emp.fecha_cese);
    if (fechaCese) {
      return { texto: `Cese ${MESES[fechaCese.getMonth()]}`, color: '#dc2626' };
    }

    // 2. Ingresó este mes → Nuevo
    const fechaIng = parseFecha(emp.fecha_ingreso);
    if (fechaIng && fechaIng.getMonth() === mesActual && fechaIng.getFullYear() === anioActual) {
      return { texto: 'Nuevo', color: '#16a34a' };
    }

    // 3. contrato_fin vacío o null → Estable
    if (!emp.contrato_fin) {
      return { texto: 'Estable', color: '#2563eb' };
    }

    // 4. Tiene contrato_fin pero no es nuevo ni cesado → en blanco
    return { texto: '', color: '' };
  };

  const PRIORIDAD = (sit) => {
    if (sit === 'Nuevo')   return 0;
    if (sit === '')        return 1;
    if (sit === 'Estable') return 2;
    return 3; // Cese *
  };

  const empleadosOrdenados = empleados
    .map(emp => ({ ...emp, _situacion: getSituacion(emp).texto }))
    .sort((a, b) => PRIORIDAD(a._situacion) - PRIORIDAD(b._situacion));

  const exportarExcel = () => {
    const datos = empleadosOrdenados.map((emp) => ({
      TipDoc: 'DNI',
      NumDoc: emp.dni || '',
      ApePaterno: getApePaterno(emp.apellidos),
      ApeMaterno: getApeMaterno(emp.apellidos),
      Nombres: emp.nombres || '',
      NombreCompleto: `${emp.apellidos || ''} ${emp.nombres || ''}`.trim(),
      Nacimiento: formatFecha(emp.fecha_nacimiento),
      Sueldo: emp.sueldo_base ? Number(emp.sueldo_base) : 0,
      TipRiesgo: emp.categoria || '',
      LugarExposicion: emp.unidad || '',
      Sexo: getSexo(emp.sexo),
      'F. Ingreso': formatFecha(emp.fecha_ingreso),
      'Cont. Inicio': formatFecha(emp.contrato_inicio),
      'Cont. Fin': formatFecha(emp.contrato_fin),
      'F. Cese': formatFecha(emp.fecha_cese),
      Situacion: emp._situacion,
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    ws['!cols'] = [
      { wch: 8 },   // TipDoc
      { wch: 12 },  // NumDoc
      { wch: 18 },  // ApePaterno
      { wch: 18 },  // ApeMaterno
      { wch: 20 },  // Nombres
      { wch: 35 },  // NombreCompleto
      { wch: 13 },  // Nacimiento
      { wch: 12 },  // Sueldo
      { wch: 20 },  // TipRiesgo
      { wch: 22 },  // LugarExposicion
      { wch: 6 },   // Sexo
      { wch: 13 },  // F. Ingreso
      { wch: 14 },  // Cont. Inicio
      { wch: 14 },  // Cont. Fin
      { wch: 13 },  // F. Cese
      { wch: 18 },  // Situacion
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trama Vida Ley');
    XLSX.writeFile(wb, 'trama_vida_ley.xlsx');
    toast.success('Trama Vida Ley exportada correctamente');
  };

  const columns = [
    { header: 'TipDoc', render: () => 'DNI', width: '70px' },
    { header: 'NumDoc', accessor: 'dni', width: '110px' },
    { header: 'Ape. Paterno', render: (row) => getApePaterno(row.apellidos), width: '150px' },
    { header: 'Ape. Materno', render: (row) => getApeMaterno(row.apellidos), width: '150px' },
    { header: 'Nombres', accessor: 'nombres', width: '170px' },
    {
      header: 'Nombre Completo',
      render: (row) => `${row.apellidos || ''} ${row.nombres || ''}`.trim(),
    },
    {
      header: 'Nacimiento',
      render: (row) => formatFecha(row.fecha_nacimiento),
      width: '110px',
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
      header: 'Tip. Riesgo',
      accessor: 'categoria',
      width: '160px',
    },
    {
      header: 'Lugar Exposición',
      accessor: 'unidad',
      width: '160px',
    },
    {
      header: 'Sexo',
      render: (row) => getSexo(row.sexo),
      width: '70px',
    },
    {
      header: 'F. Ingreso',
      render: (row) => formatFecha(row.fecha_ingreso),
      width: '105px',
    },
    {
      header: 'Cont. Inicio',
      render: (row) => formatFecha(row.contrato_inicio) || '-',
      width: '105px',
    },
    {
      header: 'Cont. Fin',
      render: (row) => formatFecha(row.contrato_fin) || '-',
      width: '105px',
    },
    {
      header: 'F. Cese',
      render: (row) => formatFecha(row.fecha_cese) || '-',
      width: '105px',
    },
    {
      header: 'Situación',
      accessor: '_situacion',
      render: (row) => {
        const sit = getSituacion(row);
        if (!sit.texto) return <span style={{ color: '#ccc' }}>—</span>;
        if (sit.texto === 'Estable') {
          return (
            <span style={{ color: '#2563eb', fontSize: '0.82rem', fontWeight: 600 }}>
              Estable
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
        <h2>Tramas Vida Ley</h2>
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
          data={empleadosOrdenados}
          searchable
          pageSize={20}
        />
      </div>
    </div>
  );
}

export default TramasVidaLey;
