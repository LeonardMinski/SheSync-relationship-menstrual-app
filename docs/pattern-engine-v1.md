# Pattern Engine V1 — Contract

This is the canonical contract for SheSync+'s Pattern Engine. It exists to
answer, for every observation the app can ever show a user: what real data
produced this, how much evidence was required, and what it must never claim.

If a change to `src/features/patterns/**` would make this document
inaccurate, the document must change in the same commit.

## Non-negotiable rules

The Pattern Engine is **deterministic**, never AI/LLM-based. It:

- MUST NOT use an LLM to discover, phrase, or embellish a pattern.
- MUST NOT diagnose, infer hormone levels, infer fertility, or claim
  biological causation or medical significance.
- MUST NOT fabricate an observation to fill empty UI space. Insufficient
  evidence produces no observation — the caller falls back to an honest
  "still learning" state.
- MUST NOT use relationship data, Vault, Coach conversation history, or
  Partner Translation content. The only source data is `periods`,
  `period_day_logs`, and `cycle_data` (daily check-ins), all scoped to the
  authenticated caller's own `user_id`.
- MUST NOT be exposed to a partner. Observations are private personal data;
  they are never added to `get_partner_shared_data()` or any partner-facing
  surface. A user may later choose to hand-write something inspired by an
  observation into Partner Translation, but that is an explicit, manual act
  — the engine itself never crosses that boundary.

Every generator is a pure function: real logs in, a typed `Observation` (or
`null`) out. No I/O happens inside `src/features/patterns/**` — all Supabase
fetching lives in `src/app/api/patterns/route.ts` and
`src/features/coach/context.ts`.

## The canonical model

```ts
interface Observation<E> {
  id: string;
  type: ObservationType;
  title: string;
  statement: string;       // the only user-facing prose — plain, hedged, honest
  evidence: E;              // structured, inspectable — never just a confidence score
  sufficiency: "insufficient" | "emerging" | "sufficient";
  window: { description: string; since?: string; until?: string };
  generatedAt: string;
}
```

Nothing is persisted in V1 (see "Why nothing is persisted" below). Every
observation is recalculated from source data on each request, so a
correction to a logged period or day-log propagates immediately and
correctly — there is no stale cached prose to invalidate.

`sufficiency` is binary for every type except Period Duration Range, which
is the only type the task spec itself defined a 3-tier "insufficient /
emerging / sufficient" scheme for. Every other type either has enough
recurring evidence (`sufficient`) or produces `null` — there is no
"emerging" tier for a peak-day or recurrence claim, because the task never
specified what a partial version of "cramps peaked on Day 2 in 2 of 3
periods" would even mean without inventing new wording rules.

## Bounded windows

Nothing here ever queries unbounded lifetime history:

| Window | Value | Used by |
|---|---|---|
| Recent completed periods | last 6 | every period-based observation (duration, peak-day, recurrence) |
| Daily check-in fetch bound | last 28 days | check-in consistency, mood trend |

The 28-day fetch bound is the outer limit the API/Coach-context layer
queries; check-in consistency itself reports on a 14-day sub-window (see
below) to match the task's own worked example ("10 of the past 14 days").

## The 13 observation types

### A — Period Duration Range (`period_duration_range`)

- **Source**: `periods.start_date`, `periods.end_date` for completed periods
  in the window. Day logs are not required.
- **Eligibility / minimum evidence**: fewer than 2 completed periods →
  `null` (no observation). Exactly 2 → `emerging`. 3 or more → `sufficient`.
- **Calculation**: duration = inclusive day count (`end_date - start_date +
  1`) per period; report `min` and `max` across the window.
- **Ties**: if every period has the same duration, state the single number
  rather than a fabricated range.
- **Wording**: `"Your recent periods have lasted between {min} and {max}
  days."` (or `"...lasted {n} days."` when min = max). Never "normal",
  "abnormal", or "regular".

### B — Heaviest/Typical Flow Day (`heaviest_flow_day`)

- **Source**: `period_day_logs.bleeding_level` (`spotting < light < medium <
  heavy`) joined to each period.
- **Eligibility**: at least 3 *usable* periods (periods with ≥1 day log in
  the window). Fewer → `null`.
- **Calculation**: for each usable period, find the day(s) with the highest
  bleeding-level rank (a period can have a tied peak on multiple days — each
  contributes to all of them). Tally which day-number(s) recur most often
  across periods. The winning day-number(s) must recur in at least half the
  usable periods (rounded up) or the result is too mixed → `null`.
- **Ties**: reported honestly via `formatDayRange` — `"Day 2"` for a single
  winner, `"Days 1–2"` for a contiguous tie, `"Days 1 and 4"` / `"Days 1, 3
  and 5"` for a scattered tie.
- **Wording**: `"Your heaviest flow has most often been on {days} in your
  recent logged periods."`

### C — Cramp Peak (`cramp_peak_day`)

