"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { canUseTracking } from "@/features/account/capabilities";
import { cn } from "@/utils/cn";

import { getVisibleNavItems, isItemActive } from "./navItems";

export function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleNavItems = getVisibleNavItems(canUseTracking(user));

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-[var(--bg-surface)] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden"
      data-testid="mobile-bottom-nav"
    >
      {visibleNavItems.map((item) => {
        const active = isItemActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start focus-visible:ring-inset",
              active ? "text-cta-end" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
