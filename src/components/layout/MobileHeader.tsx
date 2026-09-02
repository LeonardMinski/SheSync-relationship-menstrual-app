"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export function MobileHeader() {
  const { user } = useAuth();

  return (
    <header
      className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-[var(--bg-surface)] px-4 md:hidden"
      data-testid="mobile-top-header"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cta-start text-[color:var(--cta-foreground)]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        SheSync+
      </Link>

      {user && (
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-elevated text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
        >
          {user.name.charAt(0).toUpperCase()}
        </Link>
      )}
    </header>
  );
}
