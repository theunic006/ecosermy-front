import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { deleteArea } from '../services/areaService';
import { useCatalogos } from '../contexts/CatalogosContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Loading from '../components/common/Loading';
import AreaForm from '../components/areas/AreaForm';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

function Areas() {
  const { hasPermission } = useAuth();
  const [modalForm, setModalForm] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const { catalogos, loading, actualizarArea, recargarCatalogos } = useCatalogos();
  
  // Usar áreas del contexto global (evita duplicar estado y peticiones)
  const areas = catalogos.areas;

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta área?')) return;
    try {
      // Actualización optimista: eliminar de la UI inmediatamente
      actualizarArea(id, 'delete');
      toast.success('Área eliminada');
      
      // Eliminar en el servidor en segundo plano
      await deleteArea(id);
    } catch (error) {
      toast.error('Error al eliminar: ' + (error.response?.data?.message || 'No se puede eliminar un área con empleados'));
      // Si falla, restaurar catálogos desde el servidor (sin recargar la página)
      recargarCatalogos();
    }
  };

  const handleNew = () => {
    setSelectedArea(null);
    setModalForm(true);
  };

  const handleEdit = (area) => {
    setSelectedArea(area);
    setModalForm(true);
  };

  const handleFormSaved = (areaGuardada, esNueva) => {
    // Actualización optimista: actualizar UI inmediatamente
    actualizarArea(areaGuardada, esNueva ? 'create' : 'update');
    setModalForm(false);
  };

  const columns = [
    { 
      header: 'ID', 
      accessor: 'id', 
      width: '80px' 
    },
    {
      header: 'Nombre del Área',
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
    ...(hasPermission('areas.editar') || hasPermission('areas.eliminar') ? [{
      header: 'Acciones',
      width: '120px',
      render: (row) => (
        <div className="table-actions">
          {hasPermission('areas.editar') && (
            <button 
              className="btn-icon-sm" 
              title="Editar" 
              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            >
              <FiEdit2 size={14} />
            </button>
          )}
          {hasPermission('areas.eliminar') && (
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
        <h2>Gestión de Áreas</h2>
        {hasPermission('areas.crear') && (
          <div className="page-actions">
            <button className="btn-primary" onClick={handleNew}>
              <FiPlus size={16} /> Nueva Área
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={areas}
          searchable
          pageSize={15}
        />
      </div>

      {/* Modal Formulario */}
      <Modal
        isOpen={modalForm}
        onClose={() => setModalForm(false)}
        title={selectedArea ? 'Editar Área' : 'Nueva Área'}
        size="medium"
      >
        <AreaForm
          area={selectedArea}
          onSaved={handleFormSaved}
          onCancel={() => setModalForm(false)}
        />
      </Modal>
    </div>
  );
}

export default Areas;
