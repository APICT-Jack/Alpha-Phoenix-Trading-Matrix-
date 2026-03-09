/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply theme to body and set CSS variables
    const root = document.documentElement;
    
    if (darkMode) {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      
      // Set dark mode CSS variables
      root.style.setProperty('--color-primary', '#3b82f6');
      root.style.setProperty('--color-primary-dark', '#2563eb');
      root.style.setProperty('--color-bg', '#0f172a');
      root.style.setProperty('--color-card', '#1e293b');
      root.style.setProperty('--color-text', '#f8fafc');
      root.style.setProperty('--color-text-secondary', '#cbd5e1');
      root.style.setProperty('--color-border', '#334155');
      root.style.setProperty('--color-white', '#ffffff');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
      
      // Set light mode CSS variables
      root.style.setProperty('--color-primary', '#2563eb');
      root.style.setProperty('--color-primary-dark', '#1d4ed8');
      root.style.setProperty('--color-bg', '#ffffff');
      root.style.setProperty('--color-card', '#f8fafc');
      root.style.setProperty('--color-text', '#1e293b');
      root.style.setProperty('--color-text-secondary', '#64748b');
      root.style.setProperty('--color-border', '#e2e8f0');
      root.style.setProperty('--color-white', '#ffffff');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}