import { ShieldCheck } from "lucide-react";

import { cn } from "@/utils/cn";

/** The small sage "Private by default" badge shown in the app header. */
export function PrivacyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[color:var(--accent-sage-soft)] px-3 py-1.5 text-xs font-bold text-[color:var(--accent-sage)]",
        className,
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Private by default
    </span>
  );
}
