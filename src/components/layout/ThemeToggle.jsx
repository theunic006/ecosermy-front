import { useTheme } from '../../hooks/useTheme';
import { FiMoon, FiSun } from 'react-icons/fi';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn-icon theme-toggle"
      aria-label="Cambiar tema"
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
    >
      {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
    </button>
  );
}

export default ThemeToggle;
