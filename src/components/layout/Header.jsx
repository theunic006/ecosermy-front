import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import { FiMenu, FiLogOut, FiUser } from 'react-icons/fi';

function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          <FiMenu size={22} />
        </button>
        <div className="header-brand">
          <h1>ECOSERMY</h1>
          <span className="header-subtitle">Sistema de Planillas</span>
        </div>
      </div>

      <div className="header-right">
        <ThemeToggle />
        <div className="header-user">
          <FiUser size={18} />
          <span>{user?.name || 'Usuario'}</span>
        </div>
        <button className="btn-icon" onClick={logout} title="Cerrar sesión">
          <FiLogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;
