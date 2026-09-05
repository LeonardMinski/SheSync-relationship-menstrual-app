# Period Tracking V1 — UI Contract

Domain: `public.periods` + `public.period_day_logs` (see
`database/period-tracking-v1-migration.sql`). Entirely separate from
`public.cycle_data`, the existing general daily wellbeing record — neither
table replaces or reads from the other. `public.cycle_data.period_flow`
compatibility is discussed at the end of this document.

## Page states

### No active period (`/cycle`, `activePeriod === null`)

- Header: "Your Cycle" + "Track your period whenever it starts." + **Start
  Period** button.
- Zero period history → an honest `EmptyState` ("No periods logged yet").
- One or more completed periods → two cards:
  - **Last Period**: real `start_date`–`end_date` and inclusive duration
    of `history[0]` (history is ordered newest-first). No "Normal"/
    regularity label — duration is shown as a plain fact.
  - **Average Cycle Length**: see "Evidence thresholds" below.
- No phase, no "Day N," no "Expected period in X days," no symptom
  prediction card. All of these existed in the supplied mockup as example
  content and are intentionally not implemented in V1 — see "Excluded
  claims" below.

### Active period (`/cycle`, `activePeriod !== null`)

- Header: "Your Cycle" + "Your period is currently in progress." +
  **End Period** and **Log/Update Today's State** buttons.
- Primary card: "Menstrual Phase" label, real `start_date`, a circular
  **Period Day N** indicator (derived, never stored — see below), and one
  of two factual sentences: "Today's log is complete." or "You haven't
  logged today yet." No hormone or biological-causation sentences.
- Period Timeline: renders **only elapsed days** (`1..periodDay`), each
  showing the actual day number. The current day is highlighted. No day
  is ever labelled "Predicted."
