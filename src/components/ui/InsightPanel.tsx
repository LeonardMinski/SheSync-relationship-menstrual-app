import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

import { cn } from "@/utils/cn";

interface InsightPanelProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Sage-toned callout for a grounded, logged-data-based observation. Copy
 * passed in here must follow the "You logged... / Possible pattern /
 * Still learning" truth rules — this component only renders it.
 */
export function InsightPanel({
  eyebrow = "Observed pattern",
  title,
  description,
  icon: Icon = Sparkles,
  action,
  className,
}: InsightPanelProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-2xl border-l-4 border-l-[color:var(--accent-sage)] bg-[color:var(--accent-sage-soft)]/40 p-5",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-surface text-[color:var(--accent-sage)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-sage)]">
          {eyebrow}
        </p>
        <p className="font-display text-lg font-bold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  );
}
