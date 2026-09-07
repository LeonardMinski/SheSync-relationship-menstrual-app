# Canonical Daily Mood — Compatibility Decision

Written for the Home/Cycle Experience Correction Pass (HOME-01B). Supersedes
the "neither table replaces or reads from the other" claim in
`period-tracking-ui-contract.md` — that was true before this pass; it no
longer is, for the mood field specifically.

## The problem

Two tables each stored their own `mood` (1-10) for a given user/date, with
no synchronisation between them:

- `public.cycle_data.mood` — written by the Home "Daily Check-in" job
  (`services/cycle/dailyMood.ts`, `/api/cycle`). One row per
  `(user_id, date)`.
- `public.period_day_logs.mood` — written by the Period Log job
  (`/api/periods/day-logs`), scoped to `(period_id, date)`.

A user could end up with two different, contradictory mood values for the
same real date, and neither the Home Daily Check-in nor the Period Log
would ever show or reflect the other's value.

## The decision

**`cycle_data.mood` is the single canonical daily mood.** Reasons:

- It already has a real `UNIQUE (user_id, date)` constraint — genuinely one
  row per day, independent of whether a period is active.
- It's writable on every day of the cycle, not just period days, which
  matches "mood" as a concept — a period day still has a mood, and the
  Daily Check-in job needs somewhere to write to on non-period days too.

`period_day_logs.mood` cannot be dropped without a schema migration (it's a
`NOT NULL` column with existing historical data), so it stays as a
**synced mirror**, not a second source of truth:

- Saving a period day log (`usePeriodPageState.saveDayLog`) also upserts
  the canonical `cycle_data` mood for that date, via
  `services/cycle/dailyMood.ts#upsertDailyMood`. This is best-effort: if
  the sync call fails, the period day log save still succeeds (the two
  writes are not one transaction), and the failure is logged, not
  surfaced as if the period log itself failed to save.
- Opening the period log dialog (`LogPeriodDayDialog`) pre-fills its mood
  field from the canonical `cycle_data` value for that date when one
  exists, falling back to the period log's own previously-stored value
  only when there is no canonical entry yet for that date. This is a
  **display/prefill decision only** — no historical value is ever
  overwritten by this read.

## Write path (same rule on both surfaces)

`services/cycle/dailyMood.ts` always looks up whether a `cycle_data` row
already exists for the target date first:

- **Row exists** → `PUT /api/cycle` with just `{ id, mood, ...optional
  fields actually supplied }`. This is a genuine partial update — it
  never resets energy/sleep/stress/notes that were already logged for
  that day.
- **No row yet** → `POST /api/cycle` with `{ date, phase, mood,
  ...optional fields }`. `phase` is a required legacy column on
  `cycle_data` with no real meaning here (see below) — it's set to
  `"menstrual"` when a period is active that day, `"follicular"`
  otherwise, and never shown to the user.

This is what "same date updates rather than duplicates" means in practice:
there is never more than one `cycle_data` row per date, regardless of
which surface (Daily Check-in or Period Log) wrote to it last.

## `cycle_data.phase` is legacy, not a phase-detection model

There is no real cycle-phase detection anywhere in this app (see
`features/home/homeState.ts`). `cycle_data.phase` predates the
`periods`/`period_day_logs` tables and remains a required column only
because the pre-existing full `CycleLogDialog` form used to ask for it
directly. This correction pass retired that form from Home entirely (see
below); the placeholder value written by `dailyMood.ts` exists solely to
satisfy the column's `NOT NULL` constraint via the unchanged `/api/cycle`
route contract, and carries no product meaning.

## What this pass removed, and why

The old Home experience had **three** places that each independently
asked "how are you / what's your state":

1. `QuickCheckIn` — tap a feeling-word tile → opened the full
   `CycleLogDialog` (phase + mood + energy + sleep + libido + stress +
   symptoms + notes).
2. `YourStateCard` ("Your State Today") — its own "Check in now" button
   opened the *same* `CycleLogDialog`.
3. The Period Log's own mood field, unsynced from the above (this doc's
   main subject).

(1) and (2) already wrote to the same table, so removing the duplicate
*entry points* was safe: `QuickCheckIn` is replaced by the new
`DailyCheckIn` (one-tap 5-point mood + optional energy/stress/sleep/note),
`YourStateCard` is removed outright (HOME-02), and the old
`CycleLogDialog`/`useCyclePageState`/`RecentEntries`/`PhaseIcon`/
`CycleInsightsPanel` component tree is deleted as dead code once nothing
opens it any more. `cycle_data.symptoms`/`phase` remain valid, unused-by-UI
columns — no data was deleted, only the form that wrote to them from Home.
