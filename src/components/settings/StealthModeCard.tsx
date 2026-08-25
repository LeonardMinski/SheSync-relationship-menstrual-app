import { EyeOff } from "lucide-react";

import { Toggle } from "@/components/ui/Toggle";

export function StealthModeCard({
  saving,
  stealthMode,
  onChange,
}: {
  saving: boolean;
  stealthMode: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <section className="ss-card border-l-[6px] border-l-[color:var(--design-sage)] p-6 sm:p-8">
      <div className="flex items-center gap-4 border-b border-[color:var(--design-border)] pb-6">
        <EyeOff
          className="h-7 w-7 text-[color:var(--design-sage)]"
          aria-hidden="true"
        />
        <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
          Stealth Mode
        </h2>
      </div>

      <div className="mt-7 flex items-start justify-between gap-5">
        <div>
          <p className="text-xl font-bold text-[color:var(--design-ink)]">
            {stealthMode ? "Sharing Paused" : "Sharing Active"}
          </p>
          <p className="mt-2 text-base leading-relaxed text-[color:var(--design-muted)]">
            Instantly pause all partner sharing without affecting your local
            logging.
          </p>
        </div>
        <Toggle checked={stealthMode} disabled={saving} onChange={onChange} />
      </div>

      <div className="mt-8 rounded-2xl bg-[color:var(--design-footer)] p-5 text-sm text-[color:var(--design-muted)]">
        <p className="font-bold text-[color:var(--design-ink)]">
          When active:
        </p>
        <ul className="mt-3 space-y-2">
          <li>Partner sees a data paused message.</li>
          <li>No new partner notifications are sent.</li>
          <li>Your private logs remain unaffected.</li>
        </ul>
      </div>
    </section>
  );
}
