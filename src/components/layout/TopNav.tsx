"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Settings as SettingsIcon, Sun } from "lucide-react";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { cn } from "@/utils/cn";

import { LogoutButton } from "./LogoutButton";
import { isItemActive, navItems } from "./navItems";

export function TopNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { state, toggleTheme } = useApp();

  return (
    <header
      className="sticky top-0 z-40 hidden w-full border-b border-border bg-[var(--bg-surface)] md:block"
      data-testid="desktop-top-nav"
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-6">
        <Link
          href="/dashboard"
          className="font-display shrink-0 text-lg font-bold tracking-tight text-foreground"
        >
          SheSync<span className="text-[color:var(--accent-rose)]">+</span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="flex min-w-0 items-center justify-center gap-1"
        >
          {navItems.map((item) => {
            const active = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start",
                  active
                    ? "text-[color:var(--accent-rose)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <PrivacyBadge className="hidden lg:inline-flex" />

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={state.isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-elevated text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
          >
            {state.isDarkMode ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {user && (
            <div className="group relative">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-elevated text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                aria-label={`Account menu for ${user.name}`}
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              <div className="invisible absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-border bg-bg-surface p-2 opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <p className="truncate px-3 py-2 text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <Link
                  href="/settings"
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                >
                  <SettingsIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>Settings</span>
                </Link>
                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
