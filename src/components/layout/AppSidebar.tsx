"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import type { NavItem } from "@/types/navigation";
import { cn } from "@/utils/cn";

import { FeatureLink } from "./FeatureLink";
import { LogoutButton } from "./LogoutButton";
import { isItemActive, navItems } from "./navItems";

interface AppSidebarProps {
  className?: string;
}

function SidebarSection({
  title,
  items,
  pathname,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-2">
      {title && (
        <p className="px-4 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <FeatureLink
            key={item.href}
            item={item}
            active={isItemActive(pathname, item.href)}
          />
        ))}
      </div>
    </div>
  );
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border bg-[var(--bg-surface)] px-5 py-8 text-foreground shadow-lg md:flex md:flex-col",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className="mb-10 flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cta-start text-[color:var(--cta-foreground)]">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>SheSync+</span>
      </Link>

      <nav
        aria-label="Primary navigation"
        className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1"
      >
        <SidebarSection items={navItems} pathname={pathname} />
      </nav>

      <div className="mt-6 space-y-5">
        <Link
          href="/settings/privacy"
          className="flex min-h-11 items-center justify-center rounded-full bg-cta-start px-4 text-sm font-bold text-[color:var(--cta-foreground)] shadow-[var(--shadow-glow)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
        >
          Privacy Controls
        </Link>

        <div className="border-t border-border pt-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  Sarah J.
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Premium Secure
                </p>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
