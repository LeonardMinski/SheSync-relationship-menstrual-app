-- ONE-TIME MIGRATION. Do not add IF NOT EXISTS to the ADD COLUMN below —
-- that's what makes a second run fail loudly instead of silently
-- re-marking every real in-progress new user as complete.

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
-- Do not run this UPDATE on its own again later, and do not re-run this file.
UPDATE public.users
SET onboarding_completed_at = NOW()
WHERE onboarding_completed_at IS NULL;

COMMIT;

