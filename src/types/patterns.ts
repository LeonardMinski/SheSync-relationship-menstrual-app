/**
 * Canonical Pattern Engine observation model. See
 * docs/pattern-engine-v1.md for the full contract (per-type eligibility,
 * minimum evidence, calculation, tie behaviour, wording rules).
 *
 * Deliberately NOT persisted: every observation is a pure function of
 * source data (cycle_data / periods / period_day_logs) computed fresh on
 * each request, so an edited or corrected log updates results naturally
 * with no backfill or staleness — see features/patterns/engine.ts.
 */

export type ObservationType =
  | "period_duration_range"
  | "heaviest_flow_day"
  | "cramp_peak_day"
  | "fatigue_peak_day"
  | "back_pain_recurrence"
  | "headache_recurrence"
  | "bloating_recurrence"
  | "nausea_recurrence"
  | "bowel_change_recurrence"
  | "pain_relief_frequency"
  | "activity_impact_frequency"
  | "checkin_consistency"
  | "mood_trend";

/**
 * V1 generators only ever return a real Observation for 'emerging' or
 * 'sufficient' evidence — below that, the generator returns null rather
 * than an Observation with sufficiency 'insufficient' (see "no false
 * precision", docs/pattern-engine-v1.md). 'insufficient' exists in the
 * type for completeness/future use.
 */
export type ObservationSufficiency = "insufficient" | "emerging" | "sufficient";

export interface ObservationWindow {
  /** Human-readable description of the window considered, e.g. "last 6 completed periods" or "last 28 days". */
  description: string;
  /** Real ISO dates actually spanned by the evidence, when meaningful. */
  since?: string;
  until?: string;
}

export interface PeriodDurationEvidence {
  periodsConsidered: number;
  minDays: number;
  maxDays: number;
}

/** Shared by heaviest-flow-day / cramp-peak-day / fatigue-peak-day — a per-period "peak day" recurs across periodsConsidered; days holds every tied winner. */
export interface PeakDayEvidence {
  periodsConsidered: number;
  usablePeriods: number;
  days: number[];
  recurrenceCount: number;
}

/** Shared by every recurrence-frequency observation (back pain, headache, bloating, nausea, bowel changes, pain relief, activity impact). */
export interface RecurrenceEvidence {
  periodsConsidered: number;
  occurrences: number;
}

export interface CheckInConsistencyEvidence {
  daysConsidered: number;
  checkedInDays: number;
}

export interface MoodTrendEvidence {
  recentWindowDays: number;
  recentLoggedCount: number;
  recentAverage: number;
  priorWindowDays: number;
  priorLoggedCount: number;
  priorAverage: number;
}

export type ObservationEvidence =
  | PeriodDurationEvidence
  | PeakDayEvidence
  | RecurrenceEvidence
  | CheckInConsistencyEvidence
  | MoodTrendEvidence;

export interface Observation<E extends ObservationEvidence = ObservationEvidence> {
  id: string;
  type: ObservationType;
  title: string;
  statement: string;
  evidence: E;
  sufficiency: ObservationSufficiency;
  window: ObservationWindow;
  generatedAt: string;
}
