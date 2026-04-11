import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FiDollarSign, FiSearch, FiX, FiFilter, FiDownload, FiEdit3 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getSueldosPeriodo, updateSueldoPeriodo } from '../services/sueldosPeriodoService';
import { MESES } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/common/Loading';
import '../styles/sueldos-periodo.css';

function SueldosPeriodo() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [planillas, setPlanillas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterUnidad, setFilterUnidad] = useState('');
  const [editingCell, setEditingCell] = useState(null); // { empleadoId, mes }
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const inputRef = useRef(null);
  // Guardamos el valor más reciente en un ref para usarlo de forma segura en onBlur/async
  const editValueRef = useRef('');
  const canEdit = hasPermission('planilla.editar');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSueldosPeriodo(anio);
      setPlanillas(data.planillas || []);
      setEmpleados(data.empleados || []);
    } catch (err) {
      toast.error('Error al cargar los sueldos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [anio]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Focus input al entrar en edición
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Áreas y unidades únicas para filtros
  const areas = useMemo(() => [...new Set(empleados.map(e => e.area))].filter(Boolean).sort(), [empleados]);
  const unidades = useMemo(() => [...new Set(empleados.map(e => e.unidad))].filter(Boolean).sort(), [empleados]);

  // Filtrado — con null-safety para evitar crash si nombre/dni son null
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return empleados.filter(emp => {
      const nombre = (emp.nombre_completo || '').toLowerCase();
      const dni    = (emp.dni || '').toLowerCase();
      const matchSearch = !term || nombre.includes(term) || dni.includes(term);
      const matchArea    = !filterArea    || emp.area    === filterArea;
      const matchUnidad  = !filterUnidad  || emp.unidad  === filterUnidad;
      return matchSearch && matchArea && matchUnidad;
    });
  }, [empleados, search, filterArea, filterUnidad]);

  const handleDoubleClick = (empleadoId, mes, sueldoActual, estado, detalleId) => {
    if (!canEdit) return;
    if (estado === 'PAGADO') {
      toast.warning('No se puede editar una planilla PAGADA');
      return;
    }
    if (!detalleId) {
      toast.warning('No existe detalle de planilla para este periodo');
      return;
    }
    const val = sueldoActual?.toString() || '0';
    editValueRef.current = val;
    setEditValue(val);
    setEditingCell({ empleadoId, mes });
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
    editValueRef.current = '';
  };

  const handleSave = useCallback(async (empleadoId, mes) => {
    // Usamos el ref para tener el valor más actualizado sin importar el closure
    const nuevoSueldo = parseFloat(editValueRef.current);
    if (isNaN(nuevoSueldo) || nuevoSueldo < 0) {
      toast.error('Ingrese un sueldo válido');
      return;
    }

    setEmpleados(prev => {
      const emp = prev.find(e => e.empleado_id === empleadoId);
      const sueldo = emp?.sueldos?.find(s => s.mes === mes);
      if (!sueldo?.detalle_id) return prev; // sin detalle_id, no hacemos nada

      const sueldoAnterior = parseFloat(sueldo.sueldo_base);
      if (sueldoAnterior === nuevoSueldo) return prev; // sin cambio

      // Lanzar la actualización en segundo plano
      setSaving(true);
      updateSueldoPeriodo(sueldo.detalle_id, nuevoSueldo)
        .then(() => {
          setEmpleados(current => current.map(e => {
            if (e.empleado_id !== empleadoId) return e;
            return {
              ...e,
              sueldos: e.sueldos.map(s =>
                s.mes === mes ? { ...s, sueldo_base: nuevoSueldo.toFixed(2) } : s
              ),
            };
          }));
          setCambiosPendientes(c => ({ ...c, [`${empleadoId}-${mes}`]: true }));
          toast.success(`Sueldo actualizado: S/ ${nuevoSueldo.toFixed(2)}`);
        })
        .catch(err => {
          toast.error('Error al guardar: ' + (err.response?.data?.message || err.message));
        })
        .finally(() => setSaving(false));

      return prev; // la actualización real la hace el then()
    });

    handleCancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e, empleadoId, mes) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(empleadoId, mes);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const formatSueldo = (val) => {
    if (val === null || val === undefined) return '-';
    return parseFloat(val).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getEstadoBadge = (estado) => {
    const colors = {
      'BORRADOR': { bg: '#fef3c7', color: '#92400e' },
      'CALCULADO': { bg: '#dbeafe', color: '#1e40af' },
      'APROBADO': { bg: '#d1fae5', color: '#065f46' },
      'PAGADO': { bg: '#e0e7ff', color: '#3730a3' },
    };
    const style = colors[estado] || { bg: '#f3f4f6', color: '#374151' };
    return <span className="sp-badge" style={{ background: style.bg, color: style.color }}>{estado}</span>;
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const header = ['DNI', 'Nombre Completo', 'Área', 'Cargo', 'Unidad',
      ...planillas.map(p => `${MESES[p.mes - 1]} ${p.anio}`),
      'Sueldo Actual'
    ];
    const rows = filtered.map(emp => [
      emp.dni,
      emp.nombre_completo,
      emp.area,
      emp.cargo,
      emp.unidad,
      ...planillas.map(p => {
        const s = emp.sueldos?.find(s => s.mes === p.mes);
        return s?.sueldo_base ?? '';
      }),
      emp.sueldo_actual,
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sueldos_periodo_${anio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  return (
    <div className="sp-container">
      {/* Header */}
      <div className="sp-header">
        <div className="sp-header-left">
          <FiDollarSign size={24} />
          <h2>Sueldos por Periodo</h2>
          <select value={anio} onChange={e => setAnio(parseInt(e.target.value))} className="sp-select-anio">
            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="sp-header-right">
          <span className="sp-count">{filtered.length} empleados</span>
          <button className="sp-btn sp-btn-export" onClick={exportCSV} title="Exportar CSV">
            <FiDownload size={16} /> CSV
          </button>
        </div>
      </div>

      {/* Info */}
      {canEdit && (
        <div className="sp-info-bar">
          <FiEdit3 size={14} />
          <span>Doble clic en una celda de sueldo para editarla. Enter para guardar, Escape para cancelar.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="sp-filters">
        <div className="sp-search-box">
          <FiSearch size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <FiX className="sp-clear" onClick={() => setSearch('')} />}
        </div>
        <div className="sp-filter-group">
          <FiFilter size={14} />
          <select value={filterUnidad} onChange={e => setFilterUnidad(e.target.value)}>
            <option value="">Todas las unidades</option>
            {unidades.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)}>
            <option value="">Todas las áreas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="sp-estado-leyenda">
        {planillas.map(p => (
          <div key={p.id} className="sp-estado-item">
            <strong>{MESES[p.mes - 1]}:</strong> {getEstadoBadge(p.estado)}
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="sp-table-wrapper">
        <table className="sp-table">
          <thead>
            <tr>
              <th className="sp-th-fixed sp-th-num">#</th>
              <th className="sp-th-fixed sp-th-dni">DNI</th>
              <th className="sp-th-fixed sp-th-nombre">Nombre Completo</th>
              <th>Área</th>
              <th>Cargo</th>
              {planillas.map(p => (
                <th key={p.id} className="sp-th-sueldo">
                  {MESES[p.mes - 1]}<br />
                  <small>{p.anio}</small>
                </th>
              ))}
              <th className="sp-th-sueldo sp-th-actual">
                Sueldo<br /><small>Actual</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6 + planillas.length} className="sp-empty">No se encontraron empleados</td></tr>
            ) : (
              filtered.map((emp, idx) => (
                <tr key={emp.empleado_id}>
                  <td className="sp-td-num">{idx + 1}</td>
                  <td className="sp-td-dni">{emp.dni}</td>
                  <td className="sp-td-nombre" title={emp.nombre_completo}>{emp.nombre_completo}</td>
                  <td className="sp-td-area">{emp.area}</td>
                  <td className="sp-td-cargo">{emp.cargo}</td>
                  {planillas.map(p => {
                    const sueldo = emp.sueldos?.find(s => s.mes === p.mes);
                    const isEditing = editingCell?.empleadoId === emp.empleado_id && editingCell?.mes === p.mes;
                    const wasChanged = cambiosPendientes[`${emp.empleado_id}-${p.mes}`];
                    
                    return (
                      <td
                        key={p.id}
                        className={`sp-td-sueldo ${canEdit && sueldo?.detalle_id ? 'sp-editable' : ''} ${wasChanged ? 'sp-changed' : ''} ${isEditing ? 'sp-editing' : ''}`}
                        onDoubleClick={() => handleDoubleClick(emp.empleado_id, p.mes, sueldo?.sueldo_base, p.estado, sueldo?.detalle_id)}
                      >
                        {isEditing ? (
                          <div className="sp-edit-cell">
                            <input
                              ref={inputRef}
                              type="number"
                              step="0.01"
                              min="0"
                              value={editValue}
                              onChange={e => {
                                editValueRef.current = e.target.value;
                                setEditValue(e.target.value);
                              }}
                              onKeyDown={e => handleKeyDown(e, emp.empleado_id, p.mes)}
                              onBlur={() => handleSave(emp.empleado_id, p.mes)}
                              disabled={saving}
                              className="sp-input-sueldo"
                            />
                          </div>
                        ) : (
                          <span className="sp-sueldo-value">{formatSueldo(sueldo?.sueldo_base)}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="sp-td-sueldo sp-td-actual">
                    <strong>{formatSueldo(emp.sueldo_actual)}</strong>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SueldosPeriodo;
