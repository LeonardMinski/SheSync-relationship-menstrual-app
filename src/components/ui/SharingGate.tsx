import { Lock } from "lucide-react";

/**
 * The small vertical "gate" divider used between a private original and a
 * partner-facing draft (Vault Tease, Partner Translation). Purely
 * decorative — the real gating logic lives in the surrounding component.
 */
export function SharingGate({ label = "Gate" }: { label?: string }) {
  return (
    <div
      className="hidden flex-col items-center justify-center gap-2 md:flex"
      aria-hidden="true"
    >
      <span className="h-16 w-px bg-[color:var(--accent-rose)]/30" />
      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[color:var(--accent-rose)] bg-bg-surface text-[color:var(--accent-rose)]">
        <Lock className="h-4 w-4" />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--accent-rose)]">
        {label}
      </span>
      <span className="h-16 w-px bg-[color:var(--accent-rose)]/30" />
    </div>
  );
}
