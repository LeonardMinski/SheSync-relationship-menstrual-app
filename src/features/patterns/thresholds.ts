/**
 * Every numeric threshold the Pattern Engine uses, in one place. See
 * docs/pattern-engine-v1.md for the full rationale behind each one — this
 * file only documents WHY inline, not the wording/behaviour contract.
 */
export const PATTERN_THRESHOLDS = {
  /** Bounded windows — never query unbounded lifetime history. */
  windows: {
    /** Recent completed periods considered by every period-based observation. */
    recentCompletedPeriods: 6,
    /** Recent days considered by daily check-in observations (consistency, mood trend). */
    dailyCheckInDays: 28,
  },

  periodDuration: {
    // Matches the existing MIN_COMPLETED_PERIODS_FOR_AVERAGE precedent
    // (features/period/period.utils.ts) for the "sufficient" tier, with an
    // explicit "emerging" tier at exactly 2 so a genuinely new user isn't
    // shown nothing the moment they have *some* real evidence.
    insufficientBelow: 2,
    emergingAt: 2,
    sufficientAt: 3,
  },

  /** Heaviest-flow-day / cramp-peak-day / fatigue-peak-day share this shape: find each period's peak day(s), then require the winning day(s) to recur across a majority of usable periods before it's worth stating. */
  peakDay: {
    /** Fewer usable (logged) periods than this and a "usual peak day" claim would be false precision from too small a sample. */
    minUsablePeriods: 3,
    /**
     * The winning day(s) must recur in at least half the usable periods,
     * rounded up — e.g. 3 periods needs 2 matches, 5 periods needs 3. Below
     * that the evidence is "mixed/no pattern" and no observation is produced
     * (see docs/pattern-engine-v1.md's tie/ambiguity section).
     */
    minRecurrenceFraction: 0.5,
  },

  /** Back pain / headache / bloating / nausea / bowel changes / pain relief / activity impact — all "occurred in N of M periods" observations. */
  recurrence: {
    /** Fewer periods than this and "N of M" reads as more pattern than it is. */
    minPeriodsConsidered: 3,
    /** A recurrence observation is only worth stating if it happened at least once — "0 of 5" isn't an interesting recurrence claim. */
    minOccurrences: 1,
  },

  checkInConsistency: {
    /** Matches the task's own example ("10 of the past 14 days") — a sub-window of the broader windows.dailyCheckInDays fetch bound. */
    windowDays: 14,
    /** Only worth stating once at least one real check-in exists in the window. */
    minCheckedInDays: 1,
  },

  moodTrend: {
    /** Two consecutive 7-day windows, matching the "last 7 logged days than the previous 7" example. */
    windowDays: 7,
    /**
     * Each 7-day window needs at least this many logged days for its
     * average to be a fair comparison — otherwise a single outlier day
     * could masquerade as a "trend". Majority of the window, rounded up.
     */
    minLoggedPerWindow: 4,
  },
} as const;
