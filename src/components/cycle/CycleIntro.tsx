import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface CycleIntroProps {
  hasEntry: boolean;
  onLog: () => void;
}

export function CycleIntro({ hasEntry, onLog }: CycleIntroProps) {
  return (
    <section className="rounded-[2rem] border border-border bg-bg-surface px-5 py-8 text-center shadow-md sm:px-8 md:py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* TopNavbar (rendered by the page above this section) already
            provides this page's single <h1>; this is demoted to a plain
            heading-styled paragraph to avoid a duplicate top-level heading. */}
        <p className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
          How are you feeling today?
        </p>
        <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
          Log your daily metrics to discover personal insights.
        </p>
      </div>

      <Button
        variant="cta"
        size="lg"
        onClick={onLog}
        className="mx-auto mt-7 w-full max-w-xs"
      >
        <Plus className="h-5 w-5" />
        {hasEntry ? "Edit Log" : "Log Today"}
      </Button>
    </section>
  );
}
