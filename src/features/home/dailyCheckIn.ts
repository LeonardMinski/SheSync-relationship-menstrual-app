export type DailyMoodLabel = "Very low" | "Low" | "Okay" | "Good" | "Great";

/**
 * One-tap mood options for the lightweight Daily Check-in. Anchor values
 * are evenly spaced points on cycle_data's existing real 1-10 mood scale —
 * not a new/parallel mood model. Picking one of these writes that exact
 * number as the canonical daily mood (see services/cycle/dailyMood.ts).
 */
export const DAILY_MOOD_OPTIONS: { label: DailyMoodLabel; value: number }[] = [
  { label: "Very low", value: 2 },
  { label: "Low", value: 4 },
  { label: "Okay", value: 6 },
  { label: "Good", value: 8 },
  { label: "Great", value: 10 },
];

/** Nearest DAILY_MOOD_OPTIONS bucket for a stored 1-10 mood value — used to display/summarise a numeric value using the same five-label vocabulary. */
export function moodValueToLabel(value: number): DailyMoodLabel {
  let closest = DAILY_MOOD_OPTIONS[0];
  let closestDistance = Math.abs(value - closest.value);

  for (const option of DAILY_MOOD_OPTIONS) {
    const distance = Math.abs(value - option.value);
    if (distance < closestDistance) {
      closest = option;
      closestDistance = distance;
    }
  }

  return closest.label;
}
