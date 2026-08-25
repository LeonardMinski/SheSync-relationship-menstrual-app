import { Droplets, PenLine, Smile, Stethoscope } from "lucide-react";

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
    <section className="ss-card p-7 sm:p-9">
      <h2 className="ss-display text-3xl font-bold text-[color:var(--design-brown)]">
        Current Cycle Phase
      </h2>

      <div className="mt-8 flex justify-center">
        <div className="relative flex aspect-square w-full max-w-[390px] items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 120 120"
            aria-hidden="true"
          >
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="#f3efec"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="var(--design-peach)"
              strokeLinecap="round"
              strokeDasharray="196 302"
              strokeWidth="8"
            />
          </svg>

          <div className="flex aspect-square w-[58%] items-center justify-center rounded-full border border-[color:var(--design-border)] bg-white text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--design-sage)]">
                Day {dayNumber ?? "—"}
              </p>
              <p className="ss-display mt-3 text-4xl font-bold leading-tight text-[color:var(--design-brown)]">
                {phaseLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <QuickLogButton icon={Droplets} label="Flow" onClick={onLog} />
        <QuickLogButton icon={Smile} label="Mood" active onClick={onLog} />
        <QuickLogButton icon={Stethoscope} label="Symptoms" onClick={onLog} />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="sr-only"
        onClick={onLog}
      >
        <PenLine className="h-5 w-5" aria-hidden="true" />
        {hasLog ? "Update Log" : "Log Today"}
      </Button>
    </section>
  );
}

function QuickLogButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Droplets;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex min-h-20 min-w-20 flex-col items-center justify-center gap-2 rounded-xl bg-[color:var(--design-peach)] px-4 text-sm font-bold text-[color:var(--design-brown)] shadow-[var(--design-shadow-soft)]"
          : "flex min-h-20 min-w-20 flex-col items-center justify-center gap-2 rounded-xl border border-[color:var(--design-border)] bg-[color:var(--design-footer)] px-4 text-sm font-bold text-[color:var(--design-ink)] transition hover:border-[color:var(--design-peach)]"
      }
    >
      <Icon className="h-6 w-6" aria-hidden="true" />
      {label}
    </button>
  );
}
