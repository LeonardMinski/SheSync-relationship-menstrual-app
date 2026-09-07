import { StatusPill } from "@/components/ui/StatusPill";

function getGreetingWord(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface HomeGreetingProps {
  firstName: string;
  subtitle: string;
  /** e.g. "Day 3 · Period active" or "Day 9 since your last period" — never a predicted phase name. */
  dayPillLabel?: string;
  now?: Date;
}

export function HomeGreeting({ firstName, subtitle, dayPillLabel, now }: HomeGreetingProps) {
  const greetingWord = getGreetingWord(now ?? new Date());

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl italic text-foreground sm:text-4xl">
          {greetingWord}, {firstName}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      </div>
      {dayPillLabel && (
        <StatusPill tone="rose" className="shrink-0">
          {dayPillLabel}
        </StatusPill>
      )}
    </div>
  );
}
