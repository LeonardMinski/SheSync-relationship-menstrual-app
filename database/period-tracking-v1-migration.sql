-- =====================================================
-- SheSync+ Period Tracking V1
-- =====================================================
-- Adds a dedicated menstrual period domain alongside the existing
-- public.cycle_data daily wellbeing record. Nothing in this file has been
-- run against a live database yet.
--
-- public.cycle_data is NOT modified or rewritten by this migration.
--
-- Product model:
--   periods          = one row per menstrual period a user has tracked.
--                       end_date IS NULL means that period is still active.
--   period_day_logs  = one row per (period, calendar date) — the detailed
--                       symptom/flow log for a single day of a period.
--
-- Period day number and period duration are deliberately NOT stored —
-- both are derived at read time from start_date/end_date/log date
-- (see docs/period-tracking-ui-contract.md), so there is nothing to keep
-- in sync if a start or end date is ever corrected.
--
-- Privacy: both tables are owner-only. Neither is referenced by
-- get_partner_shared_data() or any other partner-facing function, and this
-- migration does not touch that function, RLS on cycle_data/users, or any
-- partner sharing toggle. A partner — even with an active, fully-shared
-- connection — has no RLS path to a single raw row in either table.
-- =====================================================

BEGIN;

-- ---------------------------------------------------
-- 1. periods
-- ---------------------------------------------------
CREATE TABLE public.periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT periods_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Invariant: at most one active (end_date IS NULL) period per user.
CREATE UNIQUE INDEX periods_one_active_per_user
    ON public.periods (user_id)
    WHERE end_date IS NULL;

CREATE INDEX periods_user_start_idx
    ON public.periods (user_id, start_date DESC);

-- ---------------------------------------------------
-- 2. period_day_logs
-- ---------------------------------------------------
-- mood is 1-10, matching the canonical mood scale already used by
-- public.cycle_data (see src/types/cycle.ts CycleEntry.mood) — this is
-- deliberately the SAME scale and meaning, not a separate period-specific
-- mood model.
CREATE TABLE public.period_day_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id uuid NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,

    bleeding_level text NOT NULL
        CHECK (bleeding_level IN ('spotting', 'light', 'medium', 'heavy')),
    bleeding_colour text NULL
        CHECK (bleeding_colour IS NULL OR bleeding_colour IN ('bright_red', 'dark_red', 'brown')),
    clots text NOT NULL DEFAULT 'none'
        CHECK (clots IN ('none', 'small', 'medium', 'large')),

    cramps integer NOT NULL CHECK (cramps BETWEEN 0 AND 10),
    lower_back_pain integer NOT NULL CHECK (lower_back_pain BETWEEN 0 AND 10),
    headache text NOT NULL
        CHECK (headache IN ('none', 'mild', 'moderate', 'severe')),

    bloating text NOT NULL
        CHECK (bloating IN ('none', 'mild', 'moderate', 'severe')),
    fatigue integer NOT NULL CHECK (fatigue BETWEEN 0 AND 10),
    nausea text NOT NULL
        CHECK (nausea IN ('none', 'mild', 'moderate', 'severe')),
    bowel_changes text NOT NULL
        CHECK (bowel_changes IN ('normal', 'loose', 'constipated', 'more_frequent')),

    sleep_quality integer NULL
        CHECK (sleep_quality IS NULL OR sleep_quality BETWEEN 1 AND 5),
    mood integer NOT NULL CHECK (mood BETWEEN 1 AND 10),

    pain_relief_used boolean NOT NULL DEFAULT false,
    pain_relief_medication text NULL,
    pain_relief_time time NULL,
    -- Selecting "None" in the UI means pain_relief_used = false, and no
    -- medication/time should ever be attached to that state.
    CONSTRAINT period_day_logs_pain_relief_medication_requires_used
        CHECK (pain_relief_used = true OR pain_relief_medication IS NULL),
    CONSTRAINT period_day_logs_pain_relief_time_requires_used
        CHECK (pain_relief_used = true OR pain_relief_time IS NULL),

    activity_impact text NOT NULL
        CHECK (activity_impact IN ('none', 'some', 'significant')),
    notes text NULL,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Invariant: one row per (period, date) — logging the same date again
    -- updates the existing row rather than creating a duplicate.
    CONSTRAINT period_day_logs_period_date_unique UNIQUE (period_id, date)
);

CREATE INDEX period_day_logs_user_date_idx
    ON public.period_day_logs (user_id, date DESC);
CREATE INDEX period_day_logs_period_idx
    ON public.period_day_logs (period_id);

-- ---------------------------------------------------
-- 3. Cross-table invariants (CHECK constraints cannot reference another
-- table, so these need a trigger): log ownership must match the period's
-- owner, and the log date must fall within [start_date, end_date].
-- ---------------------------------------------------
-- Deliberately NOT SECURITY DEFINER: this runs as the inserting/updating
-- role. Since RLS on periods (section 4) already restricts SELECT to
-- auth.uid() = user_id, a caller attempting to attach a log to a period
-- they don't own gets a "not found" row here (RLS hides it) and the
-- function raises before the write can happen — the same narrow function
-- enforces both data integrity and cross-user isolation, with no elevated
-- privilege of its own.
CREATE OR REPLACE FUNCTION public.validate_period_day_log()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_period record;
BEGIN
    SELECT user_id, start_date, end_date INTO v_period
    FROM public.periods
    WHERE id = NEW.period_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'period_day_logs.period_id does not reference an existing, visible period';
    END IF;

    IF v_period.user_id <> NEW.user_id THEN
        RAISE EXCEPTION 'period_day_logs.user_id must match the owning period''s user_id';
    END IF;

    IF NEW.date < v_period.start_date THEN
        RAISE EXCEPTION 'period_day_logs.date cannot be before the period''s start_date';
    END IF;

    IF v_period.end_date IS NOT NULL AND NEW.date > v_period.end_date THEN
        RAISE EXCEPTION 'period_day_logs.date cannot be after the period''s end_date';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER period_day_logs_validate
    BEFORE INSERT OR UPDATE ON public.period_day_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_period_day_log();

-- ---------------------------------------------------
-- 4. updated_at maintenance (narrow, single-purpose, no cross-table access)
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER periods_set_updated_at
    BEFORE UPDATE ON public.periods
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER period_day_logs_set_updated_at
    BEFORE UPDATE ON public.period_day_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------
-- 5. RLS — owner-only, matching the existing cycle_data policy shape
-- exactly. No policy here (or anywhere else in this file) grants a
-- partner/viewer any access — that is what "owner-only" means in
-- practice: there is no other row-visibility path.
-- ---------------------------------------------------
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_day_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own periods" ON public.periods
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own periods" ON public.periods
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own periods" ON public.periods
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own periods" ON public.periods
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own period day logs" ON public.period_day_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own period day logs" ON public.period_day_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own period day logs" ON public.period_day_logs
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own period day logs" ON public.period_day_logs
    FOR DELETE USING (auth.uid() = user_id);

COMMIT;
