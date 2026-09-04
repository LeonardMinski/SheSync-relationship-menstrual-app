import { cn } from "@/utils/cn";

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[color:var(--accent-premium)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--accent-premium-foreground)]",
        className,
      )}
    >
      Premium
    </span>
  );
}
