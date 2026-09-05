-- ONE-TIME MIGRATION. Adds public.users.tracking_enabled — see
-- src/features/account/capabilities.ts for the application-level model.
--
-- SEMANTICS
-- * true  = this account can use self-tracking features (Cycle, Coach,
--           Vault).
-- * false = this account currently does not use self-tracking features
--           (a partner-only account). It may still be the OWNER of a
--           partner relationship (invite a viewer) or the VIEWER of one —
--           tracking_enabled is deliberately independent of partner_links.
--
-- MIGRATION SEMANTICS (chosen deliberately — see RULE constraints)
-- * Column DEFAULT is `true`. This is safe here, unlike a NOT NULL default
--   would be for something like onboarding_completed_at, because every
--   INSERT path that actually creates a public.users row (the
--   handle_new_auth_user trigger below, and the client-side
--   loadOrCreateUserProfile fallback in src/services/auth/index.ts)
--   explicitly computes and supplies its own value — the column default
--   only applies as a last-resort safety net for some other insert path
--   that doesn't specify the column at all (e.g. a manual admin insert),
--   where "assume tracking" is the correct default for an unlabeled row.
-- * Existing rows: `ADD COLUMN ... DEFAULT true` backfills every existing
--   row to true as part of the same DDL statement — no separate UPDATE is
--   needed. This grandfathers every current SheSync+ user as
--   tracking-enabled, matching the explicit backward-compatibility
--   requirement: nobody who already uses tracking loses access.
-- * New rows: the trigger below reads `tracking_enabled` from
--   raw_user_meta_data, defaulting to true when absent. A normal signup
--   sends no such metadata key -> true (matches today's only real signup
--   path). Only a deliberately partner-oriented signup
--   (src/app/(public)/auth/signup/page.tsx's "I'm here to support a
--   partner" choice) sends `tracking_enabled: false` explicitly. This is
--   the same pattern already used for `name` via
--   raw_user_meta_data->>'name' — nothing new architecturally.
--
-- No RLS changes: existing "own row only" policies on public.users are
-- row-level, not column-level, so they already cover this new column with
-- no changes required.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN tracking_enabled boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, subscription_tier, privacy_settings, tracking_enabled)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1), 'User'),
        'free',
        '{
            "share_with_partner": false,
            "share_cycle_phase": false,
            "share_mood": false,
            "share_fantasy_vault": false,
            "share_intimacy_deck": false
        }'::jsonb,
        COALESCE((NEW.raw_user_meta_data->>'tracking_enabled')::boolean, true)
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

COMMIT;

-- ---------------------------------------------------------------
-- VERIFICATION (read-only, run manually after COMMIT — not part of the
-- migration itself)
-- ---------------------------------------------------------------
-- Confirm the column exists and every existing row is grandfathered true:
--   select tracking_enabled, count(*) from public.users group by 1;
--   -- expect: every pre-existing row shows true; false only for anyone
--   -- who deliberately signed up as partner-oriented after this migration.
--
-- Confirm the trigger reads metadata correctly (no live effect, just
-- inspects the function body):
--   select prosrc from pg_proc where proname = 'handle_new_auth_user';
