import { useState } from 'react';
import { FiDownload, FiFileText, FiFile } from 'react-icons/fi';
import api from '../services/api';
import { getMesNombre } from '../utils/helpers';
import { toast } from 'react-toastify';

function Reportes() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [loading, setLoading] = useState({});

  const handleDownload = async (tipo) => {
    setLoading(prev => ({ ...prev, [tipo]: true }));
    try {
      let url = '';
      let filename = '';

      switch (tipo) {
        case 'tareo':
          url = `/reportes/excel/tareo/${mes}/${anio}`;
          filename = `Tareo_${getMesNombre(mes)}_${anio}.xlsx`;
          break;
        case 'planilla':
          url = `/reportes/excel/planilla/${mes}/${anio}`;
          filename = `Planilla_${getMesNombre(mes)}_${anio}.xlsx`;
          break;
        case 'planilla_pdf':
          url = `/reportes/pdf/planilla/${mes}/${anio}`;
          filename = `Planilla_${getMesNombre(mes)}_${anio}.pdf`;
          break;
        case 'cesados':
          url = `/reportes/cesados/${mes}/${anio}`;
          filename = `Cesados_${anio}.xlsx`;
          break;
        case 'plame':
          url = `/reportes/plame/${mes}/${anio}`;
          filename = `PLAME_${getMesNombre(mes)}_${anio}.txt`;
          break;
        default:
          return;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`${filename} descargado`);
    } catch (error) {
      toast.error('Error al generar reporte');
    } finally {
      setLoading(prev => ({ ...prev, [tipo]: false }));
    }
  };

  const reportes = [
    {
      id: 'tareo',
      titulo: 'Reporte de Tareo',
      descripcion: 'Exporta el tareo mensual de todos los empleados en formato Excel. Incluye días trabajados, descansos, faltas e incidencias.',
      icon: <FiFileText size={32} />,
      color: '#10b981',
      formato: 'Excel (.xlsx)',
    },
    {
      id: 'planilla',
      titulo: 'Planilla de Remuneraciones',
      descripcion: 'Exporta la planilla completa con ingresos, descuentos, aportes del empleador y neto a pagar de cada empleado.',
      icon: <FiFile size={32} />,
      color: '#3b82f6',
      formato: 'Excel (.xlsx)',
    },
    {
      id: 'planilla_pdf',
      titulo: 'Planilla en PDF',
      descripcion: 'Genera la planilla de remuneraciones en formato PDF para impresión y archivo.',
      icon: <FiFileText size={32} />,
      color: '#ef4444',
      formato: 'PDF',
    },
    {
      id: 'cesados',
      titulo: 'Reporte de Cesados',
      descripcion: 'Lista todos los empleados cesados durante el año seleccionado, con fechas de ingreso y cese, motivo y liquidación.',
      icon: <FiFile size={32} />,
      color: '#f59e0b',
      formato: 'Excel (.xlsx)',
    },
    {
      id: 'plame',
      titulo: 'Exportar PLAME',
      descripcion: 'Genera el archivo para declaración PLAME - SUNAT. Incluye la información de remuneraciones y retenciones en formato TXT.',
      icon: <FiFileText size={32} />,
      color: '#8b5cf6',
      formato: 'TXT',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Reportes</h2>
      </div>

      {/* Filtros período */}
      <div className="card reportes-filtros">
        <h4>Período</h4>
        <div className="reportes-filtros-controls">
          <div className="form-group">
            <label>Mes</label>
            <select className="form-select" value={mes} onChange={(e) => setMes(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{getMesNombre(i + 1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Año</label>
            <input type="number" className="form-input" value={anio}
              onChange={(e) => setAnio(parseInt(e.target.value))} min="2020" max="2030" />
          </div>
        </div>
      </div>

      {/* Cards de reportes */}
      <div className="reportes-grid">
        {reportes.map(reporte => (
          <div key={reporte.id} className="card reporte-card">
            <div className="reporte-icon" style={{ color: reporte.color }}>
              {reporte.icon}
            </div>
            <div className="reporte-info">
              <h4>{reporte.titulo}</h4>
              <p>{reporte.descripcion}</p>
              <span className="reporte-formato">{reporte.formato}</span>
            </div>
            <button
              className="btn-primary"
              onClick={() => handleDownload(reporte.id)}
              disabled={loading[reporte.id]}
            >
              <FiDownload size={16} />
              {loading[reporte.id] ? 'Generando...' : 'Descargar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reportes;
