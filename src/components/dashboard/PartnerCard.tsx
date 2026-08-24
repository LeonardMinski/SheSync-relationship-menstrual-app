import { Heart } from "lucide-react";

export function PartnerCard({ onManage }: { onManage: () => void }) {
  const partnerName = "Alexandria Montgomery-Santos";

  return (
    <article className="flex min-w-0 flex-col rounded-[2rem] border border-border border-l-[6px] border-l-[color:var(--accent-peach)] bg-bg-surface p-5 shadow-md">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-elevated">
            <Heart
              className="h-5 w-5 text-[color:var(--accent-peach)]"
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-foreground">
              Partner View
            </h2>
            <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">
              Sharing summary
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <StatusPill label="Shared" value="Cycle phase, mood logs" tone="sage" />
        <StatusPill label="Private" value="Symptoms, notes" tone="muted" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Selected context is visible. Private categories stay hidden.
      </p>

      <div className="mt-5">
        <div className="rounded-2xl border border-border bg-bg p-3">
          <div className="flex min-w-0 flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-bg-elevated text-sm font-black text-foreground ring-1 ring-border">
              {partnerName.charAt(0)}
            </span>
            <div className="min-w-0 max-w-full">
              <p
                className="break-words text-base font-bold leading-snug text-foreground"
                title={partnerName}
              >
                {partnerName}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Connected partner
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onManage}
            className="mt-3 min-h-11 w-full rounded-full border border-border bg-bg-surface px-4 text-sm font-bold text-foreground transition hover:border-cta-start hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
          >
            Manage Sharing
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "sage" | "muted";
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-bg p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={
          tone === "sage"
            ? "mt-1 truncate text-sm font-bold text-cta-start"
            : "mt-1 truncate text-sm font-bold text-muted-foreground"
        }
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
