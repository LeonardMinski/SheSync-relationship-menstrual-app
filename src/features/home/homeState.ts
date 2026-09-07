import {
  MIN_COMPLETED_PERIODS_FOR_AVERAGE,
  getAverageCycleLength,
  toDateKey,
} from "@/features/period/period.utils";
import type { Period, PeriodSummary } from "@/types/period";

/**
 * Home is a state engine, not a dashboard: given real data, it derives
 * exactly one variant and a small, transparent set of deterministic
 * numbers to show — never a fabricated observation, never a hormone/
 * biological-model claim. See docs/period-tracking-ui-contract.md for the
 * evidence-gating precedent this follows (MIN_COMPLETED_PERIODS_FOR_AVERAGE).
 */

export type HomeVariant = "new" | "active_period" | "just_ended" | "between_periods";

/** A period counts as "just ended" while its end date is this recent — after that it's simply the most recent entry in Between Periods. */
const JUST_ENDED_WINDOW_DAYS = 1;

export interface DerivedObservation {
  title: string;
  body: string;
}

export interface HomeState {
  variant: HomeVariant;
  /** Only present for "active_period". */
  activePeriod?: Period;
  periodDay?: number;
  /** Only present for "just_ended". */
  justEndedPeriod?: PeriodSummary;
  /** Present whenever at least one completed period exists. */
  lastCompletedPeriod?: PeriodSummary;
  averageCycleLength?: number | null;
  loggedPeriodCount: number;
  /**
   * Days elapsed since the last logged period started (1-indexed), present
   * whenever there's no active period but a last completed period exists.
   * A plain fact derived from a real logged date — not a predicted phase or
   * cycle position, see the "no real phase detection model" note above.
   */
  cycleDayEstimate?: number;
  /** True once there's enough evidence (>= MIN_COMPLETED_PERIODS_FOR_AVERAGE) to show a real observation instead of a learning state. */
  hasEnoughHistoryForObservation: boolean;
}

export interface HomeStateInput {
  activePeriod: Period | null;
  /** Completed periods (end_date set), most recent first. */
  periodHistory: PeriodSummary[];
  today?: Date;
}

function daysSince(dateKey: string, today: Date): number {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(`${toDateKey(today)}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function deriveHomeState(input: HomeStateInput): HomeState {
  const today = input.today ?? new Date();
  const loggedPeriodCount = input.periodHistory.length;
  const lastCompletedPeriod = input.periodHistory[0];
  const hasEnoughHistoryForObservation = loggedPeriodCount >= MIN_COMPLETED_PERIODS_FOR_AVERAGE;

  const base = {
    loggedPeriodCount,
    hasEnoughHistoryForObservation,
    lastCompletedPeriod,
    averageCycleLength: getAverageCycleLength(input.periodHistory),
    cycleDayEstimate: lastCompletedPeriod
      ? daysSince(lastCompletedPeriod.start_date, today) + 1
      : undefined,
  };

  if (input.activePeriod) {
    const periodDay =
      daysSince(input.activePeriod.start_date, today) + 1;
    return { variant: "active_period", activePeriod: input.activePeriod, periodDay, ...base };
  }

  if (loggedPeriodCount === 0) {
    return { variant: "new", ...base };
  }

  if (
    lastCompletedPeriod?.end_date &&
    daysSince(lastCompletedPeriod.end_date, today) <= JUST_ENDED_WINDOW_DAYS
  ) {
    return { variant: "just_ended", justEndedPeriod: lastCompletedPeriod, ...base };
  }

  return { variant: "between_periods", ...base };
}

/**
 * Copy for the single "one factual observation" card. Every branch below
 * only ever states a number that deriveHomeState actually computed —
 * there is deliberately no "otherwise" branch that invents something to
 * fill the space; the "still learning" copy is itself the honest content.
 */
export function deriveObservation(state: HomeState): DerivedObservation {
  if (state.variant === "active_period" && state.activePeriod) {
    return {
      title: `Day ${state.periodDay}`,
      body: "Keep logging how you're feeling so SheSync+ can learn what this part of your cycle is usually like for you.",
    };
  }

  if (state.variant === "just_ended" && state.justEndedPeriod) {
    const duration = state.justEndedPeriod.durationDays;
    return {
      title: "Period complete",
      body:
        duration !== null
          ? `This period lasted ${duration} day${duration === 1 ? "" : "s"}, with ${state.justEndedPeriod.loggedDayCount} day${state.justEndedPeriod.loggedDayCount === 1 ? "" : "s"} logged.`
          : "Take a moment to review this period whenever you're ready.",
    };
  }

  if (state.variant === "between_periods") {
    if (state.hasEnoughHistoryForObservation && state.averageCycleLength !== null && state.averageCycleLength !== undefined) {
      return {
        title: "Based on your history",
        body: `You've logged ${state.loggedPeriodCount} periods, averaging ${state.averageCycleLength} days between them.`,
      };
    }
    return {
      title: "Still learning your pattern",
      body: `You've logged ${state.loggedPeriodCount} period${state.loggedPeriodCount === 1 ? "" : "s"} so far. Log a few more and SheSync+ can start showing patterns from your own history.`,
    };
  }

  return {
    title: "We're learning your patterns",
    body: "As you log more days, SheSync+ can begin showing patterns from your own history. Private by default — you choose what gets shared.",
  };
}
