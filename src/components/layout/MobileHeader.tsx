"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";

export function MobileHeader() {
  const { user } = useAuth();
  const { state, toggleTheme } = useApp();

  return (
    <header
      className="sticky top-0 z-40 flex h-14 w-full items-center justify-between gap-2 border-b border-border bg-[var(--bg-surface)] px-4 md:hidden"
      data-testid="mobile-top-header"
    >
      <Link
        href="/dashboard"
        className="font-display shrink-0 text-base font-bold tracking-tight text-foreground"
      >
        SheSync<span className="text-[color:var(--accent-rose)]">+</span>
      </Link>

      <div className="flex min-w-0 items-center gap-2">
        <PrivacyBadge className="hidden truncate sm:inline-flex" />
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={state.isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
        >
          {state.isDarkMode ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        {user && (
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
          >
            {user.name.charAt(0).toUpperCase()}
          </Link>
        )}
      </div>
    </header>
  );
}
