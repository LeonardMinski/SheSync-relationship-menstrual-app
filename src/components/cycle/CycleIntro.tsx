import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface CycleIntroProps {
  hasEntry: boolean;
  onLog: () => void;
}

export function CycleIntro({ hasEntry, onLog }: CycleIntroProps) {
  return (
    <section className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <Button
          variant="cta"
          size="lg"
          onClick={onLog}
          className="w-full shrink-0 sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          {hasEntry ? "Edit Log" : "Log Today"}
        </Button>

        {/* TopNavbar (rendered by the page above this section) already
            provides this page's single <h1>; this is demoted to a plain
            heading-styled paragraph to avoid a duplicate top-level heading. */}
        <div className="space-y-1 text-center sm:text-left">
          <p className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
            How are you feeling today?
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Log your daily metrics to discover personal insights.
          </p>
        </div>
      </div>
    </section>
  );
}
