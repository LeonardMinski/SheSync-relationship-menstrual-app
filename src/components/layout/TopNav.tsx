"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings as SettingsIcon, ShieldCheck } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/utils/cn";

import { LogoutButton } from "./LogoutButton";
import { isItemActive, navItems } from "./navItems";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  return (
    <header
      className="sticky top-0 z-40 hidden w-full border-b border-border bg-[var(--bg-surface)] md:block"
      data-testid="desktop-top-nav"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cta-start text-[color:var(--cta-foreground)]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          SheSync+
        </Link>

        <nav aria-label="Primary navigation" className="flex min-w-0 flex-1 items-center gap-1">
          {navItems.map((item) => {
            const active = isItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start",
                  active
                    ? "bg-bg-elevated text-foreground"
                    : "text-muted-foreground hover:bg-bg-elevated hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/cycle")}
            className="btn-cta px-4 py-2 text-sm"
          >
            Log Today
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
