"use client";

import Link from "next/link";

import type { NavItem } from "@/types/navigation";
import { cn } from "@/utils/cn";

interface FeatureLinkProps {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}

export function FeatureLink({ item, active, onClick }: FeatureLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={item.status === "soon" ? false : undefined}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start",
        active
          ? "bg-cta-start text-[color:var(--cta-foreground)]"
          : "text-muted-foreground hover:bg-bg-elevated hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.status === "soon" && (
        <span
          aria-label="Coming soon"
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]",
            active
              ? "bg-bg-elevated text-[color:var(--cta-foreground)]"
              : "bg-bg-elevated text-muted-foreground",
          )}
        >
          Soon
        </span>
      )}
    </Link>
  );
}
