import { StatusPill } from "@/components/ui/StatusPill";
import { formatEvidenceCaption } from "@/features/patterns/presentation";
import type { Observation } from "@/types/patterns";

/**
 * "Your Patterns" — Cycle's deeper-analysis surface. Shows every real
 * observation (sufficient and emerging alike — Home's single slot is
 * stricter, this is the full list), each with a human-readable evidence
 * caption so it's inspectable, never a black-box confidence score. An
 * honest empty/learning state when nothing has enough evidence yet —
 * never a fabricated pattern.
 */
export function PatternsSection({ observations }: { observations: Observation[] }) {
  if (observations.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Your Patterns</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Still learning your patterns. Keep logging and real observations will show up here once there&apos;s enough evidence.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Your Patterns</p>
      <div className="mt-3 space-y-3">
        {observations.map((observation) => (
          <div key={observation.id} className="rounded-2xl border border-border bg-bg-elevated p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold text-foreground">{observation.title}</p>
              {observation.sufficiency === "emerging" && (
                <StatusPill tone="amber" className="shrink-0 uppercase tracking-wide">
                  Still emerging
                </StatusPill>
              )}
            </div>
            <p className="mt-1 text-sm text-foreground">{observation.statement}</p>
            <p className="mt-2 text-xs text-muted-foreground">{formatEvidenceCaption(observation)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
