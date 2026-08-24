"use client";

import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { getTheme } from "@/lib/storage";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useApp();

  useEffect(() => {
    const initialTheme = getTheme();
    const isDarkMode = initialTheme === "dark";

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state.isDarkMode]);

  return <>{children}</>;
}
