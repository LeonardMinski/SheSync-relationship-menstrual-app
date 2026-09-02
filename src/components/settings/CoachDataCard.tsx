import { Sparkles } from "lucide-react";

import { StatusPill } from "@/components/ui/StatusPill";

export function CoachDataCard() {
  return (
    <section className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-[color:var(--accent-rose)]" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-foreground">Coach & Data</h2>
      </div>

      <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          Coach can use your cycle and wellbeing logs. Your Vault and private intimacy
          content are not included unless you explicitly choose to bring something into a
          conversation.
        </p>
        <p>Coach conversations are not saved as part of your account data or history.</p>
      </div>

      <div className="mt-5">
        <StatusPill tone="warning">Coach is a design preview — not yet connected to a live service</StatusPill>
      </div>
    </section>
  );
}