- **Source**: `period_day_logs.cramps` (numeric).
- **Eligibility / calculation**: identical shape to B, via the shared
  `generatePeakDayObservation` helper. A period whose max cramp value is `0`
  contributes nothing to the tally (an all-zero period has no meaningful
  "peak" to vote with).
- **Wording**: `"Cramps have most often been strongest during {days}."`
  Never a severity or medical claim.

### D — Fatigue Peak (`fatigue_peak_day`)

- Same shape as C, over `period_day_logs.fatigue`. Same zero-skip rule.
- **Wording**: `"Fatigue has most often been highest on {days} in your
  recent periods."`

### E — Lower-Back Pain Recurrence (`back_pain_recurrence`)

- **Source**: `period_day_logs.lower_back_pain` (numeric).
- **Eligibility**: at least 3 periods considered (usable or not — see
  "recurrence denominator" below). Occurred in 0 of them → `null`.
- **Calculation**: an occurrence = any day in that period with
  `lower_back_pain > 0`. Report `"{occurrences} of your last {periods}
  periods"`.
- **Wording**: `"You logged lower-back pain during {n} of your last {m}
  periods."` Never implies causation.

### F — Headache Recurrence (`headache_recurrence`)

- Same shape as E. Occurrence = `period_day_logs.headache !== "none"`.
- **Wording**: `"You logged headaches during {n} of your last {m}
  periods."`

### G — Bloating Recurrence (`bloating_recurrence`)

- Same shape as E. Occurrence = `period_day_logs.bloating !== "none"`.
- **Wording**: `"You logged bloating during {n} of your last {m}
  periods."`

### H — Nausea Recurrence (`nausea_recurrence`)

- Same shape as E. Occurrence = `period_day_logs.nausea !== "none"`.
- **Wording**: `"You logged nausea during {n} of your last {m} periods."`

### I — Bowel-Change Recurrence (`bowel_change_recurrence`)

- Same shape as E. Occurrence = `period_day_logs.bowel_changes !==
  "normal"`.
- **Wording**: `"You logged bowel changes during {n} of your last {m}
  periods."` No medical conclusion of any kind (not IBS, not a digestive
  condition — purely "you logged this").

### J — Pain-Relief Frequency (`pain_relief_frequency`)

- Same shape as E. Occurrence = `period_day_logs.pain_relief_used`.
- **Wording**: `"You used pain relief during {n} of your last {m} logged
  periods."` A record of the user's own logged behaviour only — never a
  medication recommendation or dosage suggestion.

### K — Activity-Impact Frequency (`activity_impact_frequency`)

- Same shape as E. Occurrence = `period_day_logs.activity_impact` equal to
  `"some"` or `"significant"`.
- **Wording**: `"Period symptoms affected your normal activities during {n}
  of your last {m} periods."` Never "disability" or any clinical impairment
  framing.

**Recurrence denominator (E–K)**: `periodsConsidered` is the *entire*
window (up to 6 recent completed periods), including any period that has
zero day logs — a logless period counts toward the denominator with 0
occurrences. This matches the honest "N of your last M periods" phrasing:
a period the user didn't log symptoms for is not evidence of absence, but
it is still one of "your last M periods."

### L — Daily Check-in Consistency (`checkin_consistency`)

- **Source**: distinct `cycle_data.date` rows in the trailing 14 days
  (inclusive of today), out of the broader 28-day fetch.
- **Eligibility**: at least 1 real check-in in the window; otherwise
  `null` — an engagement fact with zero evidence isn't worth stating.
- **Calculation**: count of distinct logged dates in the 14-day window.
- **Wording**: `"You checked in on {n} of the past 14 days."` Explicitly
  **not** gamified — no streak count, no "keep it up!", no XP, no badge
  language.

### M — Simple Recent Mood Trend (`mood_trend`)

- **Source**: `cycle_data.mood`, the canonical 1–10 numeric daily mood
  field. This observation exists *only* because that field is genuinely
  numeric — if mood were ever a categorical scale, this type would not
  apply and must not be approximated onto one.
- **Eligibility**: two consecutive real calendar 7-day windows, each with
  at least 4 logged days (a majority of the window, rounded up). Either
  window under that threshold → `null`.
- **Calculation**: `average(recentWindow)` vs `average(priorWindow)`,
  rounded to 1 decimal. If the two averages are exactly equal → `null` (no
  fabricated trend from nothing).
- **Wording**: `"Your average mood was {lower|higher} over the last 7
  logged days than the previous 7."` Purely directional — never "declining"
  / "improving", and never a guess at *why*.

## Engine architecture

