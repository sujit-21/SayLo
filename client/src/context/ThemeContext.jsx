import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('saylo_theme') || 'dark';
  });

  const [wallpaper, setWallpaper] = useState(() => {
    return localStorage.getItem('saylo_wallpaper') || 'doodle';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('saylo_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateWallpaper = (newWallpaper) => {
    setWallpaper(newWallpaper);
    localStorage.setItem('saylo_wallpaper', newWallpaper);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, wallpaper, updateWallpaper }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

