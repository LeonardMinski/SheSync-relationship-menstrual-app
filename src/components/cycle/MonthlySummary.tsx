import type { MonthlySummary as MonthlySummaryData } from "@/features/cycle/history.utils";

/** Factual monthly stats — see features/cycle/history.utils.ts for how each number is derived. Nothing here is a prediction or pattern claim. */
export function MonthlySummary({ summary }: { summary: MonthlySummaryData }) {
  if (summary.daysCheckedIn === 0 && summary.periodDaysLogged === 0) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">This month</p>
      <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Days checked in" value={String(summary.daysCheckedIn)} />
        <Stat label="Most common mood" value={summary.mostCommonMood ?? "—"} />
        <Stat label="Average mood" value={summary.averageMood !== null ? `${summary.averageMood}/10` : "—"} />
        <Stat label="Period days logged" value={String(summary.periodDaysLogged)} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-xl font-bold text-foreground">{value}</dd>
    </div>
  );
}
