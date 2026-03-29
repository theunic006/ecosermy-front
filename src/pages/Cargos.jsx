import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { deleteCargo } from '../services/cargoService';
import { useCatalogos } from '../contexts/CatalogosContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import CargoForm from '../components/cargos/CargoForm';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

function Cargos() {
  const { hasPermission } = useAuth();
  const [modalForm, setModalForm] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const { catalogos, loading, actualizarCargo, recargarCatalogos } = useCatalogos();
  
  // Usar cargos del contexto global (evita duplicar estado y peticiones)
  const cargos = catalogos.cargos;

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este cargo?')) return;
    try {
      // Actualización optimista: eliminar de la UI inmediatamente
      actualizarCargo(id, 'delete');
      toast.success('Cargo eliminado');
      
      // Eliminar en el servidor en segundo plano
      await deleteCargo(id);
    } catch (error) {
      toast.error('Error al eliminar: ' + (error.response?.data?.message || 'No se puede eliminar un cargo con empleados'));
      // Si falla, restaurar catálogos desde el servidor (sin recargar la página)
      recargarCatalogos();
    }
  };

  const handleNew = () => {
    setSelectedCargo(null);
    setModalForm(true);
  };

  const handleEdit = (cargo) => {
    setSelectedCargo(cargo);
    setModalForm(true);
  };

  const handleFormSaved = (cargoGuardado, esNuevo) => {
    // Actualización optimista: actualizar UI inmediatamente
    actualizarCargo(cargoGuardado, esNuevo ? 'create' : 'update');
    setModalForm(false);
  };

  const columns = [
    { 
      header: 'ID', 
      accessor: 'id', 
      width: '80px' 
    },
    {
      header: 'Nombre del Cargo',
      accessor: 'nombre',
    },
    {
      header: 'Descripción',
      accessor: 'descripcion',
      render: (row) => row.descripcion || '-'
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
    ...(hasPermission('cargos.editar') || hasPermission('cargos.eliminar') ? [{
      header: 'Acciones',
      width: '120px',
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
      )
    }] : []),
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Cargos</h1>
          <p className="text-muted">Gestión de cargos de la empresa</p>
        </div>
        {hasPermission('cargos.crear') && (
          <button className="btn btn-primary" onClick={handleNew}>
            <FiPlus size={18} />
            Nuevo Cargo
          </button>
        )}
      </div>

      <div className="card">
        <DataTable 
          columns={columns} 
          data={cargos}
          searchPlaceholder="Buscar por nombre o descripción..."
          emptyMessage="No hay cargos registrados"
        />
      </div>

      {modalForm && (
        <Modal 
          isOpen={modalForm}
          title={selectedCargo ? 'Editar Cargo' : 'Nuevo Cargo'} 
          onClose={() => setModalForm(false)}
        >
          <CargoForm 
            cargo={selectedCargo} 
            onSaved={handleFormSaved} 
            onCancel={() => setModalForm(false)} 
          />
        </Modal>
      )}
    </div>
  );
}

export default Cargos;
