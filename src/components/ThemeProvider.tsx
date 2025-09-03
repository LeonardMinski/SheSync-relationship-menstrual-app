'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();

  useEffect(() => {
    // Apply dark mode class to HTML element
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  return <>{children}</>;
}
