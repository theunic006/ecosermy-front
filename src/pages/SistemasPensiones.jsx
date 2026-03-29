import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getSistemasPensiones, deleteSistemaPension } from '../services/sistemaPensionService';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import SistemaPensionForm from '../components/sistemas-pensiones/SistemaPensionForm';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

function SistemasPensiones() {
  const { hasPermission } = useAuth();
  const [modalForm, setModalForm] = useState(false);
  const [selectedSistemaPension, setSelectedSistemaPension] = useState(null);
  const [sistemasPensiones, setSistemasPensiones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSistemasPensiones();
  }, []);

  const cargarSistemasPensiones = async () => {
    try {
      setLoading(true);
      const data = await getSistemasPensiones();
      setSistemasPensiones(data);
    } catch (error) {
      toast.error('Error al cargar sistemas de pensiones');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este sistema de pensión?')) return;
    try {
      // Actualización optimista
      setSistemasPensiones(prev => prev.filter(s => s.id !== id));
      toast.success('Sistema de pensión eliminado');
      await deleteSistemaPension(id);
    } catch (error) {
      toast.error('Error al eliminar');
      cargarSistemasPensiones();
    }
  };

  const handleNew = () => {
    setSelectedSistemaPension(null);
    setModalForm(true);
  };

  const handleEdit = (sistemaPension) => {
    setSelectedSistemaPension(sistemaPension);
    setModalForm(true);
  };

  const handleFormSaved = (sistemaPensionGuardado, esNuevo) => {
    if (esNuevo) {
      setSistemasPensiones(prev => [sistemaPensionGuardado, ...prev]);
    } else {
      setSistemasPensiones(prev => prev.map(s => 
        s.id === sistemaPensionGuardado.id ? sistemaPensionGuardado : s
      ));
    }
    setModalForm(false);
  };

  const columns = [
    { 
      header: 'ID', 
      accessor: 'id', 
      width: '80px' 
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      render: (row) => (
        <span className={`badge ${row.tipo === 'AFP' ? 'badge-info' : 'badge-warning'}`}>
          {row.tipo}
        </span>
      ),
      width: '100px'
    },
    {
      header: 'Nombre',
      accessor: 'nombre',
    },
    {
      header: 'Aporte',
      accessor: 'aporte',
      render: (row) => `${row.aporte || 0}%`,
      width: '100px'
    },
    {
      header: 'Comisión',
      accessor: 'comision',
      render: (row) => `${row.comision || 0}%`,
      width: '100px'
    },
    {
      header: 'Seguro',
      accessor: 'seguro',
      render: (row) => `${row.seguro || 0}%`,
      width: '100px'
    },
    {
      header: 'Suma',
      render: (row) => {
        const suma = parseFloat(row.aporte || 0) + parseFloat(row.comision || 0) + parseFloat(row.seguro || 0);
        return <strong>{suma.toFixed(2)}%</strong>;
      },
      width: '100px'
    },
    {
      header: 'Estado',
      accessor: 'activo',
      render: (row) => (
        <span className={`badge ${row.activo ? 'badge-success' : 'badge-danger'}`}>
          {row.activo ? 'ACTIVO' : 'INACTIVO'}
        </span>
      ),
      width: '100px'
    },
    ...(hasPermission('pensiones.editar') ? [{
      header: 'Acciones',
      width: '120px',
      render: (row) => (
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
      )
    }] : []),
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Sistemas de Pensiones</h1>
          <p className="text-muted">Gestión de sistemas de pensiones (AFP y ONP)</p>
        </div>
        {hasPermission('pensiones.editar') && (
          <button className="btn btn-primary" onClick={handleNew}>
            <FiPlus size={18} />
            Nuevo Sistema
          </button>
        )}
      </div>

      <div className="card">
        <DataTable 
          columns={columns} 
          data={sistemasPensiones}
          searchPlaceholder="Buscar por nombre o tipo..."
          emptyMessage="No hay sistemas de pensiones registrados"
        />
      </div>

      {modalForm && (
        <Modal 
          isOpen={modalForm}
          title={selectedSistemaPension ? 'Editar Sistema de Pensión' : 'Nuevo Sistema de Pensión'} 
          onClose={() => setModalForm(false)}
        >
          <SistemaPensionForm 
            sistemaPension={selectedSistemaPension} 
            onSaved={handleFormSaved} 
            onCancel={() => setModalForm(false)} 
          />
        </Modal>
      )}
    </div>
  );
}

export default SistemasPensiones;