- Today's Snapshot: if `todayLog` exists, shows its real bleeding level,
  cramps, sleep quality (only when logged — it's optional), and mood. If
  not logged, shows an honest "Not logged yet today" message.
- No "Daily Health Insight" card. The supplied mockup's insight text
  ("Ginger or peppermint...") is a treatment claim this feature must not
  make, and there is no real pattern-detection logic to generate an
  honest replacement yet — so the card is omitted entirely rather than
  replaced with something fabricated. Re-add it only once the Pattern
  Engine (explicitly out of scope for this task) exists.

### Log Today (`LogPeriodDayDialog`)

Desktop three-column layout, matching the supplied design:

| Column | Fields |
|---|---|
| Left | Flow (bleeding level, bleeding colour, clots), Pain & Head (cramps, lower-back pain, headache) |
| Centre | Body (bloating, fatigue, nausea, bowel changes) |
| Right | Wellness (sleep quality, mood), Management & Notes (pain relief, activity impact, notes) |

Mobile stacks these in order: Flow → Pain & Head → Body → Wellness →
Management & Notes → Save, per the responsive spec.

Same-date submit **updates** the existing row (`onConflict: period_id,date`
in `/api/periods/day-logs`) — it never creates a duplicate.

## Canonical field values

| Field | Type | Values | Required |
|---|---|---|---|
| Bleeding level | enum | spotting, light, medium, heavy | yes |
| Bleeding colour | enum | bright_red, dark_red, brown | no |
| Clots | enum | none, small, medium, large | yes (defaults to none) |
| Cramps | integer | 0–10 | yes |
| Lower-back pain | integer | 0–10 | yes |
| Headache/migraine | enum | none, mild, moderate, severe | yes |
| Bloating | enum | none, mild, moderate, severe | yes |
| Fatigue | integer | 0–10 (fatigue, not generic energy) | yes |
| Nausea | enum | none, mild, moderate, severe | yes |
| Bowel changes | enum | normal, loose, constipated, more_frequent (displayed "More frequent") | yes |
| Sleep quality | integer | 1 (Very poor) – 5 (Very good) | no |
| Mood | integer | 1–10 — **the same canonical scale as `cycle_data.mood`**, not a separate model | yes |
| Pain relief used | boolean | derived from the UI's None/Ibuprofen/Paracetamol/Other selector | — |
| Pain relief medication | text | null unless pain relief used; free text for "Other" (placeholder: "Enter medication") | conditional |
| Pain relief time | time | optional, only meaningful when pain relief used | no |
| Activity impact | enum | none, some, significant | yes |
| Notes | text | trimmed, max 2000 chars; placeholder "Add anything else you noticed about your period today..." | no |

## Derived fields (never stored)

- **Period Day** = `(log_date - period.start_date) + 1`, computed in
  `src/features/period/period.utils.ts:getPeriodDay`.
- **Duration** = `(end_date - start_date) + 1` (inclusive), computed in
  `getPeriodDuration`. `null` while a period is active.

Both are recomputed from `start_date`/`end_date` on every read, so
correcting a period's start date never requires a backfill of stored day
numbers.

## Evidence thresholds

- **Average cycle length**: requires
  `MIN_COMPLETED_PERIODS_FOR_AVERAGE = 3` completed periods (2
  start-to-start intervals). Below that, the UI shows "Still learning your
  cycle" rather than a number. The average itself is the mean of
  start-to-start day intervals across the available completed periods,
  rounded to one decimal place — see `getAverageCycleLength`.
- **Expected next period**: not implemented in V1. The task explicitly
  permits omission over a fabricated or falsely-confident prediction, and
  V1 omits it rather than building a "clearly labelled estimated window."
- **Phase** (menstrual/follicular/ovulation/luteal): not derived or
  predicted anywhere in this feature. The existing `cycle_data.phase`
  value is a plain user selection in the general wellbeing log dialog, not
  a computed prediction — period tracking does not introduce a new
  phase-prediction algorithm.

## Excluded claims (from the supplied mockups)

The supplied mockups contained example content that does not correspond
to real, computable application data. None of it is implemented:

- **Hormone/biological-causation claims** — "Estrogen and progesterone are
  at their lowest right now." Nothing in this feature states or implies
  hormone levels or biological causation.
- **Treatment/medical advice** — "Ginger or peppermint infusions can
  significantly reduce cramping." This feature makes no treatment
  suggestions.
- **Future-day prediction** — "Day 4 (Predicted)," "Expected Period in 3
  Days." The timeline only ever shows elapsed, real days.
- **Regularity claims** — "Highly regular over last 6 cycles." No
  regularity classification is implemented; only a plain, evidence-gated
  average.
- **Symptom Outlook / fabricated forecasts** — "Mild bloating likely,"
  "Mood remains reflective." No per-user symptom forecasting exists;
  the card is omitted entirely rather than replaced with placeholder
  predictions.

## Error, loading, and success states

- **Loading** active period / history: a spinner in place of the section
  (`usePeriodPageState().loading`).
- **No periods yet**: honest `EmptyState`, not a loading or error state.
- **Start failed / save failed / end failed**: surfaced via
  `actionError` from `usePeriodPageState`, rendered as a dismissible
  banner. Raw Supabase errors are never shown — see "Error translation"
  below.
- **History load failed**: surfaced via `loadError`, distinct from
  `actionError` so a failed history fetch doesn't block a working active-
  period view (or vice versa).
- **Success**: "Period started," "Day saved," "Day updated," "Period
  ended" — set only after the corresponding API call actually succeeds
  (`usePeriodPageState`'s handlers set `successMessage` after `await`ing a
  successful result, never optimistically).

### Error translation (API → user-facing message)

| Condition | Postgres/HTTP signal | User-facing message |
|---|---|---|
| Second active period | `23505` unique violation on `periods_one_active_per_user` | "You already have an active period. End it before starting a new one." (409) |
| End date before start / log date outside period bounds | `23514` check violation / trigger `RAISE EXCEPTION` | "End date cannot be before the start date" / "That date falls outside this period" (400) |
| RLS denial | `42501` | "Period data access denied" (403) |
| Migration not yet run | `42P01` (relation does not exist) | "Period tracking is not fully set up yet. Run the period-tracking-v1 migration." (500) |
| Ending an already-ended period | application-level check before update | "This period has already ended" (400) |
| No active period to log against | application-level check before upsert | "No active period to log against. Start a period first." (400) |

## Privacy

`periods` and `period_day_logs` are **owner-only**: RLS policies on both
tables are `auth.uid() = user_id` for all four operations (matching the
existing `cycle_data` policy shape exactly), and neither table is
referenced by `get_partner_shared_data()` or any other partner-facing
function. This migration does not modify partner sharing toggles, RLS on
`cycle_data`/`users`, or `get_partner_shared_data()` in any way. A partner
— even with an active, fully-shared connection — has no RLS path to a
single raw row in either table.

## `period_flow` compatibility

`cycle_data.period_flow` (light/medium/heavy, set via the general
wellbeing log) is **not removed or migrated** by this feature. It now
overlaps in meaning with `period_day_logs.bleeding_level`
(spotting/light/medium/heavy) for users who log both. This is a known,
intentional duplication for V1 — deduplicating it (e.g., having the
general wellbeing form read/write `bleeding_level` instead of its own
`period_flow` once a period is active) is deferred to a future slice, so
as not to change `cycle_data`'s existing read/write contract in this task.

## Mood: canonical model decision

The supplied Log Today mockup showed a numeric 1–10 mood control, which
matches `cycle_data.mood`'s existing 1–10 scale exactly. `period_day_logs`
reuses that same scale and meaning rather than introducing a separate
period-specific mood taxonomy — see the comment on
`period_day_logs.mood` in the migration.

## Pain relief UI adaptation

The domain stores `pain_relief_used` (boolean), `pain_relief_medication`
(nullable text), and `pain_relief_time` (nullable time) — no dosage,
frequency, or treatment-recommendation fields exist anywhere in this
feature. The UI offers None / Ibuprofen / Paracetamol / Other:

- **None** → `pain_relief_used = false`; medication and time are cleared.
- **Ibuprofen / Paracetamol** → `pain_relief_used = true`,
  `pain_relief_medication` set to that exact label.
- **Other** → `pain_relief_used = true`; a free-text field appears
  (placeholder "Enter medication," never "Heat wrap" or similar).
- **Time taken** is optional and only shown once a relief option other
  than None is selected.

The database enforces this shape independently of the UI: a `CHECK`
constraint rejects any row where `pain_relief_medication` or
`pain_relief_time` is set while `pain_relief_used = false`.
