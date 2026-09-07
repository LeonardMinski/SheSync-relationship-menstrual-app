import {
  generateActivityImpactFrequencyObservation,
  generateBackPainRecurrenceObservation,
  generateBloatingRecurrenceObservation,
  generateBowelChangeRecurrenceObservation,
  generateCrampPeakObservation,
  generateFatiguePeakObservation,
  generateHeadacheRecurrenceObservation,
  generateHeaviestFlowDayObservation,
  generateNauseaRecurrenceObservation,
  generatePainReliefFrequencyObservation,
  generatePeriodDurationObservation,
  type PeriodWithDayLogs,
} from "./periodObservations";
import { generateCheckInConsistencyObservation, generateMoodTrendObservation } from "./dailyCheckInObservations";
import type { Observation, ObservationType } from "@/types/patterns";
import type { CycleEntry } from "@/types/cycle";

export interface GenerateObservationsInput {
  /** Last N completed periods (see PATTERN_THRESHOLDS.windows.recentCompletedPeriods), each with its own day logs. */
  periods: PeriodWithDayLogs[];
  /** Last N days of cycle_data (see PATTERN_THRESHOLDS.windows.dailyCheckInDays). */
  cycleEntries: Pick<CycleEntry, "date" | "mood">[];
  today?: Date;
}

/**
 * Pure orchestrator: real logs in, deterministic Observation[] out. No I/O,
 * no AI, no persistence — see docs/pattern-engine-v1.md. Every generator
 * independently decides whether it has enough evidence; this function only
 * combines whatever they each produce.
 */
export function generateObservations(input: GenerateObservationsInput): Observation[] {
  const periodDurations = input.periods.map((entry) => entry.period);

  const candidates: Array<Observation | null> = [
    generatePeriodDurationObservation(periodDurations),
    generateHeaviestFlowDayObservation(input.periods),
    generateCrampPeakObservation(input.periods),
    generateFatiguePeakObservation(input.periods),
    generateBackPainRecurrenceObservation(input.periods),
    generateHeadacheRecurrenceObservation(input.periods),
    generateBloatingRecurrenceObservation(input.periods),
    generateNauseaRecurrenceObservation(input.periods),
    generateBowelChangeRecurrenceObservation(input.periods),
    generatePainReliefFrequencyObservation(input.periods),
    generateActivityImpactFrequencyObservation(input.periods),
    generateCheckInConsistencyObservation(input.cycleEntries, input.today),
    generateMoodTrendObservation(input.cycleEntries, input.today),
  ];

  return candidates.filter((observation): observation is Observation => observation !== null);
}

/**
 * Deterministic Home priority order — see docs/pattern-engine-v1.md
 * "Home priority". Ties within "recurring symptom" resolve to the first
 * matching type in this fixed list, in the order the task spec itself
 * enumerated the symptom types.
 */
const ACTIVE_PERIOD_PRIORITY: ObservationType[] = [
  "cramp_peak_day",
  "heaviest_flow_day",
  "fatigue_peak_day",
  "back_pain_recurrence",
  "headache_recurrence",
  "bloating_recurrence",
  "nausea_recurrence",
  "bowel_change_recurrence",
  "pain_relief_frequency",
  "activity_impact_frequency",
];

const BETWEEN_PERIODS_PRIORITY: ObservationType[] = [
  "period_duration_range",
  "back_pain_recurrence",
  "headache_recurrence",
  "bloating_recurrence",
  "nausea_recurrence",
  "bowel_change_recurrence",
  "pain_relief_frequency",
  "activity_impact_frequency",
  "checkin_consistency",
  "mood_trend",
];

/**
 * Home shows exactly one observation, and only ever a "sufficient" one —
 * an "emerging" observation (currently only period_duration_range at
 * exactly 2 periods) is real evidence-backed data, but Home's single slot
 * is reserved for the strongest claim available; Cycle's fuller list
 * still surfaces emerging ones. No match -> null, and callers fall back to
 * the existing honest "Still learning your pattern" copy — never a
 * fabricated replacement.
 */
export function selectHomeObservation(observations: Observation[], hasActivePeriod: boolean): Observation | null {
  const priority = hasActivePeriod ? ACTIVE_PERIOD_PRIORITY : BETWEEN_PERIODS_PRIORITY;
  const sufficientOnly = observations.filter((observation) => observation.sufficiency === "sufficient");

  for (const type of priority) {
    const match = sufficientOnly.find((observation) => observation.type === type);
    if (match) return match;
  }

  return null;
}
