"use client";

import { useState } from "react";
import Link from "next/link";

import { MoodIcon } from "@/components/home/MoodIcon";
import { moodValueToLabel } from "@/features/home/dailyCheckIn";
import { buildWeekStrip, type WeekDay } from "@/features/home/weekStrip";
import type { CycleEntry } from "@/types/cycle";
import type { Period, PeriodSummary } from "@/types/period";

/**
 * Replaces the old "Recent Entries" raw-record list. Mood (from the
 * canonical daily check-in) and period-day (from periods/period_day_logs)
 * are rendered as two visually distinct signals — an icon for how the day
 * felt, a separate dot for whether it was a period day — never merged into
 * one value. See features/home/weekStrip.ts.
 */
export function YourWeek({
  cycles,
  activePeriod,
  periodHistory,
}: {
  cycles: CycleEntry[];
  activePeriod: Period | null;
  periodHistory: PeriodSummary[];
}) {
  const days = buildWeekStrip({ cycles, activePeriod, periodHistory });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedDay = days.find((day) => day.dateKey === selectedKey) ?? null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Your Week</h2>
        <Link
          href="/cycle/history"
          className="text-sm font-semibold text-[color:var(--accent-rose)] hover:underline"
        >
          View history →
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => (
          <DayTile
            key={day.dateKey}
            day={day}
            selected={selectedKey === day.dateKey}
            onSelect={() => setSelectedKey((current) => (current === day.dateKey ? null : day.dateKey))}
          />
        ))}
      </div>

      {selectedDay && <DayDetail day={selectedDay} />}
    </div>
  );
}

function DayTile({ day, selected, onSelect }: { day: WeekDay; selected: boolean; onSelect: () => void }) {
  const moodLabel = day.mood !== null ? moodValueToLabel(day.mood) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!day.hasData}
      aria-pressed={selected}
      aria-label={`${day.dayLabel} ${day.dayNumber}${moodLabel ? `, mood ${moodLabel}` : ""}${day.isPeriodDay ? ", period day" : ""}`}
      className={`flex min-h-[64px] flex-col items-center gap-1 rounded-xl border p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start disabled:cursor-default ${
        selected
          ? "border-[color:var(--accent-rose)] bg-[color:var(--accent-rose)]/15"
          : day.isToday
            ? "border-cta-start/50 bg-bg-surface"
            : "border-border bg-bg-surface"
      } ${day.hasData ? "hover:border-cta-start/40" : ""}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{day.dayLabel}</span>
      {moodLabel ? (
        <MoodIcon label={moodLabel} className="h-5 w-5 text-foreground" />
      ) : (
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          {day.isFuture ? "" : "—"}
        </span>
      )}
      <span
        className={`h-1.5 w-1.5 rounded-full ${day.isPeriodDay ? "bg-[color:var(--accent-rose)]" : "bg-transparent"}`}
        aria-hidden="true"
      />
    </button>
  );
}

function DayDetail({ day }: { day: WeekDay }) {
  const moodLabel = day.mood !== null ? moodValueToLabel(day.mood) : null;

  return (
    <div className="mt-3 rounded-2xl border border-border bg-bg-elevated p-4 text-sm">
      <p className="font-bold text-foreground">
        {day.dayLabel} {day.dayNumber}
      </p>
      <div className="mt-2 space-y-1 text-muted-foreground">
        {moodLabel && (
          <p>
            Mood: <span className="font-semibold text-foreground">{moodLabel}</span>
          </p>
        )}
        {day.isPeriodDay && <p className="font-semibold text-[color:var(--accent-rose)]">Period day</p>}
      </div>
    </div>
  );
}
