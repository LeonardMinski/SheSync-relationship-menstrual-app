import { COACH_CONTEXT_SOURCES, COACH_CONTEXT_STRIP_EMPTY_TEXT, COACH_CONTEXT_STRIP_MANAGE_LABEL } from "./coach.constants";
import type { CoachContextSelection } from "@/types/coach";

/**
 * Always visible directly above the composer (empty state and active
 * conversation alike) — a compact, honest summary of which real sources
 * are currently enabled, with the single entry point into Manage Context.
 * Recent Observations only ever appears here when the caller actually has
 * real Pattern Engine observations right now — see CoachContextPanel for
 * the same rule.
 */
export function CoachContextStrip({
  selection,
  recentObservationsAvailable,
  onManageContext,
}: {
  selection: CoachContextSelection;
  recentObservationsAvailable: boolean;
  onManageContext: () => void;
}) {
  const enabledLabels = COACH_CONTEXT_SOURCES.filter((source) => {
    if (!selection[source.key]) return false;
    if (source.key === "recentObservations") return recentObservationsAvailable;
    return true;
  }).map((source) => source.label);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-full border border-border bg-bg-elevated px-4 py-2.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent-rose)]" aria-hidden="true" />
        {enabledLabels.length > 0 ? (
          <span>
            Using: <span className="font-semibold text-foreground">{enabledLabels.join(" · ")}</span>
          </span>
        ) : (
          COACH_CONTEXT_STRIP_EMPTY_TEXT
        )}
      </span>
      <button
        type="button"
        onClick={onManageContext}
        className="font-semibold text-[color:var(--accent-rose)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
      >
        {COACH_CONTEXT_STRIP_MANAGE_LABEL}
      </button>
    </div>
  );
}
