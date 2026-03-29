import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getContratosUnidad, deleteContratoUnidad } from '../services/contratoUnidadService';
import { UNIDADES } from '../utils/constants';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import ContratoUnidadForm from '../components/contratos-unidad/ContratoUnidadForm';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const COLORES_UNIDAD = {
  'OFICINA CENTRAL': '#3b82f6',
  'VOLCAN':          '#10b981',
  'ALPAYANA':        '#f59e0b',
  'CHINALCO':        '#ef4444',
};

function ContratosUnidad() {
  const { hasPermission } = useAuth();
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [modalForm, setModalForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContratosUnidad(filtroUnidad || null);
      setContratos(data);
    } catch {
      toast.error('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  }, [filtroUnidad]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleNew = () => { setSelected(null); setModalForm(true); };
  const handleEdit = (row) => { setSelected(row); setModalForm(true); };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este contrato?')) return;
    try {
      setContratos(prev => prev.filter(c => c.id !== id));
      await deleteContratoUnidad(id);
      toast.success('Contrato eliminado');
    } catch {
      toast.error('Error al eliminar');
      cargar();
    }
  };

  const handleSaved = (saved, esNuevo) => {
    if (esNuevo) {
      setContratos(prev => [saved, ...prev]);
    } else {
      setContratos(prev => prev.map(c => c.id === saved.id ? saved : c));
    }
    setModalForm(false);
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '70px' },
    {
      header: 'Unidad',
      accessor: 'unidad',
      width: '180px',
      render: (row) => (
        <span
          className="badge"
          style={{
            backgroundColor: COLORES_UNIDAD[row.unidad] || '#6b7280',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '12px',
          }}
        >
          {row.unidad}
        </span>
      ),
    },
    {
      header: 'Descripción',
      accessor: 'descripcion',
      render: (row) => (
        <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{row.descripcion}</span>
      ),
    },
    {
      header: 'Fecha',
      accessor: 'created_at',
      width: '120px',
      render: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString('es-PE')
          : '-',
    },
    ...(hasPermission('cargos.editar') || hasPermission('cargos.eliminar')
      ? [{
          header: 'Acciones',
          width: '110px',
          render: (row) => (
            <div className="table-actions">
              {hasPermission('cargos.editar') && (
                <button
                  className="btn-icon-sm"
                  title="Editar"
                  onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                >
                  <FiEdit2 size={14} />
                </button>
              )}
              {hasPermission('cargos.eliminar') && (
                <button
                  className="btn-icon-sm btn-danger"
                  title="Eliminar"
                  onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          ),
        }]
      : []),
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Contratos por Unidad</h1>
          <p className="text-muted">Gestión de contratos asociados a cada unidad operativa</p>
        </div>
        {hasPermission('cargos.crear') && (
          <button className="btn btn-primary" onClick={handleNew}>
            <FiPlus size={18} />
            Nuevo Contrato
          </button>
        )}
      </div>

      {/* Filtro por unidad */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Filtrar por unidad:</span>
          <button
            className={`btn ${!filtroUnidad ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 14px', fontSize: '13px' }}
            onClick={() => setFiltroUnidad('')}
          >
            Todas
          </button>
          {UNIDADES.map(u => (
            <button
              key={u}
              className={`btn ${filtroUnidad === u ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '4px 14px',
                fontSize: '13px',
                borderLeft: `4px solid ${COLORES_UNIDAD[u] || '#6b7280'}`,
              }}
              onClick={() => setFiltroUnidad(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={contratos}
          searchPlaceholder="Buscar por unidad o descripción..."
          emptyMessage="No hay contratos registrados"
        />
      </div>

      {modalForm && (
        <Modal
          isOpen={modalForm}
          title={selected ? 'Editar Contrato' : 'Nuevo Contrato'}
          onClose={() => setModalForm(false)}
        >
          <ContratoUnidadForm
            contrato={selected}
            onSaved={handleSaved}
            onCancel={() => setModalForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}

export default ContratosUnidad;
