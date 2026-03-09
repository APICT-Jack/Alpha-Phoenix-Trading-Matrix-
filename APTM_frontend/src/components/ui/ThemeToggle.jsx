import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={() => setDarkMode(!darkMode)}
      aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'var(--color-card)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '1000',
        transition: 'all var(--transition-speed) var(--transition-easing)'
      }}
    >
      {darkMode ? (
        <FaSun size={18} style={{ transition: 'transform 0.3s ease' }} />
      ) : (
        <FaMoon size={18} style={{ transition: 'transform 0.3s ease' }} />
      )}
    </button>
  );
}