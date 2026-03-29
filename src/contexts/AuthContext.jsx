import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      // Solo hacer logout si el token es inválido (401), no por otros errores
      if (error.response?.status === 401) {
        logout();
      } else {
        // Si es error de red, no hacer logout, mantener sesión
        setLoading(false);
      }
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/login', { email, password });
    const { user: userData, token: authToken } = response.data;
    
    // Actualizar axios con el nuevo token
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    localStorage.setItem('auth_token', authToken);
    
    setUser(userData);
    setToken(authToken);
    setLoading(false);
    return userData;
  };

  const logout = () => {
    if (token) {
      api.post('/logout').catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.roles?.includes('Administrador')) return true;
    return user.permissions?.includes(permission);
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.roles?.includes(role);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout,
      hasPermission, hasRole,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
