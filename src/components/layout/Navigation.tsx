"use client";

import { Heart } from "lucide-react";

import { useApp } from "@/context/AppContext";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { UserMenu } from "@/components/navigation/UserMenu";

export default function Navigation() {
  const { state, toggleTheme } = useApp();
  const { isDarkMode } = state;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-[var(--bg-surface)] shadow-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-gradient)] shadow-sm">
              <Heart className="h-4 w-4 text-white" />
            </div>

            <span className="text-lg font-semibold tracking-tight text-foreground">
              SheSync+
            </span>
          </div>

          <UserMenu isDarkMode={isDarkMode} onThemeToggle={toggleTheme} />
        </div>
      </header>

      <MobileNavigation />
    </>
  );
}
