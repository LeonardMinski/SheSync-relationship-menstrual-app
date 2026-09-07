import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import { MoodIcon } from "@/components/home/MoodIcon";
import { moodValueToLabel } from "@/features/home/dailyCheckIn";
import type { HistoryDayCell } from "@/features/cycle/history.utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function HistoryCalendar({
  monthDate,
  days,
  selectedDateKey,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: {
  monthDate: Date;
  days: HistoryDayCell[];
  selectedDateKey: string | null;
  onSelectDay: (day: HistoryDayCell) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:border-cta-start/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="font-display text-lg font-bold text-foreground">{format(monthDate, "MMMM yyyy")}</p>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground hover:border-cta-start/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const moodLabel = day.mood !== null ? moodValueToLabel(day.mood) : null;
          const isSelected = selectedDateKey === day.dateKey;
          const isSelectable = day.inCurrentMonth && !day.isFuture;

          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => isSelectable && onSelectDay(day)}
              disabled={!isSelectable}
              aria-pressed={isSelected}
              aria-label={`${format(new Date(`${day.dateKey}T00:00:00`), "MMMM d")}${moodLabel ? `, mood ${moodLabel}` : ""}${day.isPeriodDay ? ", period day" : ""}`}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start disabled:cursor-default ${
                !day.inCurrentMonth
                  ? "border-transparent text-muted-foreground/40"
                  : isSelected
                    ? "border-[color:var(--accent-rose)] bg-[color:var(--accent-rose)]/15"
                    : "border-border bg-bg-elevated text-foreground"
              }`}
            >
              <span className="font-semibold">{day.dayNumber}</span>
              {day.inCurrentMonth && moodLabel && <MoodIcon label={moodLabel} className="h-3.5 w-3.5" />}
              <span
                className={`h-1 w-1 rounded-full ${day.isPeriodDay && day.inCurrentMonth ? "bg-[color:var(--accent-rose)]" : "bg-transparent"}`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
