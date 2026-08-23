"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { getTheme } from "@/utils/storage";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useApp();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load and apply initial theme immediately to prevent flickering
    const initialTheme = getTheme();
    const isDarkMode = initialTheme === "dark";

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setIsInitialized(true);
  }, []); // Run once on mount

  useEffect(() => {
    // Only apply theme changes after initialization to prevent conflicts
    if (!isInitialized) return;

    if (state.isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state.isDarkMode, isInitialized]);

  // Prevent flash by not rendering until theme is set
  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
}
