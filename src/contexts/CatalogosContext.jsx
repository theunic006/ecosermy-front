import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

const CatalogosContext = createContext();

export const useCatalogos = () => {
  const context = useContext(CatalogosContext);
  if (!context) {
    throw new Error('useCatalogos debe ser usado dentro de CatalogosProvider');
  }
  return context;
};

export const CatalogosProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const [catalogos, setCatalogos] = useState({
    areas: [],
    cargos: [],
    turnos: [],
    afps: [],
    sistemasPensiones: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Solo cargar catálogos cuando el usuario esté autenticado
  useEffect(() => {
    if (authLoading) return; // Esperar a que auth termine
    if (isAuthenticated) {
      cargarCatalogos();
    } else {
      // Si no está autenticado, limpiar catálogos y no hacer loading
      setCatalogos({ areas: [], cargos: [], turnos: [], afps: [], sistemasPensiones: [] });
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const cargarCatalogos = async () => {
    try {
      setLoading(true);
      const [areas, cargos, turnos, afps, sistemasPensiones] = await Promise.all([
        api.get('/catalogos/areas').then(r => r.data),
        api.get('/catalogos/cargos').then(r => r.data),
        api.get('/catalogos/turnos').then(r => r.data),
        api.get('/catalogos/afps').then(r => r.data),
        api.get('/catalogos/sistemas-pensiones').then(r => r.data),
      ]);
      setCatalogos({ areas, cargos, turnos, afps, sistemasPensiones });
      setError(null);
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const recargarCatalogos = () => {
    if (isAuthenticated) {
      cargarCatalogos();
    }
  };

  // Funciones de actualización optimista (sin recargar del servidor)
  const actualizarArea = (areaModificada, operacion = 'update') => {
    setCatalogos(prev => {
      let nuevasAreas = [...prev.areas];
      
      if (operacion === 'create') {
        // Agregar nueva área al inicio
        nuevasAreas.unshift(areaModificada);
      } else if (operacion === 'update') {
        // Actualizar área existente
        const index = nuevasAreas.findIndex(a => a.id === areaModificada.id);
        if (index !== -1) {
          nuevasAreas[index] = areaModificada;
        }
      } else if (operacion === 'delete') {
        // Eliminar área
        nuevasAreas = nuevasAreas.filter(a => a.id !== areaModificada);
      }
      
      return { ...prev, areas: nuevasAreas };
    });
  };

  const actualizarCargo = (cargoModificado, operacion = 'update') => {
    setCatalogos(prev => {
      let nuevosCargos = [...prev.cargos];
      
      if (operacion === 'create') {
        // Agregar nuevo cargo al inicio
        nuevosCargos.unshift(cargoModificado);
      } else if (operacion === 'update') {
        // Actualizar cargo existente
        const index = nuevosCargos.findIndex(c => c.id === cargoModificado.id);
        if (index !== -1) {
          nuevosCargos[index] = cargoModificado;
        }
      } else if (operacion === 'delete') {
        // Eliminar cargo
        nuevosCargos = nuevosCargos.filter(c => c.id !== cargoModificado);
      }
      
      return { ...prev, cargos: nuevosCargos };
    });
  };

  return (
    <CatalogosContext.Provider value={{
      catalogos,
      loading: loading && isAuthenticated,
      error,
      recargarCatalogos,
      actualizarArea,
      actualizarCargo
    }}>
      {children}
    </CatalogosContext.Provider>
  );
};
