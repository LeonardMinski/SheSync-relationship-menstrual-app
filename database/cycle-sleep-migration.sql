-- =====================================================
-- SheSync+ Cycle Data — Add Sleep Metric
-- =====================================================
-- Adds `sleep` to public.cycle_data as a fifth 1-10 tracked metric,
-- alongside the existing mood/energy/libido/stress columns. Nothing in
-- this file has been run against a live database yet.
--
-- Existing rows are backfilled to 5 (the same neutral "no data" value the
-- application already uses as a fallback for energy/libido/stress when a
-- request omits them — see src/app/api/cycle/route.ts). The column default
-- is then dropped so `sleep`, like the other four metrics, has no
-- permanent DB-level default: every future insert must supply a real
-- value, which the application always does.
-- =====================================================

BEGIN;

ALTER TABLE public.cycle_data
  ADD COLUMN sleep INTEGER NOT NULL DEFAULT 5 CHECK (sleep >= 1 AND sleep <= 10);

ALTER TABLE public.cycle_data
  ALTER COLUMN sleep DROP DEFAULT;

COMMIT;
