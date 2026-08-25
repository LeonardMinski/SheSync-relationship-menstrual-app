import { format } from "date-fns";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { CycleEntry } from "@/types";
import { getPhaseMarker } from "@/features/cycle/cycle.utils";

interface SelectedDateCardProps {
  selectedData?: CycleEntry;
  selectedDate: Date;
  onLog: () => void;
}

export function SelectedDateCard({
  selectedData,
  selectedDate,
  onLog,
}: SelectedDateCardProps) {
  return (
    <section className="ss-card p-6 sm:p-8">
      <div>
        <h2 className="flex items-center justify-center gap-2 text-center text-base font-bold uppercase tracking-[0.12em] text-[color:var(--design-muted)] sm:justify-start sm:text-left">
          <Calendar
            className="h-5 w-5 text-[color:var(--design-sage)]"
            aria-hidden="true"
          />
          {format(selectedDate, "MMMM d, yyyy")}
        </h2>
      </div>

      <div className="mt-7">
        <div className="grid gap-5 text-center sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:text-left">
          <div className="min-w-0">
            <div className="ss-display text-4xl font-bold capitalize text-[color:var(--design-brown)]">
              {selectedData ? getPhaseMarker(selectedData.phase) : "-"}{" "}
              {selectedData?.phase || "No data"}
            </div>
            <p className="mt-2 text-base text-[color:var(--design-muted)]">
              {selectedData
                ? "Entry logged for this date"
                : "No data logged for this date"}
            </p>
          </div>
          <div className="rounded-2xl bg-[color:var(--design-footer)] px-5 py-3 text-center">
            <div className="text-sm font-semibold text-[color:var(--design-muted)]">
              Mood
            </div>
            <div className="text-lg font-bold text-[color:var(--design-ink)]">
              {selectedData?.mood || "—"}/10
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={onLog}
            className="mx-auto w-full max-w-xs rounded-full border-[color:var(--design-border)] bg-white text-[color:var(--design-ink)] sm:w-auto"
          >
            {selectedData ? "Edit Entry" : "Add Entry"}
          </Button>
        </div>
      </div>
    </section>
  );
}
