import { PenLine, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface CycleHeroProps {
  dayNumber: number | null;
  phaseLabel: string;
  hasLog: boolean;
  onLog: () => void;
}

export function CycleHero({
  dayNumber,
  phaseLabel,
  hasLog,
  onLog,
}: CycleHeroProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border bg-bg-surface px-5 py-8 text-center shadow-lg sm:px-8 md:py-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-info" aria-hidden="true" />
          Privacy first
        </div>

        <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
          {phaseLabel}
        </h2>

        <div className="mt-8 flex aspect-square w-full max-w-[280px] items-center justify-center rounded-full border-[10px] border-cta-start/80 bg-bg sm:max-w-[320px]">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
              Cycle Day
            </p>
            <p className="mt-1 text-7xl font-black leading-none text-foreground sm:text-8xl">
              {dayNumber ?? "-"}
            </p>
          </div>
        </div>

        <div className="mt-8 max-w-2xl">
          <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {hasLog
              ? "Your latest logged data is ready for review."
              : "Log your cycle data to unlock phase context and trends."}
          </p>
        </div>

        <Button className="mt-9 w-full max-w-xs" onClick={onLog}>
          <PenLine className="h-5 w-5" aria-hidden="true" />
          {hasLog ? "Update Log" : "Log Today"}
        </Button>
      </div>
    </section>
  );
}
