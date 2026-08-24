import { BarChart3 } from "lucide-react";

export function InsightCard() {
  return (
    <article className="flex min-w-0 flex-col rounded-[2rem] border border-border bg-bg-surface p-5 shadow-md">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 shrink-0 text-info" aria-hidden="true" />
        <h2 className="min-w-0 truncate text-xl font-bold text-foreground">
          AI Insight
        </h2>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Insights will appear after enough logged cycle data is available for a
        reliable summary.
      </p>
      <p className="mt-6 text-sm font-bold text-info">Coming soon</p>
    </article>
  );
}
