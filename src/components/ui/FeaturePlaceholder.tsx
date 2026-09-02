import React from "react";
import { Construction } from "lucide-react";

import { cn } from "@/utils/cn";

/**
 * Marks a screen or section that is designed and rendered from the approved
 * UI, but is NOT wired to a real backend/service yet. Never render fabricated
 * "live" data next to this — the whole point is to make the gap visible in
 * both the UI and the source (grep-able: <FeaturePlaceholder).
 */
interface FeaturePlaceholderProps {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export function FeaturePlaceholder({
  title,
  description,
  className,
  children,
}: FeaturePlaceholderProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[color:var(--warning)]/40 bg-[color:var(--warning)]/5 p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-surface text-[color:var(--warning)]">
          <Construction className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
