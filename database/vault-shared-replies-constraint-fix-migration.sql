-- FIX: shared_replies.source_type CHECK constraint never learned about
-- 'vault_spark' — applied live 2026-09-08 via Supabase SQL Editor (manual,
-- outside the Claude Code MCP path; see PR/session notes for why).
--
-- shared_replies was created in relationship-experience-v1-migration.sql
-- (source_type IN ('partner_context', 'appreciation', 'relationship_session')).
-- database/vault-v1-migration.sql later extended
-- public._has_reply_source_access(), public.get_replies(), and
-- public.add_reply() to accept a fourth source_type, 'vault_spark', for
-- Vault's focused conversation ("Talk about this") -- but never updated
-- this table's own CHECK constraint to match. The RPC layer fully
-- supported vault_spark; the table itself silently rejected it.
--
-- Found live 2026-09-08 during the showcase-readiness audit: every reply
-- attempt on a revealed Spark's focused-talk thread failed with a 500
-- (Postgres 23514, "violates check constraint
-- shared_replies_source_type_check").
--
-- No data impact: every existing row already has one of the three
-- previously-allowed values. This only widens what's accepted going
-- forward. Does not touch RLS (shared_replies deliberately has zero direct
-- policies -- access is entirely RPC-mediated, per its original migration's
-- design) or grants.

BEGIN;

ALTER TABLE public.shared_replies DROP CONSTRAINT shared_replies_source_type_check;
ALTER TABLE public.shared_replies ADD CONSTRAINT shared_replies_source_type_check
  CHECK (source_type = ANY (ARRAY['partner_context'::text, 'appreciation'::text, 'relationship_session'::text, 'vault_spark'::text]));

COMMIT;
