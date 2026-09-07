import React from "react";

import { cn } from "@/utils/cn";

type PillTone = "sage" | "muted" | "warning" | "amber" | "rose" | "error" | "purple";

interface StatusPillProps {
  tone: PillTone;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<PillTone, string> = {
  sage: "bg-[color:var(--accent-sage-soft)] text-[color:var(--accent-sage)]",
  muted: "bg-bg-elevated text-muted-foreground",
  warning: "bg-[color:var(--accent-amber-soft)] text-[color:var(--accent-amber)]",
  amber: "bg-[color:var(--accent-amber-soft)] text-[color:var(--accent-amber)]",
  rose: "bg-[color:var(--accent-rose)]/12 text-[color:var(--accent-rose)]",
  error: "bg-[color:var(--error)]/10 text-[color:var(--error)]",
  purple: "bg-[color:var(--accent-purple-soft)] text-[color:var(--accent-purple)]",
};

export function StatusPill({ tone, children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
