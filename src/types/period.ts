export type BleedingLevel = "spotting" | "light" | "medium" | "heavy";
export type BleedingColour = "bright_red" | "dark_red" | "brown";
export type ClotLevel = "none" | "small" | "medium" | "large";
export type SymptomSeverity = "none" | "mild" | "moderate" | "severe";
export type BowelChange = "normal" | "loose" | "constipated" | "more_frequent";
export type ActivityImpact = "none" | "some" | "significant";

export interface Period {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * mood is 1-10 — the same canonical scale and meaning already used by
 * cycle_data (see CycleEntry.mood in src/types/cycle.ts), not a separate
 * period-specific mood model.
 */
export interface PeriodDayLog {
  id: string;
  period_id: string;
  user_id: string;
  date: string;
  bleeding_level: BleedingLevel;
  bleeding_colour: BleedingColour | null;
  clots: ClotLevel;
  cramps: number;
  lower_back_pain: number;
  headache: SymptomSeverity;
  bloating: SymptomSeverity;
  fatigue: number;
  nausea: SymptomSeverity;
  bowel_changes: BowelChange;
  sleep_quality: number | null;
  mood: number;
  pain_relief_used: boolean;
  pain_relief_medication: string | null;
  pain_relief_time: string | null;
  activity_impact: ActivityImpact;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Everything here is derived at read time — see features/period/period.utils.ts. */
export interface PeriodSummary {
  id: string;
  start_date: string;
  end_date: string | null;
  isActive: boolean;
  /** Inclusive day count; null while the period is still active. */
  durationDays: number | null;
  loggedDayCount: number;
}

export interface PeriodWithLogs extends Period {
  logs: PeriodDayLog[];
}

export interface StartPeriodInput {
  startDate?: string;
}

export interface EndPeriodInput {
  endDate?: string;
}

export interface UpsertPeriodDayLogInput {
  date?: string;
  bleedingLevel: BleedingLevel;
  bleedingColour?: BleedingColour | null;
  clots?: ClotLevel;
  cramps: number;
  lowerBackPain: number;
  headache: SymptomSeverity;
  bloating: SymptomSeverity;
  fatigue: number;
  nausea: SymptomSeverity;
  bowelChanges: BowelChange;
  sleepQuality?: number | null;
  mood: number;
  painReliefUsed: boolean;
  painReliefMedication?: string | null;
  painReliefTime?: string | null;
  activityImpact: ActivityImpact;
  notes?: string | null;
}
