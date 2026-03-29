import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiHash, FiSave, FiX } from 'react-icons/fi';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

function UIT() {
  const { hasPermission } = useAuth();
  const [uits, setUits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ anio: '', uit: '', base_legal: '' });
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ anio: '', uit: '', base_legal: '' });

  useEffect(() => {
    cargarUits();
  }, []);

  const cargarUits = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/uit');
      setUits(data);
    } catch (error) {
      toast.error('Error al cargar valores de UIT');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setEditForm({ anio: row.anio, uit: row.uit, base_legal: row.base_legal || '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ anio: '', uit: '', base_legal: '' });
  };

  const handleSaveEdit = async () => {
    try {
      const { data } = await api.put(`/uit/${editingId}`, editForm);
      setUits(prev => prev.map(u => u.id === editingId ? { ...u, ...data } : u));
      setEditingId(null);
      toast.success('UIT actualizada correctamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este registro de UIT?')) return;
    try {
      await api.delete(`/uit/${id}`);
      setUits(prev => prev.filter(u => u.id !== id));
      toast.success('Registro eliminado');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleNewSave = async () => {
    if (!newForm.anio || !newForm.uit) {
      toast.error('Año y valor de UIT son obligatorios');
      return;
    }
    try {
      const { data } = await api.post('/uit', newForm);
      setUits(prev => [data, ...prev].sort((a, b) => b.anio - a.anio));
      setShowNew(false);
      setNewForm({ anio: '', uit: '', base_legal: '' });
      toast.success('UIT registrada correctamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const formatMoney = (val) => {
    return parseFloat(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const columns = [
    {
      header: 'Año',
      accessor: 'anio',
      width: '100px',
      render: (row) => {
        if (editingId === row.id) {
          return (
            <input
              type="number"
              className="form-control"
              value={editForm.anio}
              onChange={(e) => setEditForm(prev => ({ ...prev, anio: e.target.value }))}
              style={{ width: '90px', padding: '4px 8px', fontSize: '14px' }}
            />
          );
        }
        return <strong style={{ fontSize: '15px' }}>{row.anio}</strong>;
      }
    },
    {
      header: 'Valor (S/.)',
      accessor: 'uit',
      width: '150px',
      render: (row) => {
        if (editingId === row.id) {
          return (
            <input
              type="number"
              className="form-control"
              value={editForm.uit}
              onChange={(e) => setEditForm(prev => ({ ...prev, uit: e.target.value }))}
              step="0.01"
              style={{ width: '130px', padding: '4px 8px', fontSize: '14px' }}
            />
          );
        }
        return (
          <span style={{ fontWeight: '600', color: '#059669', fontSize: '15px' }}>
            S/. {formatMoney(row.uit)}
          </span>
        );
      }
    },
    {
      header: 'Base Legal',
      accessor: 'base_legal',
      render: (row) => {
        if (editingId === row.id) {
          return (
            <input
              type="text"
              className="form-control"
              value={editForm.base_legal}
              onChange={(e) => setEditForm(prev => ({ ...prev, base_legal: e.target.value }))}
              placeholder="Ej: D.S. N° 301-2025-EF"
              style={{ padding: '4px 8px', fontSize: '14px' }}
            />
          );
        }
        return <span style={{ color: '#475569' }}>{row.base_legal || '—'}</span>;
      }
    },
    {
      header: 'Deducción 7 UIT',
      width: '150px',
      render: (row) => {
        const deduccion = parseFloat(row.uit) * 7;
        return (
          <span style={{ color: '#7c3aed', fontWeight: '500' }}>
            S/. {formatMoney(deduccion)}
          </span>
        );
      }
    },
    ...(hasPermission('uit.editar') ? [{
      header: 'Acciones',
      width: '120px',
      render: (row) => {
        if (editingId === row.id) {
          return (
            <div className="table-actions">
              <button
                className="btn-icon-sm"
                title="Guardar"
                onClick={handleSaveEdit}
                style={{ color: '#059669' }}
              >
                <FiSave size={16} />
              </button>
              <button
                className="btn-icon-sm"
                title="Cancelar"
                onClick={handleCancelEdit}
                style={{ color: '#94a3b8' }}
              >
                <FiX size={16} />
              </button>
            </div>
          );
        }
        return (
          <div className="table-actions">
            <button
              className="btn-icon-sm"
              title="Editar"
              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            >
              <FiEdit2 size={14} />
            </button>
            <button
              className="btn-icon-sm btn-danger"
              title="Eliminar"
              onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        );
      }
    }] : []),
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiHash /> Unidad Impositiva Tributaria (UIT)
          </h1>
          <p className="text-muted">
            Valores de la UIT por año fiscal — Se usa para el cálculo de la retención de 5ta Categoría
          </p>
        </div>
        {hasPermission('uit.editar') && (
          <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
            <FiPlus size={18} />
            Nuevo Año
          </button>
        )}
      </div>

      {/* Formulario inline para nuevo registro */}
      {showNew && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <h4 style={{ marginBottom: '16px' }}>Agregar nuevo valor de UIT</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 160px 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label className="form-label">Año *</label>
              <input
                type="number"
                className="form-control"
                value={newForm.anio}
                onChange={(e) => setNewForm(prev => ({ ...prev, anio: e.target.value }))}
                placeholder="2027"
                min="2000"
                max="2099"
              />
            </div>
            <div>
              <label className="form-label">Valor UIT (S/.) *</label>
              <input
                type="number"
                className="form-control"
                value={newForm.uit}
                onChange={(e) => setNewForm(prev => ({ ...prev, uit: e.target.value }))}
                placeholder="5500"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="form-label">Base Legal</label>
              <input
                type="text"
                className="form-control"
                value={newForm.base_legal}
                onChange={(e) => setNewForm(prev => ({ ...prev, base_legal: e.target.value }))}
                placeholder="Ej: D.S. N° 301-2025-EF"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={handleNewSave}>
                <FiSave size={16} /> Guardar
              </button>
              <button className="btn btn-secondary" onClick={() => { setShowNew(false); setNewForm({ anio: '', uit: '', base_legal: '' }); }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
        {uits.slice(0, 3).map(u => (
          <div key={u.id} className="card" style={{
            padding: '20px',
            textAlign: 'center',
            background: u.anio === new Date().getFullYear()
              ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
              : '#f8fafc',
            color: u.anio === new Date().getFullYear() ? 'white' : 'inherit',
          }}>
            <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: 4 }}>UIT {u.anio}</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '4px 0' }}>
              S/. {formatMoney(u.uit)}
            </h2>
            <p style={{ fontSize: '12px', opacity: 0.7 }}>{u.base_legal || ''}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={uits}
          searchPlaceholder="Buscar por año o base legal..."
          emptyMessage="No hay valores de UIT registrados"
        />
      </div>
    </div>
  );
}

export default UIT;
