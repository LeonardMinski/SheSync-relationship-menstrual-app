import { StatusPill } from "@/components/ui/StatusPill";

interface HomeObservationCardProps {
  title: string;
  body: string;
  /** Small caption pill, e.g. "STILL LEARNING" or omitted for a confirmed observation. */
  tag?: string;
}

/**
 * The single "one factual observation" slot on Home. Every caller must
 * supply real, derived text — see src/features/home/homeState.ts for what's
 * actually knowable. This component only renders whatever it's given; it
 * has no fallback copy of its own, so there's nowhere for a fabricated
 * claim to sneak in via a default prop.
 */
export function HomeObservationCard({ title, body, tag }: HomeObservationCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--accent-amber)]/30 bg-[color:var(--accent-amber-soft)]/20 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl italic text-foreground sm:text-2xl">{title}</h2>
        {tag && (
          <StatusPill tone="amber" className="shrink-0 uppercase tracking-wide">
            {tag}
          </StatusPill>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{body}</p>
    </div>
  );
}
