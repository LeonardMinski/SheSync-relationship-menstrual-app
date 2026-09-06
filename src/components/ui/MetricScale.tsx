import { cn } from "@/utils/cn";

interface MetricScaleProps {
  label: string;
  /** 1-based current value. */
  value: number;
  /** Total number of segments (defaults to 5, matching the app's 1-10 fields halved for display, or pass 10 directly). */
  max?: number;
  /** Small caption under/right of the label, e.g. "How you feel right now". */
  caption?: string;
  tone?: "rose" | "sage" | "amber" | "blue" | "purple";
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<MetricScaleProps["tone"]>, string> = {
  rose: "bg-[color:var(--accent-rose)]",
  sage: "bg-[color:var(--accent-sage)]",
  amber: "bg-[color:var(--accent-amber)]",
  blue: "bg-[color:var(--accent-blue)]",
  purple: "bg-[color:var(--accent-purple)]",
};

/**
 * The segmented horizontal bar used for mood/energy/stress/desire — real
 * numeric value always shown alongside, never color-only.
 */
export function MetricScale({
  label,
  value,
  max = 5,
  caption,
  tone = "rose",
  className,
}: MetricScaleProps) {
  const segments = Array.from({ length: max }, (_, i) => i < value);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
      </div>
      <div
        className="flex gap-1"
        role="img"
        aria-label={`${label}: ${value} out of ${max}`}
      >
        {segments.map((filled, i) => (
          <span
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full",
              filled ? TONE_CLASSES[tone] : "bg-bg-elevated",
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
