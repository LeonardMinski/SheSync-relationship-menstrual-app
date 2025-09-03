'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getTheme } from '@/lib/storage';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();

  useEffect(() => {
    // Load and apply initial theme immediately (before app initialization)
    const initialTheme = getTheme();
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); // Run once on mount

  useEffect(() => {
    // Apply theme changes from app state
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  return <>{children}</>;
}
