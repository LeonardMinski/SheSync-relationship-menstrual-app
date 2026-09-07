# SheSync+ MVP Engineering Audit

**Audit date:** 2026-08-30 · **Branch audited:** `develop` (clean, up to date with `origin/develop`) · **Mode:** read-only static review + real command execution (typecheck/lint/test/build). No production code was changed.

---

## 1. Executive Summary

SheSync+ has a real, mostly-working core loop for **auth → cycle logging → dashboard → privacy settings**. Those four pieces are implemented against a live Supabase schema, validated server-side, and covered by non-trivial Vitest tests. That is the good news.

The fifth pillar of the stated MVP — **"partner view respects those privacy settings"** — is not a partially-working feature. It is **non-functional end to end**:

- The "Connect Partner" button has no click handler at all. There is no code path, UI or API, that ever moves a `partner_links` row from `pending` to `active`.
- Even if a link were active, no RLS policy in the committed schema grants a partner read access to the owner's `users` or `cycle_data` rows — the one place in the codebase that does this pattern correctly (`intimacy_sessions`) was never extended to the tables the partner feature actually depends on.
- Two separate UI surfaces (`PartnerCard` on the dashboard, `ManagePartnerCard` in settings) show a **hardcoded fake partner identity** ("Alexandria Montgomery-Santos" / "Alex M.") and fake "Shared"/"Connected" status, completely disconnected from the real privacy/partner services — so today, every user sees what looks like an active, working partner connection whether or not one exists.

On top of that, **`npm run build` fails outright** (`useSearchParams()` without a Suspense boundary on `/auth/login`) — the app cannot currently be deployed to production, and `next.config.ts` is configured to hide both TypeScript and ESLint errors from the build, so this class of regression has no safety net.

The documentation layer is split in two: `docs/ROADMAP.md` and `docs/PARKED_TEST_SCENARIOS.md` are accurate, current, and already state the exact MVP framing this audit was scoped against. `README.md`, `docs/TODO.md`, and `CHANGELOG.md` are stale and in places actively false (claims of local-first storage, end-to-end encryption, AI-powered predictions, real-time sync, and a completed Playwright E2E suite — none of which exist in the code).

**Bottom line:** the auth/cycle/dashboard/privacy loop is a credible foundation. The partner loop needs to be built almost from scratch at the data-access layer (RLS + linking), not just polished. The build blocker and the fabricated-partner UI should be fixed before anything else, because they are both actively misleading — one to the deploy pipeline, one to real users.

---

## 2. Current Architecture

**Stack (confirmed in `package.json`):** Next.js 15.3.5 (App Router), React 19, TypeScript 5 (strict), Tailwind CSS 4, Supabase (`@supabase/supabase-js` + unused `@supabase/ssr`), Zod 3, Vitest 2, react-hook-form (declared but not used for cycle logging), date-fns, recharts (declared, **zero usages found**), Stripe + `@stripe/stripe-js` (declared, `@stripe/stripe-js` **fully unused**), OpenAI SDK (parked AI-coach only).

**Route architecture.** App Router with two route groups: `(public)` (landing, auth pages, parked `/pricing`) and `(app)` (authenticated shell: dashboard, cycle, settings, partner, parked ai-coach/coach/fantasy/intimacy/partner-intimacy). No `middleware.ts` exists anywhere in the repo — all route protection is client-side, enforced in `src/app/(app)/layout.tsx` via a `useEffect` redirect once `useAuth()` resolves. API routes live under `src/app/api/*`, one route file per resource, each independently re-deriving the caller's identity from a Bearer token rather than trusting client input (a real strength, see §12).

**Component architecture.** Route pages are thin; real logic lives in `src/hooks/*` (page-level state machines) and `src/features/*` (pure domain utilities, e.g. `cycle.utils.ts`, `dashboard.utils.ts`). `src/components/*` is organized by feature area (cycle, dashboard, partner, settings, layout, ui). A shared `ui/` primitive layer exists (`Button`, `Card`, `Input`, `Toggle`) but is inconsistently adopted — plenty of screens hand-roll button/spinner markup instead (§14).

**State architecture — two parallel, unreconciled systems.** `AuthContext` (`src/context/AuthContext.tsx`) is the real, Supabase-backed session/profile store used by every MVP page. `AppContext` (`src/context/AppContext.tsx`), backed by `localStorage` via `src/lib/browserStorage.ts`, is **also** mounted app-wide in the same layout tree and maintains its own parallel `User`/`CycleData`/etc. models with a completely different (camelCase, `Date`-object) type system. No MVP page reads from `AppContext`; it exists to serve the parked features (AI coach, fantasy, pricing) that still use mock/local data. This is architecturally coherent as "parked features use a placeholder store" but is a real trap for future maintainers — nothing marks `AppContext` as legacy, and it sits in the same provider tree as the real one.

**Authentication architecture.** `src/lib/supabase/client.ts` builds the browser client (anon key). `src/lib/api/authentication.ts` builds a per-request server client that forwards the caller's own JWT (also anon key) — every API route is RLS-scoped as the calling user. `SUPABASE_SERVICE_ROLE_KEY` is declared in `src/lib/env.ts` and `.env.local` but **is never used to construct any client anywhere in `src/`** — there is no privilege-escalation surface, but it also means account deletion cannot remove the underlying Supabase Auth user (§6).

**Data-fetching architecture.** Every MVP page is a client component doing `useEffect` + `fetch` against its own API route on mount, with no shared cache (no SWR/React Query, no request de-duping). Dashboard and `/cycle` each instantiate their own independent `useCycleLogger()` and independently re-fetch the same `cycle_data` rows on every navigation (§16).

**API route architecture.** Thin, one file per resource, hand-rolled validation (no Zod at the route boundary despite Zod schemas existing for privacy/auth), fields written individually rather than spread from the request body (no mass-assignment risk found). `/api/auth/route.ts` appears to be a dead, fully duplicate reimplementation of the signup/profile-creation logic that the real UI never calls (the UI talks to the Supabase client directly via `AuthContext`).

