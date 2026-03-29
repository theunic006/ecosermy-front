import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // false porque usamos Bearer tokens, no cookies
});

// Interceptor para agregar token y evitar caché del navegador en GET
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Forzar al navegador a no cachear respuestas GET (evita datos obsoletos en planilla, tareo, etc.)
  if (config.method === 'get') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
  }

  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response,
  error => {
    // Si el token fue revocado o expiró, limpiar sesión y redirigir al login
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      localStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
