import React from "react";
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";

import { cn } from "@/utils/cn";

type BannerTone = "success" | "error" | "warning" | "info";

interface InlineBannerProps {
  tone: BannerTone;
  children: React.ReactNode;
  className?: string;
}

const TONE_CONFIG: Record<
  BannerTone,
  { role: "status" | "alert"; icon: React.ComponentType<{ className?: string }>; classes: string }
> = {
  success: {
    role: "status",
    icon: CheckCircle2,
    classes: "border-[color:var(--accent-sage)]/40 bg-[color:var(--accent-sage-soft)]/30 text-[color:var(--accent-sage)]",
  },
  error: {
    role: "alert",
    icon: XCircle,
    classes: "border-[color:var(--error)]/40 bg-[color:var(--error)]/10 text-[color:var(--error)]",
  },
  warning: {
    role: "alert",
    icon: TriangleAlert,
    classes: "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
  },
  info: {
    role: "status",
    icon: Info,
    classes: "border-border bg-bg-elevated text-foreground",
  },
};

export function InlineBanner({ tone, children, className }: InlineBannerProps) {
  const { role, icon: Icon, classes } = TONE_CONFIG[tone];

  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium",
        classes,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
