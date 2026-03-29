import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import ThemeToggle from '../components/layout/ThemeToggle';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Si ya está autenticado, redirigir según tenga unidad o no
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const destination = user?.unidad?.length > 0 ? '/tareo' : '/';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(email, password);
      toast.success('¡Bienvenido al sistema!');
      // Si el usuario tiene unidad asignada, redirigir a tareo, sino al dashboard
      const destination = userData?.unidad?.length > 0 ? '/tareo' : '/';
      navigate(destination, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      const msg = error.response?.data?.message ||
                  error.response?.data?.errors?.email?.[0] ||
                  'Error al iniciar sesión';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>ECOSERMY</h1>
            <p>Sistema de Gestión de Planillas</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">
                <FiMail size={16} /> Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ecosermy.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <FiLock size={16} /> Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary btn-block"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : (
                <>
                  <FiLogIn size={16} /> Ingresar
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <small>© 2026 ECOSERMY - Todos los derechos reservados</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
