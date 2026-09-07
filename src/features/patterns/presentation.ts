import type {
  CheckInConsistencyEvidence,
  MoodTrendEvidence,
  Observation,
  PeakDayEvidence,
  PeriodDurationEvidence,
  RecurrenceEvidence,
} from "@/types/patterns";

/**
 * A short, human-readable caption for the evidence behind an observation —
 * "inspectable enough to understand why it exists" (task spec), never a
 * black-box confidence percentage. Pure presentation, no calculation.
 */
export function formatEvidenceCaption(observation: Observation): string {
  switch (observation.type) {
    case "period_duration_range": {
      const evidence = observation.evidence as PeriodDurationEvidence;
      return `Based on ${evidence.periodsConsidered} recent logged period${evidence.periodsConsidered === 1 ? "" : "s"}`;
    }
    case "heaviest_flow_day":
    case "cramp_peak_day":
    case "fatigue_peak_day": {
      const evidence = observation.evidence as PeakDayEvidence;
      return `Based on ${evidence.usablePeriods} recent logged periods`;
    }
    case "back_pain_recurrence":
    case "headache_recurrence":
    case "bloating_recurrence":
    case "nausea_recurrence":
    case "bowel_change_recurrence":
    case "pain_relief_frequency":
    case "activity_impact_frequency": {
      const evidence = observation.evidence as RecurrenceEvidence;
      return `Based on ${evidence.periodsConsidered} recent periods`;
    }
    case "checkin_consistency": {
      const evidence = observation.evidence as CheckInConsistencyEvidence;
      return `Based on the last ${evidence.daysConsidered} days`;
    }
    case "mood_trend": {
      const evidence = observation.evidence as MoodTrendEvidence;
      return `Based on ${evidence.recentLoggedCount} recent logged days vs ${evidence.priorLoggedCount} prior logged days`;
    }
    default:
      return observation.window.description;
  }
}
