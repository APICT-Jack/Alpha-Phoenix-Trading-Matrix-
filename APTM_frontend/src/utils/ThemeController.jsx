import { FaMoon, FaSun } from 'react-icons/fa';
import './ThemeController.css';

const ThemeController = ({ theme, toggleTheme }) => {
  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === 'dark' ? <FaSun /> : <FaMoon />}
    </button>
  );
};

export default ThemeController;