import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface CycleIntroProps {
  hasEntry: boolean;
  onLog: () => void;
}

export function CycleIntro({ hasEntry, onLog }: CycleIntroProps) {
  return (
    <section className="ss-card px-5 py-8 text-center sm:px-8 md:py-10">
      <div className="mx-auto max-w-2xl space-y-3">
        <h2 className="ss-display text-3xl font-bold text-[color:var(--design-brown)] md:text-4xl">
          Daily check-in
        </h2>
        <p className="mx-auto max-w-xl text-lg leading-relaxed text-[color:var(--design-muted)]">
          {hasEntry
            ? "You already have an entry for this date. Update it whenever your day changes."
            : "Add today's mood, energy, symptoms, and private note in one place."}
        </p>
      </div>

      <Button
        size="lg"
        onClick={onLog}
        className="mx-auto mt-8 w-full max-w-xs rounded-full bg-[color:var(--design-peach)] text-[color:var(--design-ink)] shadow-[var(--design-shadow-soft)] hover:brightness-105"
      >
        <Plus className="h-5 w-5" />
        {hasEntry ? "Edit Log" : "Log Today"}
      </Button>
    </section>
  );
}