```
src/features/patterns/
  thresholds.ts               PATTERN_THRESHOLDS — every magic number, with rationale
  periodObservations.ts       A–K: generatePeriodDurationObservation, generatePeakDayObservation
                               (→ heaviest flow / cramp peak / fatigue peak), generateRecurrenceObservation
                               (→ the 7 recurrence types), formatDayRange
  dailyCheckInObservations.ts L–M: generateCheckInConsistencyObservation, generateMoodTrendObservation
  engine.ts                   generateObservations() — pure orchestrator; selectHomeObservation() — Home's
                               single-slot priority selection
  presentation.ts             formatEvidenceCaption() — human-readable evidence captions for Cycle's UI
```

Every generator takes plain typed input (`PeriodWithDayLogs[]`,
`Pick<CycleEntry, "date" | "mood">[]`) and returns `Observation | null`.
None of them touch Supabase, `fetch`, or any I/O — that isolation is what
makes them fully unit-testable and is what "deterministic calculation" in
the pipeline (REAL LOGS → DETERMINISTIC CALCULATION → EVIDENCE CHECK →
OBSERVATION → PRESENTATION) means concretely.

## Server integration

`GET /api/patterns` (`src/app/api/patterns/route.ts`):

1. Authenticates the request; rejects with 401 if unauthenticated.
2. Derives `user.id` from the authenticated session only — never from a
   client-supplied id or query parameter, even if one is present.
3. Fetches `periods` (last 6 completed, with their `period_day_logs`) and
   `cycle_data` (last 28 days) scoped to `user_id`.
4. Runs `generateObservations()`.
5. Returns `{ observations }`. A brand-new user with no data gets a `200`
   with `observations: []` — never an error, never a fabricated example.

No other table is ever queried by this route or by
`src/features/patterns/**`.

## Home integration

`src/components/dashboard/Dashboard.tsx` calls `selectHomeObservation`
with the caller's current observations and whether a period is currently
active, and shows exactly one:

- **Active period priority**: cramp peak → heaviest flow day → fatigue
  peak → back pain → headache → bloating → nausea → bowel changes → pain
  relief → activity impact.
- **Between periods priority**: period duration range → back pain →
  headache → bloating → nausea → bowel changes → pain relief → activity
  impact → check-in consistency → mood trend.

Only `sufficiency: "sufficient"` observations are eligible for Home's
single slot (an `"emerging"` observation is real, but Home reserves its one
slot for the strongest available claim). If nothing matches, Home falls
back to its existing honest "Still learning your pattern" state — never a
fabricated replacement.

## Cycle integration

`src/components/cycle/PatternsSection.tsx` (rendered on
`/cycle/history`) shows every real observation the engine produced, both
`sufficient` and `emerging`, each with a human-readable evidence caption
from `formatEvidenceCaption()` (e.g. "Based on 4 recent logged periods") —
deliberately not a black-box confidence percentage. An `emerging`
observation carries a "Still emerging" badge. The empty state reads "Still
learning your patterns..." rather than showing nothing or fabricating
content.

## Coach integration

`src/features/coach/context.ts`'s `buildCoachContext` runs the exact same
`generateObservations()` engine when the caller has enabled the "Recent
observations" context source. Coach is handed only the resulting
`observation.statement` lines, formatted as:

```
Recent observations (calculated from your logged history, not AI-generated):
- <statement>
- <statement>
```

Coach never receives raw `period_day_logs` or `cycle_data` for this
purpose and never pattern-matches on its own — the boundary between
"deterministic calculation" and "AI conversation" is enforced at this
handoff. `DEFAULT_COACH_CONTEXT_SELECTION.recentObservations` is `true`,
but the source only actually contributes text when the caller has at least
one real observation; an empty result contributes nothing to the context,
never a fabricated one. The UI (`CoachContextPanel`, `CoachContextStrip`)
only presents the toggle as usable when `recentObservationsAvailable` is
true for that specific user right now.

## Partner privacy

Observations are private personal data by default. Nothing in
`src/features/patterns/**` or `src/app/api/patterns/**` references
`get_partner_shared_data()`, any `partner_*` table, or any relationship
table — verified by direct grep, not just by omission. A user may later
choose to manually write something inspired by an observation into Partner
Translation; the engine itself never performs that hand-off automatically.

## Why nothing is persisted

V1 deliberately does not persist observations. Every request recalculates
from source data, which means a correction to a period or day-log is
reflected immediately and correctly, with no cache-invalidation logic to
get wrong. No performance reason to persist was found during this build —
the bounded windows above keep every query cheap. If a future change makes
persistence genuinely necessary, that is a decision to make explicitly
(and to document the resulting staleness trade-offs here), not a default.

## Language rules

**Use**: "You logged...", "Your recent periods...", "In 4 of your last 5
logged periods...", "Most often...", "Based on the periods you've
logged...", "Still learning...".

**Never use**: "Your hormones...", "This causes...", "This means you
have...", "Abnormal" / "Normal" / "Healthy" / "Unhealthy", "Your body
always...", any streak/XP/gamification language, any medical diagnosis or
severity claim, any fertility or hormone-level inference.