**Supabase/database architecture.** Three incompatible SQL files sit in `database/` (`supabase-schema.sql`, `supabase-initial-schema.sql`, `intimacy-schema.sql`) describing different table sets for the same concepts, and two setup docs (`docs/SUPABASE_CONFIG.md`, `docs/SUPABASE_SETUP.md`) each point at a different one (§11). No migrations directory exists, so there is no way to confirm from the repo which schema is actually live.

**Service layer architecture.** `src/services/{auth,cycle,privacy,partner}/*` wrap Supabase/`fetch` calls behind typed functions consumed by hooks. Reasonably clean, but partner-link mutation logic is duplicated between `src/app/api/partner/route.ts` (server) and `src/services/partner/data.ts` (client, anon-key + RLS) with slightly different semantics.

**Validation architecture.** Inconsistent by design area: Zod is used for auth and privacy (`src/schemas/auth.ts`, `src/schemas/privacy.ts`) but **not** for cycle logging or the `User` model, where validation is hand-rolled and duplicated (range checks for mood/energy/libido/stress exist independently in the API route, the SQL `CHECK` constraint, and the UI's `<input type="range">` bounds — three sources of truth for one rule).

**Testing architecture.** Vitest only (16 files, 92 tests, all passing). No Playwright — a config and several real specs existed, were never observed to pass a single run, and were deliberately deleted in commit `9baa4a95` ("refactor: stabilize app architecture"), the same commit that added the current, accurate `docs/ROADMAP.md` and `docs/PARKED_TEST_SCENARIOS.md`.

---

## 3. Actual Feature Inventory

| Feature | Status |
|---|---|
| Signup / login / logout | COMPLETE |
| Email verification gating | PARTIAL (verify-email page is a static instructional screen; "resend" link is dead) |
| Email confirmation callback | **BROKEN** — page never processes the confirmation URL, always shows "Email Confirmed!" |
| Session hydration / protected routes | COMPLETE, client-side only (no middleware) |
| Cycle logging (create/upsert) | COMPLETE |
| Cycle edit (true by-id PUT) | DEAD-UNREACHABLE (endpoint exists, no UI caller) |
| Cycle delete | DEAD-UNREACHABLE (endpoint exists, no UI caller — no delete affordance exists at all) |
| Cycle history / today view | COMPLETE |
| Dashboard summary (phase/mood/energy/stress) | COMPLETE, honestly represents missing data as "Not logged" |
| Dashboard cycle-day number | NOT IMPLEMENTED (always renders `-`, no calculation exists) |
| Dashboard charts | NOT IMPLEMENTED (recharts installed, zero usages) |
| Dashboard partner widget | **PLACEHOLDER-MOCK presented as real** — hardcoded fake name/status |
| Privacy settings (read/write/reset) | COMPLETE, private-by-default in every live code path |
| Partner invite / linking | **BROKEN** — no working path to an active link |
| Partner shared-data filtering logic | COMPLETE in isolation, but unreachable (depends on linking + RLS that don't work) |
| Partner settings card | **PLACEHOLDER-MOCK presented as real** — hardcoded fake partner |
| Account deletion | PARTIAL — deletes app rows, not the underlying Supabase Auth user |
| "Delete All Data" (settings) | **PLACEHOLDER-MOCK** — clears `localStorage` only, no server-side deletion, despite a confirmation dialog promising otherwise |
| Notifications | PARKED, but a notification bell renders on every MVP page with no handler |
| AI coach, fantasy vault, intimacy deck, Stripe/pricing | PARKED — correctly show "Coming later" at their routes, but still linked from primary nav |

---

## 4. MVP Route Inventory

| Route | Status |
|---|---|
| `/` | COMPLETE |
| `/auth/login` | COMPLETE (functionally) — **but breaks the production build** |
| `/auth/signup` | COMPLETE |
| `/auth/callback` | BROKEN |
| `/auth/verify-email` | PARTIAL — dead "resend" link, white-on-light contrast bug |
| `/dashboard` | PARTIAL — real cycle data, fabricated partner widget |
| `/cycle` | COMPLETE |
| `/settings` | COMPLETE (thin wrapper) |
| `/settings/privacy` | PARTIAL — settings themselves work; adjacent `ManagePartnerCard` on this surface is fabricated |
| `/partner` | BROKEN — correct filtering logic, unreachable in practice |

Parked routes (`/ai-coach`, `/coach`, `/fantasy`, `/intimacy`, `/partner/intimacy`, `/pricing`) all correctly render a `ComingLater` placeholder when visited directly — **but all six are still present in primary navigation** (`src/components/layout/navItems.ts`) as fully clickable links with a "Soon" badge, contrary to the roadmap's requirement that they not appear in primary nav.

Two extra auth routes exist beyond the MVP spec (`/auth/forgot-password`, `/auth/reset-password`) — functional but outside the stated MVP route list; not a problem, just worth naming.

---

## 5. User Journey Audit

| Journey | Verdict | Key blocker |
|---|---|---|
| A — New user: landing → signup → verify → session → dashboard | PARTIAL / NEEDS MANUAL VERIFICATION | `/auth/callback` never processes the confirmation link |
| B — Returning user: login → dashboard | WORKING | — |
| C — Log cycle → persists → dashboard reflects it | PARTIAL | Core loop works; dashboard's partner widget doesn't reflect real settings (it isn't wired to any data source) |
| D — Privacy settings: toggle → save → reload → persists | WORKING | Minor: SQL column default disagrees with every app-level default (§9, §11) |
| E — Partner: link → privacy-filtered view → forbidden fields hidden | **BROKEN** | No working link-acceptance path; RLS grants partners no read access even if linked |
| F — Owner revokes → partner refresh loses access | NOT IMPLEMENTED / UNTESTABLE | Depends on E, which never succeeds today |

---

## 6. Auth Audit

- **Signup/login/logout**: COMPLETE. `src/services/auth/index.ts` wraps `supabase.auth.signUp`/`signInWithPassword`/`signOut`; `AuthContext` (`src/context/AuthContext.tsx`) hydrates session on load via `getSession()` plus an `onAuthStateChange` subscription, guarded against races with a `profileRefreshId` ref.
- **Profile creation**: `loadOrCreateUserProfile` (`src/services/auth/index.ts:178-207`) selects-then-upserts a `users` row. A second, independent implementation of the same logic exists server-side in `src/app/api/auth/route.ts` — that whole route appears to be dead code the real UI never calls, a maintenance/drift risk (it already has a subtly different upsert conflict option than the client version).
- **Email verification / callback — BROKEN**: `src/app/(public)/auth/callback/page.tsx` is fully static; it never reads `code`/`token_hash` from the URL and never calls `exchangeCodeForSession`. It shows "Email Confirmed!" unconditionally, even for an invalid or expired link. `@supabase/ssr` is a declared dependency and is never imported anywhere in `src`. Whether Supabase's default client behavior silently establishes a session from the URL regardless requires a live test — flagged UNCERTAIN, but the page's own code does nothing correct here.
- **Dead link**: `/auth/verify-email`'s "resend" link points to `/auth/resend-verification`, which has no route.
- **Protected routes**: enforced only client-side, in `(app)/layout.tsx`'s `useEffect`. Every API route independently re-verifies the Bearer token server-side, so this is not a data-exposure risk, but there is a brief client-side mount-then-redirect flash and zero server-side enforcement layer.
- **Duplicate redirect logic**: `Dashboard.tsx` re-implements its own "redirect if unauthenticated" check in addition to the layout's, with a different (worse — no `?next=`) target.
- **Account deletion incomplete**: `src/app/api/user/route.ts` DELETE removes app-table rows but explicitly cannot remove the Supabase Auth user (no service-role client available in this codebase) — logged as a warning, not surfaced to the user.
- **Node/env**: Node version consistently pinned (`.nvmrc` 20.20.2, `package.json` engines `20.x`). `.env.local` has all expected keys present as entries (values not inspected).

---

## 7. Cycle Audit

- **Logging**: `CycleLogDialog` (plain `useState`, no react-hook-form/Zod despite the pattern existing elsewhere in the codebase) → `useCyclePageState` → `POST /api/cycle`, which upserts into `cycle_data` on `(user_id, date)` — logging twice for the same day correctly updates rather than duplicating or erroring (COMPLETE).
- **Edit/Delete — dead code**: `PUT`/`DELETE` handlers exist on `/api/cycle` and are well-formed, but nothing in the UI calls them. "Edit Entry" actually works by re-POSTing (upsert), which happens to work for same-day edits, but there is genuinely **no delete capability anywhere in the product**.
- **Fields not exposed**: `period_flow`, `temperature`, `weight` are fully supported by the DB schema and the API, but the form never collects them — dead surface area, not a bug, but worth deciding whether to build the UI or drop the columns.
- **Validation duplicated three ways**: the 1–10 range for mood/energy/libido/stress is enforced independently in `route.ts`, the SQL `CHECK` constraint, and the `<input type="range">` bounds. No single source of truth; a change to one will silently disagree with the others.
- **Date/timezone bug**: `toCycleDateKey` (`src/features/cycle/cycle.utils.ts:39-41`) does `format(new Date(dateString), "yyyy-MM-dd")`. A Postgres `DATE` string like `"2026-08-24"` parses as UTC midnight, then renders in local time — for any user west of UTC this can silently shift "today"/"selected date" matching by one day, causing a real logged entry to appear as "no data logged for this date." The same UTC-vs-local pattern recurs in the API's default-date fallback and in the partner shared-data route's "today" calculation.
- **States**: loading, error, empty-state, and form-validation states are all implemented and honest (no fabricated data shown for a new user).

---

## 8. Dashboard Audit

- **Real data, honestly represented**: `buildDashboardSummary` (`src/features/dashboard/dashboard.utils.ts`) never invents plausible-looking defaults — missing mood/energy/stress render as `null` → "Not logged"; missing phase renders as "No cycle data yet"; missing cycle-day renders as `-`. This is good hygiene and is explicitly tested (`dashboard.utils.test.ts`).
- **Cycle-day number**: hardcoded to `null` unconditionally — there is no cycle-day calculation anywhere in the codebase. Represented honestly as unknown, but it's a promised piece of UI copy ("Cycle Day") that never resolves to anything.
- **No charts**: `recharts` is a dependency; zero components use it. Not broken — simply not built.
- **The one serious fabrication in the whole audit**: `src/components/dashboard/PartnerCard.tsx` hardcodes `const partnerName = "Alexandria Montgomery-Santos"` and static "Shared"/"Private" category text, rendered unconditionally with no connection to `PrivacySettings` or the real partner service — regardless of whether the viewer has any partner link at all. The *correct*, privacy-gated implementation exists elsewhere (`/partner` route, `src/app/api/partner/shared-data/route.ts`), so this isn't a missing feature — it's a second, disconnected, fake stand-in sitting on the highest-traffic page in the app, directly contradicting the MVP's core privacy promise.
- **Insights panel** (`src/services/cycle/insights.ts`, feeds `/cycle` not `/dashboard`, but same domain): fully static tip/food content falsely attributed to `source: "infermedica"` / `"nutritionix"` / `"newsapi"` — fabricated provenance claims, not just placeholder copy. `getHealthNews` is additionally dead code (unused anywhere).
- **Duplicate fetch pattern**: Dashboard and `/cycle` each run their own independent `useCycleLogger()` instance with no shared cache — full re-fetch of the same rows on every navigation between them.

---

## 9. Privacy Audit

- **Schema**: `PrivacySettingsSchema` (`src/schemas/privacy.ts`), five booleans, `.strict()` (rejects unknown keys), backed by a single `users.privacy_settings` JSONB column.
- **Defaults — private in practice, unsafe in the schema**: every real code path (the `handle_new_auth_user` trigger, the app-level `DEFAULT_PRIVACY_SETTINGS` constants used by both signup implementations) sets all five flags `false`. But the **SQL column's own `DEFAULT` clause** sets `share_cycle_phase` and `share_mood` to `true` — contradicting the trigger, the Zod schema, and every app constant. Nothing currently exercises this column default, but any future direct insert that omits `privacy_settings` (an admin script, a backfill, a new signup path) would silently opt a new user into partner sharing. **HIGH PRIORITY latent defect.**
- **Persistence**: client → `/api/user` PUT → server whitelists exactly the five boolean fields before writing (no mass-assignment risk) → RLS backs the owner-only write (`auth.uid() = id`).
- **Reload correctness**: the settings hook re-fetches from `/api/user` GET on mount rather than trusting cached client state, so "reload and settings remain correct" genuinely holds.
- **Reset**: writes `DEFAULT_PRIVACY_SETTINGS` (all-false) through the same validated path.
- **Fantasy/intimacy sharing toggles are inert**: `share_fantasy_vault`/`share_intimacy_deck` exist in the schema and settings UI, but `/api/partner/shared-data` hardcodes both to `false` in its response regardless of the owner's actual setting — those toggles currently do nothing on the partner side. Not a security bug (fails closed), but a truth-in-labeling problem for anyone who enables them expecting an effect.

---

## 10. Partner Audit

This is the audit's central finding, corroborated independently by three of the six research agents plus my own review of the notification chain.

- **Linking is unreachable.** `src/components/partner/NoPartnerState.tsx`'s "Connect Partner" button has no `onClick` at all. `acceptPartnerLink()` exists in `src/services/partner/data.ts` but is never called by anything, and would fail regardless — there is no RLS `UPDATE` policy on `partner_links` in the committed schema. Every read path (`/api/partner`, `/api/partner/shared-data`) only considers links with `status = 'active'`, and nothing in the codebase ever sets that status. **A real user cannot get from "invite" to a working connection today, full stop.**
- **Even a working link would return nothing.** `database/supabase-schema.sql`'s RLS policies for `users` and `cycle_data` are strictly owner-only (`auth.uid() = id` / `auth.uid() = user_id`), with no partner exception. The one place in the codebase that does implement a correct "owner OR linked-and-shared partner" RLS pattern — `intimacy_sessions` in `database/intimacy-schema.sql` — was never extended to the two tables the partner feature actually needs. Since `/api/partner/shared-data` queries as the calling partner (RLS-scoped, not service-role), its `.single()` lookups would return zero rows for anyone but the caller themselves, and the route's own code has a dedicated branch anticipating exactly this RLS-denial failure mode. This fails **closed** (returns "not found," not someone else's data), which is the right failure direction, but it means the feature as committed cannot work.
- **The filtering logic that does exist is architecturally correct.** `src/app/api/partner/shared-data/route.ts` builds the response by conditionally *assigning* fields the privacy settings allow, rather than fetching everything and hiding fields in React — this is the one part of the partner feature that matches the required `DB → auth → filter → DTO → client` architecture. If linking and RLS were fixed, this part would likely just work.
- **IDOR-shaped risk**: `/api/partner?partnerId=<id>` (`src/app/api/partner/route.ts`) accepts any client-supplied user id and looks it up with no check that it's the caller's actual linked partner. It is currently saved only by `users`' owner-only RLS policy — if that policy is ever relaxed to fix the point above without this endpoint being hardened in tandem, this becomes a live IDOR returning name/email/subscription tier for arbitrary user IDs.
- **Fabricated UI compounds the problem**: `PartnerCard` (dashboard) and `ManagePartnerCard` (settings/privacy) both show a hardcoded fake partner identity and "Connected"/"Shared" status regardless of actual state — so a user has no way to discover, from the UI alone, that the real partner feature doesn't work.
- **Read-only guarantee**: holds. No route lets a partner write to the owner's data; `/api/partner/shared-data` is GET-only, and `/api/partner` POST/DELETE only mutate links the caller created themselves.

---

## 11. Database & Data Model Audit

- **Three incompatible schema files, two contradictory setup docs.** `docs/SUPABASE_CONFIG.md` says to run `supabase-schema.sql`; `docs/SUPABASE_SETUP.md` says to run `supabase-initial-schema.sql`. These define entirely different tables for the same concepts (`cycle_data` vs. `cycles`, `users.partner_id` vs. a `partners` table, etc.) — following `SUPABASE_SETUP.md` literally would produce a database the app cannot run against at all. `supabase-initial-schema.sql` should be treated as dead/obsolete and the setup doc corrected.
- **Signup writes columns that don't exist in the committed schema.** `profile_image_url` is written unconditionally by both signup code paths; `subscription_status`/`stripe_subscription_id` are written by the Stripe webhook handler. None of the three appear in `public.users` as defined in `supabase-schema.sql`. `docs/TODO.md` independently lists these as a known gap. If the live database matches the committed file exactly, this would break every signup — **UNCERTAIN, requires live DB check**, but the drift itself is confirmed in the repo.
- **HIGH — unsafe SQL column default** (see §9): `share_cycle_phase`/`share_mood` default to `true` at the column level, contradicting the trigger and every app-level constant.
- **Cycle model**: DB/API support `period_flow`, `temperature`, `weight`; the real MVP types (`CycleEntry`, `LogCycleData`) and UI never reference them — dead surface, not a bug.
- **No Zod schema for `User` or cycle-log data**, unlike auth/privacy — validation there is hand-rolled and duplicated per route.
- **Duplicate, drifted `PartnerLink` type** definitions in `src/types/partner.ts` and `src/schemas/intimacy.ts`; one fabricates a non-existent `updated_at` field (never actually read at runtime, so latent rather than active).
- **Intimacy schema drift** (parked feature, contained blast radius but instructive): `intimacy-schema.sql` renames the old per-user `intimacy_cards` table into a new shared-catalogue shape with no `user_id` column, but `src/app/api/intimacy/route.ts` still queries the old per-user shape — if that migration was ever run live, the route is hard-broken. This is the clearest in-repo evidence that a migration has previously shipped without updating its consuming code, which matters for how the RLS fix in §10 should be rolled out.
  - **2026-09 update, verified against the live `shesync-app` Supabase project:** the migration *was* run live — `public.intimacy_cards` has the shared-catalogue columns (`id`, `category`, `difficulty`, `text`, `phase_tags`, `active`), not the per-user shape. This confirms `src/app/api/intimacy/route.ts`'s `user_id`/`is_answered` queries against `intimacy_cards` are hard-broken in production, exactly as predicted above (out of scope to fix here — flagging only). Separately, the privacy question this drift raised — whether the public `cards_public_read` policy exposes per-user answers — is resolved: it does not, since the live table holds only catalogue content, no user responses. `database/intimacy-sessions-privacy-fix-migration.sql` (which also closed a related `intimacy_sessions` partner-read gap — see §12) has been applied to this same live project and additionally removed the `cards_authenticated_insert/update/delete` policies that let any authenticated user modify the shared catalogue.
- **Two disconnected data systems**, as described in §2 — the legacy `AppContext`/`localStorage` model (`src/types/index.ts`'s `User`, `CycleData`, `IntimacyCard`, `FantasyEntry`) is never reconciled against, or intended to be reconciled against, the real Supabase schema.
- **UTC "today" derivation** recurs in both the cycle API's date fallback and the partner shared-data route's "today" calculation (§7).

---

## 12. Security & RLS Audit

**Positive findings first:**
- No service-role key is ever used to construct a Supabase client anywhere in `src/` — despite being declared in env, there is no RLS-bypass surface in the codebase today.
- Every API route re-derives the caller's identity from a verified Bearer token (`src/lib/api/authentication.ts`) rather than trusting a client-supplied user id, with one exception (below).
- Privacy-settings and cycle writes are built field-by-field server-side, not spread from the request body — no mass-assignment risk found.
- No secrets, tokens, or health data found logged anywhere; error logs surface Supabase error shape (`{message, code}`), not payloads.
- No hardcoded credentials in the repo (`.env.local` is gitignored/untracked); minor hygiene issue only — debug scripts under `scripts/debug/` hardcode a Supabase project URL (not a secret) as a fallback default.

**HIGH PRIORITY findings, ranked:**
1. **No RLS policy grants a linked partner read access to `users` or `cycle_data`** (§10) — the root cause of the partner feature's non-functionality, and the clearest violation of the audit's required "DB enforces authorization" architecture, even though the app-code filtering layer above it is built correctly.
2. **Partner linking has no completion path** — UI has no handler, and there's no RLS `UPDATE` policy to complete it even via direct API use.
3. **`/api/partner?partnerId=` IDOR shape** — unauthorized-by-relationship lookup, currently mitigated only by an RLS policy that a fix to #1 could inadvertently relax.
4. **`fantasy_entries` and `ai_coach_messages` have RLS enabled with zero policies defined** in `supabase-schema.sql` — fails closed (safe) but likely means those parked features are non-functional wherever they touch the DB; needs a live check to see whether an uncommitted policy fills the gap.
5. **Unsafe `privacy_settings` column default** (§9, §11).

**Build-configuration risk (adjacent to security):** `next.config.ts` sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` — the build will succeed (module-compile errors aside) even with type errors or lint failures, removing a safety net that would otherwise catch classes of the bugs found in this audit before they ship.

No violation was found of the "filter only in React" anti-pattern the audit was specifically watching for — where the partner-filtering logic does run, it correctly avoids fetching forbidden fields into the response at all, rather than fetching and hiding them client-side. The problem is that this correct logic sits behind two blockers that make it unreachable, not that the logic itself is wrong.

---

## 13. Domain Logic Audit

The codebase's general hygiene around missing data is good: `buildDashboardSummary`, `scoreToMood/Energy/Stress`, and `toCycleLogPayload` all consistently return `null`/block-the-save rather than inventing a plausible default ("follicular", "14", "Calm") for missing values — exactly the behavior the audit was watching for, and it holds up under review. Classification:

| Logic | Location | Class | Note |
|---|---|---|---|
| `toCycleDateKey` / `findCycleForDate` | `cycle.utils.ts` | A (correctly extracted) | Carries the UTC/local date bug (§7) |
| `toCycleLogPayload` phase fallback | `cycle.utils.ts` | B | Blocks save rather than fabricating a phase — good |
| `buildDashboardSummary`, score mappers | `dashboard.utils.ts` | A (correctly extracted) | No dangerous defaults, verified by tests |
| 1–10 range validation | route.ts + SQL + UI slider | **E (duplicated 3×)** | No single source of truth |
| `useCycleLogger` instantiated per-page | `Dashboard.tsx` + `useCyclePageState.ts` | **E (duplicated)** | No shared cache |
| **`PartnerCard` fake identity/status** | `PartnerCard.tsx` | **D — dangerous** | Not a missing-value fallback; static fake content with zero data binding, presented as real |
| Insights "source" attribution | `insights.ts` | D-adjacent | Fabricated provenance claim, not a numeric default |

---

## 14. UI / UX Audit

Highest-impact friction points for completing the actual MVP journey, in priority order:

1. **"Delete All Data" doesn't delete server data.** `useSettingsPageState.ts`'s `deleteAllData` only clears `localStorage` and signs out — no call to delete Supabase-stored cycle data — while the confirmation dialog explicitly promises permanent deletion of "cycle data, entries, and local settings." In a privacy-pitched app, this is a trust-breaking bug.
2. **Dead affordances that imply working features**: a notification bell (every MVP page) and Apple/Google SSO buttons (login page) both render with no click handler.
3. **Fabricated partner identity shown on two real screens** — dashboard `PartnerCard` and settings `ManagePartnerCard` (§8, §10).
4. **Fabricated sidebar identity** — `AppSidebar` hardcodes "Sarah J." / "Premium Secure" instead of the authenticated user's real name/tier, on every authenticated page.
5. **No success feedback after logging a cycle entry** — the dialog just closes; contrast with privacy settings, which shows a proper success banner.
6. **Contrast bug**: white heading text on a light background on both the verify-email and callback screens — two of the mandatory auth-journey screens are effectively unreadable in light mode.
7. **Dead link** — `/auth/resend-verification` (§6).
8. **Destructive-action dialog has no loading/disabled state** during its own async confirm handler (double-submit risk, low severity).
9. **Cycle-log modal overlays use plain `<div>`s with no `role="dialog"`/`aria-modal`/focus trap** — a real, if minor, accessibility gap on the core logging interaction.

Positive: form primitives (`Input`, `Toggle`, `Textarea`) correctly wire labels, ids, and `role="alert"` error text; mobile nav is genuinely responsive, not just narrow-viewport-tolerant.

---

## 15. Accessibility Audit

- Structural signal exists (`aria-label` used in 9 files; the privacy settings form correctly uses `getByLabelText`/`role="status"`/`role="alert"`, and is tested for it).
- No `role="dialog"`/`aria-modal`/focus trap on the two modal-style overlays in the MVP flow (cycle log, delete-data confirmation).
- One latent div-as-button pattern in `Avatar` (currently inert in the MVP surface — `editable` is never set to `true` there).
- Actual rendered contrast ratios and real keyboard focus order were **not measured** (would require a live browser/axe pass) — flagged UNCERTAIN, not claimed as verified either way, except the one contrast bug that's visible from the code alone (§14 item 6).

---

## 16. Performance Audit

All findings below are **statically identified from source**, not measured at runtime.

- Duplicate `users`-table profile fetch on every initial auth load (`AuthContext`'s manual `initialiseAuth` plus the `INITIAL_SESSION` event fired immediately by `onAuthStateChange` both trigger the same query) — guarded against stale overwrites, so not a correctness bug, just a wasted round trip.
- `/api/partner/shared-data`'s "today's cycle" and "recent activity" queries are independent but awaited sequentially rather than run via `Promise.all`.
- `Dashboard.tsx` re-sorts the full cycles array on every render (unmemoized `[...cycles].sort(...)` inside `buildDashboardSummary`, called directly in the render body) — re-runs on unrelated state changes like dismissing the error banner.
- `AppContext`'s single combined reducer wraps the entire authenticated app tree; any dispatch (even an unrelated theme toggle) re-renders every consumer, since there's no state-slicing.
- No shared cache between routes: dashboard and `/cycle` each independently re-fetch the same `cycle_data` rows on every navigation between them.
- All MVP page entry points are client components doing `useEffect`+`fetch` for primary data, producing an auth-loading → data-loading waterfall rather than server-fetching and hydrating.
- `@stripe/stripe-js` is a fully unused dependency (zero imports anywhere in `src`) — pure bundle weight for a parked feature that doesn't even use it.

No unstable `useEffect` dependency arrays were found in the MVP hooks reviewed — dependencies are consistently primitives or memoized callbacks.

---

## 17. Test Coverage Audit

**Confirmed via actual run:** `npm test` → 16 files, 92 tests, **all passing**, ~3s.

The suite is Vitest-only and reasonably well-targeted at what it covers: auth redirect safety (including open-redirect regression tests), Zod schema behavior, cycle-utility pure functions, dashboard score-bucketing boundaries, and privacy-settings default/hook behavior. No misleading test names, no duplicated tests, and only one file (`intimacy.selectors.test.ts`) covers a parked feature.

**The gap that matters most:** the entire partner feature has essentially zero real coverage. `navItems.test.ts` confirms `/partner` exists in nav; nothing else touches it. Critically, **`src/app/api/partner/shared-data/route.ts` — the file that actually implements privacy filtering — has no test at all.** Three Playwright specs that once exercised exactly this ("partner cannot see unshared fields," "no shared data when sharing is disabled," "no partner connected state") were deleted along with the Playwright config and never replaced with Vitest equivalents; `docs/PARKED_TEST_SCENARIOS.md` explicitly lists rebuilding this coverage as a Phase 2 task.

Secondary gaps: no test of `/api/cycle`'s actual route handler (only the pure utilities that feed it), no test proving one user can't read another's cycle rows via the API (IDOR-style test), and the privacy test chain (`usePrivacySettingsForm.test.ts` → `PrivacySettingsForm.test.tsx` → `settings.test.ts`) mocks at every layer, so a break in the real `/api/user` contract could pass all three files while privacy settings are actually broken in production.

**Playwright, resolved:** it was real (recovered spec content confirms well-formed tests targeting privacy and partner sharing), was never a committed dependency in `package.json` at any point in git history, and its own stale artifacts (`test-results/.last-run.json`, `playwright-report/data/*.md`) show every recorded run failed at Next.js **build time**, never at an assertion — meaning it may never have passed once, even before deletion. It was deliberately removed in commit `9baa4a95`.

---

## 18. Documentation Truth Audit

| Claim | Source | Verdict |
|---|---|---|
| MVP framing (auth→cycle→dashboard→privacy→partner), MVP/parked route lists, Phase 2/3 boundaries | `docs/ROADMAP.md`, `docs/PARKED_TEST_SCENARIOS.md` | **TRUE / current** — this audit's own brief was scoped to match these docs almost verbatim, confirming they are the authoritative, up-to-date source |
| "Testing: Vitest + Playwright" | `README.md` | **STALE** — no Playwright dependency, config, or specs exist |
| "TDD Tests / E2E Tests" for Partner Portal, marked done | `docs/TODO.md` | **STALE/FALSE-as-stated** — the E2E specs existed once, per §17 never passed, and are now deleted; checked off as complete regardless |
| "Local-first data storage with optional cloud backup" | `README.md` | **FALSE** — no offline/local-first code exists; all persistence is Supabase-only |
| "End-to-end encryption for sensitive content" | `README.md` | **FALSE-UNVERIFIED / likely false** — no encryption library in dependencies; only marketing copy strings use the phrase |
| "AI-powered cycle phase predictions" | `README.md` | **FALSE** — the only prediction-shaped code (`generateCyclePredictions`, dead/unused) is plain date arithmetic, not AI |
| "Real-time" data sync | `README.md`, `CHANGELOG.md` | **FALSE** — no Supabase Realtime channel usage found anywhere |
| "No third-party tracking" | `README.md` | **TRUE, as far as static code shows** — no analytics library present |
| WCAG AA / full accessibility claims | `README.md`, `CHANGELOG.md` | **UNCERTAIN — requires manual/live test** |
| Partner Portal "MERGED TO DEVELOP" | `docs/TODO.md` | **TRUE** — confirmed via merge commit |
| Stripe "done" implication | `CHANGELOG.md` | **PARTIALLY TRUE, self-contradicted** — the same `docs/TODO.md` lists dozens of unchecked items and states "Status: In Development" |
| Literal unresolved merge-conflict marker at line 57 | `docs/TODO.md` | **Confirmed stale artifact** |
| Unexpanded `$(date)` footer | `docs/TODO.md` | **Confirmed stale artifact** |

`README.md`, `docs/TODO.md`, and `CHANGELOG.md` should all be treated as historical/stale relative to `docs/ROADMAP.md`, which is internally consistent and matches the code's actual current direction.

---

## 19. Technical Debt

| Item | Priority |
|---|---|
| Production build failure (`useSearchParams` w/o Suspense on `/auth/login`) | **P0** |
| Partner linking has no completion path; partner RLS missing | **P0** |
| Fabricated partner identity on dashboard + settings | **P0** |
| "Delete All Data" doesn't delete server data | **P0** |
| `/auth/callback` doesn't process confirmation URL | **P0** |
| Unsafe SQL default for `share_cycle_phase`/`share_mood` | P1 |
| `/api/partner?partnerId=` IDOR shape | P1 |
| Two contradictory schema files / setup docs | P1 |
| Signup writes columns absent from committed schema | P1 (pending live-DB confirmation) |
| `next.config.ts` suppresses TS/ESLint build errors | P1 |
| No test coverage for partner privacy filtering | P1 |
| Zero RLS policies on `fantasy_entries`/`ai_coach_messages` | P2 (parked, but confirm live state) |
| Duplicate `useCycleLogger` fetches, no shared cache | P2 |
| Cycle validation duplicated 3 ways | P2 |
| Dead PUT/DELETE cycle endpoints, no delete UI | P2 |
| Date/timezone UTC-vs-local bug | P2 |
| Two parallel state systems (`AuthContext` vs `AppContext`) | P2 |
| Fake SSO buttons, dead notification bell, fake sidebar identity | P2 |
| No Zod schema for `User`/cycle data | P3 |
| Duplicate `PartnerLink` type definitions | P3 |
| Hardcoded colors bypassing design tokens; duplicate Button/spinner implementations | P3 |
| `@stripe/stripe-js` fully unused dependency | P3 |
| Repo hygiene: `build.log`, `tsconfig.tsbuildinfo`, `.next.stale-*`, stale `playwright-report`/`test-results` | P3 |
| Intimacy schema/route drift, orphaned Zod redesigns | PARK |
| Stripe account fields, checkout/webhook completeness | PARK |

---

## 20. Dead / Stale / Parked Code

- **Fully unreachable components** (zero importers): `BoundaryManager`, `ReflectionForm`, `ShareToggle`, `TodayCardSelector` (intimacy), `AICoach.tsx`, `FantasyPage.tsx`, `PricingPage.tsx` (still contains a live, unreached `fetch("/api/checkout")` call), `PartnerIntimacy.tsx`, and transitively `Navigation.tsx`, `useCoach.ts`, the intimacy service files, `services/fantasy/entries.ts`.
- **Live but uncalled API routes**: `/api/coach`, `/api/coach/messages`, `/api/fantasy`, `/api/intimacy`, `/api/checkout`, `/api/webhooks/stripe` — all reachable if hit directly, none called by any current MVP or parked-page UI.
- **Dead `/api/auth/route.ts`** — duplicate of the real (client-side) signup/login/profile logic.
- **`generateCyclePredictions`** (`src/utils/mockData.ts`) and **`getHealthNews`** (`insights.ts`) — unused mock generators.
- **Merge-conflict artifact**: `docs/TODO.md:57`.
- **Repo hygiene artifacts**: `build.log`, `tsconfig.tsbuildinfo`, `.next.stale-202608241802/`, stale `playwright-report/`/`test-results/` directories.
- **`scripts/debug/*`**: ad-hoc, hardcode a fallback Supabase project URL, one targets a hardcoded `localhost:3003` port — stale dev scaffolding, not part of any real workflow.
- **`scripts/project/*`**: one-time repo-reorganization scripts from a past refactor.

Nothing here should be deleted as part of this audit — this is an inventory, per the instructions.

---

## 21. MVP Gaps

**MUST FIX BEFORE MVP**
- Fix the production build failure (Suspense boundary on `/auth/login`).
- Build a real partner-linking completion path (accept/activate a link) and the RLS policies that let a linked, sharing-enabled partner actually read the owner's `users`/`cycle_data` rows, mirroring the pattern already used correctly for `intimacy_sessions`.
- Remove or wire up the fabricated `PartnerCard`/`ManagePartnerCard` content — showing fake "Connected" partner data is a direct contradiction of the product's privacy premise.
- Fix `/auth/callback` to actually process the confirmation link (or confirm, via live testing, that Supabase's client handles it implicitly — currently the page's own code does nothing correct either way).
- Fix "Delete All Data" to actually delete server-side data, or change the copy so it doesn't promise something it doesn't do.
- Harden `/api/partner?partnerId=` against IDOR before any RLS relaxation is made to fix the point above.

**SHOULD FIX BEFORE MVP**
- Reconcile the SQL column default for `share_cycle_phase`/`share_mood` with every other source of truth (all-false).
- Resolve the two contradictory schema files/setup docs into one canonical schema + setup doc.
- Confirm (via live DB check) whether signup's `profile_image_url`/subscription columns actually exist in production, and add a migration if not.
- Remove or gate the dead notification bell and fake SSO buttons so the UI doesn't imply features that don't exist.
- Add at least one real test exercising `/api/partner/shared-data`'s filtering logic server-side.
- Turn `next.config.ts`'s `ignoreBuildErrors`/`ignoreDuringBuilds` back on once the current type/lint debt is cleared, so this class of bug can't recur silently.

**SAFE AFTER MVP**
- Cycle edit/delete UI, cycle-day-number calculation, dashboard charts, shared data-fetch caching, `AppContext`/`AuthContext` consolidation, timezone fix, design-token consistency cleanup, dead-code removal.

**PARKED (confirmed correctly out of scope)**
- AI coach, fantasy vault, intimacy deck, Stripe/paid plans, advanced analytics, rich partner invitations beyond the MVP-minimum linking flow, notifications beyond removing the dead bell icon.

---

## 22. Recommended V1 Architecture

Keep the existing stack — Next.js, Supabase/Postgres/RLS, Zod, Vitest — nothing here calls for a new backend, a new database, or a different framework. The two structural changes worth making before/alongside the partner fix:

1. **Extend the RLS pattern that already exists for `intimacy_sessions` to `users`/`cycle_data`**, gated on an active `partner_links` row and the relevant `share_*` flag — this is the one real architectural gap, and the fix is already demonstrated elsewhere in the same schema.
2. **Retire `AppContext`/`localStorage` as a parallel state system** for the MVP surface (it can stay for parked features, clearly marked as such) so there's one session/profile source of truth in the tree real users pass through.

Everything else — thin API routes, per-request RLS-scoped Supabase clients, hooks-plus-pure-utils component architecture — is already the right shape and should be extended, not replaced, as partner invitations, better charts, and cycle predictions are built in Phase 2.

---

## 23. Prioritised Build Plan

Vertical slices, in dependency order. Sizes: XS < 1hr, S ~ half day, M ~ 1-2 days, L ~ 3+ days.

1. **Fix production build** — Suspense-wrap `useSearchParams()` on `/auth/login`. *Files:* `src/app/(public)/auth/login/page.tsx`. *Acceptance:* `npm run build` exits 0. *Size:* XS. *Owner:* AI SAFE.
2. **Fix `/auth/callback`** — process the confirmation URL/code correctly (or confirm live behavior and adjust the page's messaging to reflect actual success/failure). *Files:* `src/app/(public)/auth/callback/page.tsx`. *Tests:* a component test asserting failure state renders for a bad/missing code. *Size:* S. *Owner:* USER + AI (auth flow correctness).
3. **Reconcile schema files and setup docs** — pick `supabase-schema.sql` + `intimacy-schema.sql` + `fix-intimacy-rls.sql` as canonical, delete/clearly-mark `supabase-initial-schema.sql` as obsolete, fix `docs/SUPABASE_SETUP.md`. *Size:* S. *Owner:* USER FIRST (data modelling decision), AI can execute the doc edits.
4. **Fix `users.privacy_settings` column default** to match the trigger/app defaults. *Files:* a new migration against `supabase-schema.sql`. *Size:* XS. *Owner:* USER FIRST (privacy-rule decision), AI SAFE to write the SQL once decided.
5. **Design and ship partner-linking RLS + acceptance flow** — the core missing piece. Requires: an RLS policy mirroring `intimacy_sessions`'s pattern for `users`/`cycle_data`; a real "accept invite" UI action wired to `acceptPartnerLink()`; an RLS `UPDATE` policy on `partner_links` scoped to the invited party. *Files:* new migration, `src/components/partner/NoPartnerState.tsx`, `src/services/partner/data.ts`, `database/*.sql`. *Tests:* a Vitest test hitting `/api/partner/shared-data` with a mocked active link asserting forbidden fields are absent; a test asserting an inactive/pending link returns no data. *Size:* L. *Owner:* USER FIRST (authorization/RLS design), then USER + AI for implementation.
6. **Harden `/api/partner?partnerId=`** against IDOR — verify the requested id is the caller's own active partner before querying. *Size:* S. *Owner:* USER + AI.
7. **Replace fabricated `PartnerCard`/`ManagePartnerCard` content** with real data from the partner service (or an honest "not connected" state until step 5 ships). *Size:* M. *Owner:* AI SAFE once step 5's data shape exists.
8. **Fix "Delete All Data"** to call real server-side deletion (or change UI copy to match current scope). *Size:* S. *Owner:* USER + AI (decide actual deletion semantics vs. GDPR expectations first).
9. **Remove dead affordances** — notification bell, fake SSO buttons, fake sidebar identity — either wire to real data/handlers or remove until built. *Size:* S. *Owner:* AI SAFE.
10. **Re-enable `ignoreBuildErrors`/`ignoreDuringBuilds: false`** once the above is clean, and fix whatever surfaces. *Size:* S–M depending on findings. *Owner:* AI SAFE for mechanical fixes, USER for judgment calls.
11. **Add server-side test for partner privacy filtering** (if not already covered by step 5's tests) and one IDOR-style test for `/api/cycle`/`/api/partner`. *Size:* S. *Owner:* USER + AI.
12. **Timezone fix** for `toCycleDateKey`/date fallbacks — parse/format consistently in local time. *Size:* S. *Owner:* USER + AI.
13. **Cycle-day calculation, dashboard charts, shared-fetch caching, `AppContext` retirement, remaining design-token/dead-code cleanup** — Phase 2-adjacent polish, safe to sequence after the above. *Size:* varies. *Owner:* mostly AI SAFE / USER + AI.

---

## 24. V1 Definition of Done

- `npm run build`, `npm run lint`, `npm test` all pass with no suppressed error categories in `next.config.ts`.
- A user can sign up, verify their email through a callback that actually validates the link, log in, log a cycle entry, and see it reflected on the dashboard with no fabricated data anywhere on the page.
- A user can toggle privacy settings, reload, and see them persist.
- A user can invite a partner, the partner can accept, and the partner's view shows only the fields the owner has explicitly enabled — verified by at least one automated test that a forbidden field is never present in the API response, not merely hidden in the UI.
- Revoking a shared field removes it from the partner's next refresh.
- No screen in the MVP surface displays a hardcoded name, status, or figure that isn't backed by real data for the signed-in user.

---

## 25. Phase 2 Boundary

Partner invitations (beyond MVP-minimum linking), richer dashboard charts/trends, cycle prediction improvements, a privacy-audit UI showing exactly what a partner can see, and rebuilding browser-level (Playwright or equivalent) coverage from `docs/PARKED_TEST_SCENARIOS.md` for the now-stabilized MVP journey.

## 26. Phase 3 Boundary

AI coach grounded in logged data, intimacy deck/sessions, fantasy vault, paid plans and Stripe checkout/webhooks, email reminders and notification preferences. All of this code may remain in the repository as reference/scaffolding; none of it should be promoted into MVP scope, reachable from primary navigation, or trusted as production-ready without a dedicated pass of its own.
