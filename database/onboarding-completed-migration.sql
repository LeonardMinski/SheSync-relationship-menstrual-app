-- =====================================================
-- SheSync+ Onboarding Completion Migration
-- =====================================================
-- Adds a single, nullable completion-timestamp column to public.users so
-- the app can tell "has completed onboarding" from "has not," without a
-- separate boolean flag.
--
-- NULL             -> onboarding not completed
-- <timestamptz>    -> onboarding completed at that time
--
-- THIS IS A ONE-TIME MIGRATION. IT IS NOT SAFE TO RE-RUN.
--
-- After this migration has run once, real new users are expected to have
-- onboarding_completed_at = NULL until they actually complete onboarding.
-- The backfill below (`UPDATE ... WHERE onboarding_completed_at IS NULL`)
-- cannot distinguish "a pre-existing user who was correctly grandfathered
-- and somehow still NULL" from "a brand-new, genuinely-incomplete user" —
-- both look identical to that WHERE clause. Running this file a second
-- time, after new users have signed up, would silently and incorrectly
-- mark every one of those new, still-onboarding users as complete. That is
-- why `ADD COLUMN` below has no `IF NOT EXISTS`: on a second run it will
-- fail loudly ("column already exists") instead of silently corrupting the
-- field's meaning. Do not add IF NOT EXISTS back to work around that error
-- — if you hit it, the column already exists and this file should not run
-- again; investigate instead of forcing it through.
--
-- Nothing in this file has been run against a live database as of writing.
-- It is staged here for manual review before being applied.
--
-- ---------------------------------------------------------------
-- Semantics, spelled out (read before running):
--
-- * Existing users present at migration time are grandfathered as
--   complete, once, by this migration. They already use the product;
--   forcing them through a new onboarding wizard retroactively would be a
--   regression, not a feature.
--
-- * Users created AFTER this migration runs get NULL, because there is
--   deliberately NO column DEFAULT. A non-NULL default would silently mark
--   every future signup as "already onboarded" too, which defeats the
--   point of this column. Postgres's own implicit NULL-for-new-column
--   behavior already covers new rows correctly with no DEFAULT clause at
--   all; nothing further is needed for that half.
--
-- * The backfilled timestamp for existing rows is the migration's own run
--   time (NOW()), not each user's historical created_at, and it is not a
--   real historical onboarding-completion event. created_at predates the
--   existence of onboarding entirely; NOW() at least honestly records "this
--   row was grandfathered by this migration on this date," not "this user
--   completed an onboarding flow that didn't exist yet." Neither value
--   should ever be read as evidence the user actually went through
--   onboarding — for grandfathered rows, they did not.
-- ---------------------------------------------------------------

BEGIN;

ALTER TABLE public.users
  ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- One-time grandfathering backfill, part of this same one-time migration.
-- Do not run this UPDATE on its own again later, and do not re-run this
-- file — see the warning above.
UPDATE public.users
SET onboarding_completed_at = NOW()
WHERE onboarding_completed_at IS NULL;

COMMIT;

-- ---------------------------------------------------------------
-- RLS: no policy change required, and none was made here.
--
-- "Users can update own profile" (auth.uid() = id, FOR UPDATE) in
-- supabase-schema.sql already covers writes to this new column — it's just
-- another column on a row the owner can already update. No new correctness
-- problem was identified that would justify touching RLS.
--
-- handle_new_auth_user()'s trigger explicitly lists the columns it inserts
-- (id, email, name, subscription_tier, privacy_settings) and does not
-- include onboarding_completed_at, so every row it creates after this
-- migration gets the column's implicit NULL — every new signup starts with
-- onboarding incomplete, as intended. Not modified here.
-- =====================================================
