"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

import { getPeriodById } from "@/services/period";
import { getPeriodDay } from "@/features/period/period.utils";
import type { PeriodSummary, PeriodWithLogs } from "@/types/period";

function formatDate(dateKey: string): string {
  return format(new Date(`${dateKey}T00:00:00`), "MMM d, yyyy");
}

export function PeriodHistorySection({ history }: { history: PeriodSummary[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">Period History</h2>
      <div className="space-y-2">
        {history.map((period) => (
          <PeriodHistoryRow
            key={period.id}
            period={period}
            expanded={expandedId === period.id}
            onToggle={() =>
              setExpandedId((current) => (current === period.id ? null : period.id))
            }
          />
        ))}
      </div>
    </section>
  );
}

function PeriodHistoryRow({
  period,
  expanded,
  onToggle,
}: {
  period: PeriodSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [detail, setDetail] = useState<PeriodWithLogs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    onToggle();
    if (!expanded && !detail && !loading) {
      setLoading(true);
      setError(null);
      const result = await getPeriodById(period.id);
      setLoading(false);
      if (result.success) {
        setDetail(result.data);
      } else {
        setError(result.error);
      }
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-surface">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expanded}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-bold text-foreground">
            {formatDate(period.start_date)}
            {period.end_date ? ` – ${formatDate(period.end_date)}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {period.durationDays} {period.durationDays === 1 ? "day" : "days"} ·{" "}
            {period.loggedDayCount} {period.loggedDayCount === 1 ? "day" : "days"} logged
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading daily logs...</p>
          )}
          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}
          {detail && detail.logs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No daily logs were recorded for this period.
            </p>
          )}
          {detail && detail.logs.length > 0 && (
            <ul className="space-y-2">
              {detail.logs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-bg-elevated px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-foreground">
                    Day {getPeriodDay(detail, log.date)} · {formatDate(log.date)}
                  </span>
                  <span className="text-muted-foreground">
                    {log.bleeding_level} flow · cramps {log.cramps}/10 · mood {log.mood}/10
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
