import { BarChart3 } from "lucide-react";

/**
 * No pattern-detection logic exists yet in this codebase (checked
 * dashboard.utils / cycle utils — nothing computes a real weekly pattern),
 * so this stays an honest, compact placeholder rather than inventing a fake
 * stat or taking up a full card's worth of space for content that isn't
 * there yet.
 */
export function InsightCard() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-bg-elevated/50 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-surface text-muted-foreground">
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">
          Insights are still learning
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Keep logging and patterns based on your real data will show up here.
        </p>
      </div>
    </div>
  );
}
