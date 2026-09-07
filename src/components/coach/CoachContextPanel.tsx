import { Check, X } from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import {
  COACH_CONTEXT_NOT_ACCESSIBLE,
  COACH_CONTEXT_SOURCES,
  COACH_PRIVACY_EXPLANATION,
  COACH_RECENT_OBSERVATIONS_UNAVAILABLE_TEXT,
} from "./coach.constants";
import type { CoachContextSelection } from "@/types/coach";

/**
 * "Manage Context" — the user's explicit control over which permitted
 * sources Coach may reference, plus an honest list of what it can never
 * see. Recent Observations is always shown disabled: there is no real
 * Pattern Engine yet, so it is never toggleable and never silently
 * enabled — see features/coach/context.ts, which enforces this
 * server-side too, independent of whatever this panel shows.
 */
export function CoachContextPanel({
  selection,
  onChange,
  onClose,
}: {
  selection: CoachContextSelection;
  onChange: (next: CoachContextSelection) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Manage Context" onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="space-y-6">
        <p className="text-sm leading-6 text-muted-foreground">{COACH_PRIVACY_EXPLANATION}</p>

        <div className="space-y-4">
          {COACH_CONTEXT_SOURCES.map((source) => {
            const isAvailable = source.key !== "recentObservations";
            const toggleId = `coach-context-${source.key}`;
            return (
              <div key={source.key} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-bg-surface p-4">
                <div>
                  <label htmlFor={toggleId} className="text-sm font-semibold text-foreground">
                    {source.label}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isAvailable ? source.description : COACH_RECENT_OBSERVATIONS_UNAVAILABLE_TEXT}
                  </p>
                </div>
                <Toggle
                  id={toggleId}
                  checked={isAvailable && selection[source.key]}
                  disabled={!isAvailable}
                  onChange={(checked) => onChange({ ...selection, [source.key]: checked })}
                />
              </div>
            );
          })}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-error">Not accessible by Coach</p>
          <ul className="mt-2 space-y-2">
            {COACH_CONTEXT_NOT_ACCESSIBLE.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <X className="h-4 w-4 shrink-0 text-error" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[color:var(--accent-sage)]/30 bg-[color:var(--accent-sage-soft)]/30 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--accent-sage)]">
            <Check className="h-4 w-4" aria-hidden="true" />
            You control this
          </p>
          <p className="mt-2 text-sm text-foreground">
            Turn any source above off at any time — future messages in this conversation won&apos;t include it.
          </p>
        </div>
      </div>
    </Modal>
  );
}
