import { createContext, useState, useCallback, useEffect } from 'react';
import { storage } from '../utils/storage.js';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const theme = storage.getTheme();
    return theme === 'dark';
  });

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const newValue = !prev;
      storage.setTheme(newValue ? 'dark' : 'light');
      return newValue;
    });
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const value = { isDark, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};