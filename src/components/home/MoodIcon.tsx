import { Frown, Laugh, Meh, Smile, SmilePlus, type LucideIcon } from "lucide-react";

import type { DailyMoodLabel } from "@/features/home/dailyCheckIn";

const MOOD_ICONS: Record<DailyMoodLabel, LucideIcon> = {
  "Very low": Frown,
  Low: Meh,
  Okay: Smile,
  Good: SmilePlus,
  Great: Laugh,
};

/** Shared mood-face icon for a DAILY_MOOD_OPTIONS label — used by both the Daily Check-in control and Your Week so the same value always reads as the same icon. */
export function MoodIcon({ label, className }: { label: DailyMoodLabel; className?: string }) {
  const Icon = MOOD_ICONS[label];
  return <Icon className={className} aria-hidden="true" />;
}
