import React from "react";

import { cn } from "@/utils/cn";

type PillTone = "sage" | "muted" | "warning" | "error";

interface StatusPillProps {
  tone: PillTone;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<PillTone, string> = {
  sage: "bg-[color:var(--accent-sage-soft)]/40 text-[color:var(--accent-sage)] border-[color:var(--accent-sage)]/30",
  muted: "bg-bg-elevated text-muted-foreground border-border",
  warning: "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  error: "bg-[color:var(--error)]/10 text-[color:var(--error)] border-[color:var(--error)]/30",
};

export function StatusPill({ tone, children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
