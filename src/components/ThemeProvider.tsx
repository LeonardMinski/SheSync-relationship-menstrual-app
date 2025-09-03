'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getTheme } from '@/lib/storage';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();

  useEffect(() => {
    // Load and apply initial theme immediately (before app initialization)
    const initialTheme = getTheme();
    console.log('🎨 Initial theme loaded:', initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('🌙 Applied dark class to HTML element');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('☀️ Removed dark class from HTML element');
    }
  }, []); // Run once on mount

  useEffect(() => {
    // Apply theme changes from app state
    console.log('🔄 Theme state changed:', state.isDarkMode);
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
      console.log('🌙 Applied dark class to HTML element (from state)');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('☀️ Removed dark class from HTML element (from state)');
    }
  }, [state.isDarkMode]);

  return <>{children}</>;
}
