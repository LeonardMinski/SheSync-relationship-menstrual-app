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
    <section className="rounded-[2rem] border border-border border-l-[6px] border-l-info bg-bg-surface p-6 shadow-md">
      <div className="flex items-center gap-3">
        <EyeOff className="h-7 w-7 text-info" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-foreground">Stealth Mode</h2>
      </div>

      <div className="mt-7 flex items-start justify-between gap-5">
        <div>
          <p className="text-lg font-bold text-foreground">
            {stealthMode ? "Sharing Paused" : "Sharing Active"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Instantly pause all partner sharing without affecting your local
            logging.
          </p>
        </div>
        <Toggle checked={stealthMode} disabled={saving} onChange={onChange} />
      </div>

      <div className="mt-8 rounded-2xl bg-bg p-5 text-sm text-muted-foreground">
        <p className="font-bold text-foreground">When active:</p>
        <ul className="mt-3 space-y-2">
          <li>Partner sees a data paused message.</li>
          <li>No new partner notifications are sent.</li>
          <li>Your private logs remain unaffected.</li>
        </ul>
      </div>
    </section>
  );
}
