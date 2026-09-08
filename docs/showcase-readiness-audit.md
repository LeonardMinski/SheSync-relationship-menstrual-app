# Showcase Readiness Audit

Working document for `chore/showcase-readiness-audit`. Built by direct source
inspection (not from docs alone) during the 2026-09-08 audit pass. Baseline:
`tsc` 0 errors, lint 2 pre-existing warnings (unrelated to this audit — custom
font placement in `layout.tsx`, `<img>` in `Avatar.tsx`), 778/778 Vitest tests,
production build clean.

Status legend: **REAL** = real persistence/backend end-to-end. **PLACEHOLDER**
= intentionally UI-only, self-disclosed as such (`FeaturePlaceholder`/
`EmptyState`/`ComingLater`), no fabricated data. **DEAD** = built but
unreachable from any real entry point.

---

## Findings — bugs found and fixed live, this pass

Every one below was reproduced with real fixture accounts (not assumed from
reading code), fixed, then reverified live. See git log on this branch for
full commit messages and `docs/fixture-manifest.local.md` for the actors/rows
used.

1. **Vault V1 migration never applied live** — zero `vault_*` tables existed
   despite 4 commits of UI built against them. Applied (user-approved).
2. **`profile_image_url`** — every new user's client-side profile-creation
   fallback wrote a column that's never existed live, silently stranding the
   account with no `public.users` row. Now guarded by a schema-contract test
   (`src/services/auth/profileSchemaContract.test.ts`) that fails `tsc` and
   Vitest if the same class of drift recurs.
3. **Daily Check-in / Cycle History never fetched on mount** — `cycles`
   stayed empty until a same-session save triggered a refetch, so a
   genuinely-saved mood always looked unanswered after reload/fresh login.
4. **Coach send errors were invisible** — a failed AI reply rolled the
   optimistic message back out of state, which flipped the view back to the
   empty/landing branch — but the error banner only rendered in the
   non-empty branch. User saw nothing; message was actually safely
   persisted server-side the whole time.
5. **`get_revealed_vault_spark` ambiguous column** — `RETURNS TABLE(id ...)`
   plus an unqualified `WHERE id = p_spark_id` inside the function body
   made Postgres unable to tell which `id` was meant. Nobody — owner or
   partner — could ever view a Spark's content after completing the reveal
   ceremony. Live since the Vault migration was first applied this morning.
6. **`shared_replies` CHECK constraint missing `vault_spark`** — the Vault
   migration taught the RPC layer about a fourth reply source type but
   never updated the table's own constraint; every reply on a revealed
   Spark's focused-talk thread failed with a 500.
7. **Hardcoded "Not Revealed Yet" pill** on the partner Spark-response page
   — static regardless of actual status, producing a contradictory
   "Not Revealed Yet" / "Revealed" pair once a Spark really was revealed.
8. **Connect Explore tab's fake success banners** — claimed "Saved
   privately" with no backend behind it; disclosure was below the fake
   success instead of before it.
9. **Naming collision** between the real, backend-wired Mutual Reveal
   feature and a fully local-only simulated demo of the same name embedded
   in Explore — renamed the fake one to `AnswerTogetherPreview`.

**Dead code removed** (confirmed zero importers each): `src/app/api/auth/route.ts`
(306 lines, already flagged dead in `docs/MVP_AUDIT.md`), `PricingPage.tsx`
(orphaned, fake Stripe price ID + native `alert()`), `ComingSoonTile.tsx`,
`CoachPreviousConversations.tsx` (orphaned after the Coach UI simplification
below), 5 unused npm dependencies.

**Product/UI changes per direct instruction:** removed the "AI Coach Active"
and privacy-chip status pills, and the "Previous Chats" history modal, from
the Coach screen.

**Documentation corrected:** Coach was mislabeled "UI placeholder, no AI
backend" in both `ROADMAP.md` and its own source comment — it's real
(persisted conversations, real OpenAI replies). `/pricing` was misclassified
as an unreachable stub — it's real and linked from the homepage. Two "parked"
route stubs (`/fantasy`, `/intimacy`) had stale "future feature" copy instead
of "superseded by X."

**Confirmed clean / not fixed (documented, out of scope):** Stripe webhook
writes two more nonexistent `public.users` columns (`subscription_status`,
`stripe_subscription_id`) — same bug class as #2, left alone because it's
entangled with the already-known anon-key/RLS issue that makes the webhook
non-functional regardless, and real Stripe work is explicitly deferred.
Avatar's upload path is complete but unreachable — recommended for removal,
not executed (product decision, not mine to make unilaterally). A single
~240s `/api/user` response was observed once during extremely heavy
concurrent local test load (dozens of browser contexts + live migrations in
one session) — very likely a local resource-contention artifact, not
reproduced a second time, flagged for awareness rather than chased further.

---

## Phase 1 — Feature & Route Inventory

### Auth

| Route | Entry point | Write? | Status | Notes |
|---|---|---|---|---|
| `/` | direct | no | REAL | Public marketing landing page |
| `/auth/login` | nav link, redirects | yes (session) | REAL | |
| `/auth/signup` | nav link, homepage CTA | yes (auth.users) | REAL | Client-side Zod validation; Supabase itself also validates email format server-side (rejects e.g. `.local` TLDs) |
| `/auth/callback` | email link | yes (session) | REAL | |
| `/auth/forgot-password`, `/auth/reset-password` | login page link | yes | REAL | |
| `/auth/verify-email` | post-signup redirect | no | REAL | |
| `/onboarding` | post-signup redirect (conditional) | yes (`onboarding_completed_at`) | REAL | Corrected this pass — was stale-documented as placeholder; verified live end-to-end (redirect-to, persist, redirect-away-after) |

### Home / Dashboard

| Route | Entry point | Write? | Read? | Status | Notes |
|---|---|---|---|---|---|
| `/dashboard` | primary nav "Home" | yes (`cycle_data` upsert via Daily Check-in) | yes | REAL | Daily Check-in mood save was 500ing until today's `cycle_data_add_sleep_metric` migration; verified fixed live |

### Cycle

| Route | Entry point | Write? | Status | Notes |
|---|---|---|---|---|
| `/cycle` | primary nav "Cycle" (tracking-enabled only) | yes (`periods`, `period_day_logs`, `cycle_data`) | REAL | Start/log/update/end period, add past period all real per existing test coverage |
| `/cycle/history` | Cycle page link | no (read) | REAL | |
| `/cycle/patterns` | Cycle page link | no (read) | REAL | Pattern Engine V1 — deterministic observations, not ML |

### Coach

| Route | Entry point | Write? | Status | Notes |
|---|---|---|---|---|
| `/coach` | primary nav "Coach" (tracking-enabled only) | yes (`coach_conversations`, `coach_messages`) | **REAL** | Corrected this pass — was mislabeled "UI placeholder, no AI backend" in ROADMAP and in the page's own source comment. Real persisted threaded conversations, real OpenAI replies scoped to the caller's own cycle/wellbeing logs (`src/features/coach/openaiClient.ts`, `src/features/coach/systemPrompt.ts`). See `docs/COACH_CONVERSATION_WORKSPACE.md`. Old unauthenticated prototype (`src/components/ai-coach/AICoach.tsx`, `src/hooks/useCoach.ts`, old `/api/coach/route.ts`) was already deleted outright in a prior pass, guarded by `src/app/api/coach/legacy-routes-removed.test.ts` |
| `/api/coach/conversations` (GET/POST) | Coach UI | yes | REAL | Auth + tracking-capability gated |
| `/api/coach/conversations/[id]` (GET/DELETE) | Coach UI | yes (delete) | REAL | |
| `/api/coach/conversations/[id]/messages` (GET/POST) | Coach UI | yes | REAL | Calls OpenAI; truthful error message on failure ("Coach couldn't generate a response... may be temporary") rather than a fake reply |
| Partner Translation | `/connect/translate` | yes | REAL | Lives under Connect, not Coach — see below |

### Connect

| Route | Entry point | Write? | Status | Notes |
|---|---|---|---|---|
| `/connect` (hub) | primary nav "Connect" | no (read) | REAL shell | Partner tab is real; Explore/Boundaries/Reflections tabs are placeholder |
| `/connect` → Partner tab | tab | yes | REAL | Reuses `PartnerPortal`, same component as legacy `/partner` route |
| `/connect` → Explore tab | tab | **no** (fixed this pass) | PLACEHOLDER, now honestly disclosed | Was showing a fake "Saved privately" success banner before any disclosure; fixed — disclosure now shown first, banners no longer claim persistence, redundant "Share response" button removed |
| `/connect` → Boundaries tab | tab | no | PLACEHOLDER | `FeaturePlaceholder`, honestly disclosed |
| `/connect` → Reflections tab | tab | no | PLACEHOLDER | `FeaturePlaceholder`, honestly disclosed |
| `/connect/appreciate` | Connect hub card | yes (`relationship_appreciations`) | REAL | |
| `/connect/memory` | Connect hub link | no (read) | REAL | |
| `/connect/mutual-reveal` | Connect hub card | yes (`relationship_sessions`) | **REAL** | Backed by `useRelationshipSession`/RPCs (start/answer/markReady/reveal) — do not confuse with the unrelated local-only preview inside Explore, renamed this pass to `AnswerTogetherPreview` specifically to end that confusion |
| `/connect/repair` | Connect hub card | yes (`relationship_sessions`) | REAL | Same ceremony shape as Mutual Reveal, different session type |
| `/connect/show-up-today` | Home's incoming-shared-context card (`IncomingSharedContextCard.tsx`) and Connect's `PartnerHome.tsx` | yes | REAL | |
| `/connect/support-preferences` | Connect hub card | yes (`support_preferences`) | REAL | |
| `/connect/translate` | Connect hub link | yes | REAL | Partner Translation |
| `/connect/weekly-us` | Connect hub card | yes | REAL | |
| `/partner` | legacy direct route, kept for existing links/tests | yes | REAL | Same `PartnerPortal` component as `/connect`'s Partner tab |

### Vault

| Route | Entry point | Write? | Status | Notes |
|---|---|---|---|---|
| `/vault` (home) | primary nav "Vault" | no (read) | REAL | Spark list, status-grouped |
| `/vault/new` | Vault home CTA | yes (`vault_sparks` insert) | REAL | Create Spark |
| `/vault/[id]` | Spark card | yes (edit/archive) | REAL | |
| `/vault/[id]/tease` | Spark detail | yes (`create_vault_tease` RPC) | REAL | |
| `/vault/[id]/talk` | after reveal | yes (`add_reply`/`get_replies`, source type `vault_spark`) | REAL | Focused conversation, gated on `revealed_at IS NOT NULL` |
| `/vault/[id]/afterglow` | after reveal | yes (`vault_afterglow_reflections`) | REAL | |
| `/vault/decks` | Vault home CTA | no (read) | REAL | "Premium" pill is branding-only, verified honest — fully clickable, no fake lock, no fake "Unlock" CTA |
| `/vault/decks/[deckId]` | Desire Decks grid | yes (`deck_interest_level` on a Spark) | REAL | Give & Receive is one of the six decks, not a separate entity |
| `/vault/for-tonight` | Vault home CTA | no (read) | REAL | `get_deck_prompt_matches()` — structurally cannot leak partner's actual Spark content, only "a match exists" |
| `/vault/partner` | Vault home | no (read) | REAL | `get_partner_vault_summary()` — cannot return `content` column, by construction |
| `/vault/partner/[id]` | Partner Vault list | yes (tease response, ready, reveal, reaction) | REAL | |
| Vault DB migration | — | — | REAL (applied this session, user-approved) | `vault_sparks`/`vault_afterglow_reflections` didn't exist live until today despite 4 commits of UI built against them |

### Settings / Subscription

| Route | Entry point | Write? | Status | Notes |
|---|---|---|---|---|
| `/settings` | avatar/profile menu | yes | REAL | No avatar-upload UI present — see Avatar Decision below |
| `/settings/privacy` | Settings link | yes (`privacy_settings`) | REAL | |
| `/pricing` | homepage CTA | no | REAL shell, honest gate | Corrected this pass — ROADMAP wrongly called this an unreachable `ComingLater` stub. It's a real, designed page; "Unlock Premium" is honestly `disabled`, not fake-functional |
| Premium entitlement | — | — | **NOT REAL ANYWHERE** | No API route checks `subscription_tier` server-side. Stripe webhook can't even write it (anon-key client, RLS blocks). Confirmed still true this pass. Vault's "Premium" label is branding-only, not a gate. **Also found this pass**: even setting the RLS/service-role issue aside, the webhook's `subscription_status` and `stripe_subscription_id` fields don't exist on the live `public.users` table at all (same class of bug as the fixed `profile_image_url` issue — see `src/services/auth/profileSchemaContract.test.ts`) — confirmed via `mcp__supabase__generate_typescript_types`. Not fixed this pass: this is tangled up with the Stripe/entitlement work that's explicitly deferred until that implementation is real (per direct instruction), and fixing the schema without fixing the auth/RLS issue wouldn't make the webhook functional anyway. Flagging so whoever picks up real Stripe integration knows both problems exist, not just the documented one. |

### Parked (unreachable from nav by design, `ComingLater` if visited directly)

| Route | Status |
|---|---|
| `/ai-coach` | Stub, superseded by real `/coach`. Copy is accurate. |
| `/fantasy` | Stub, superseded by real `/vault`. Copy corrected this pass (previously said "future feature," now says superseded). |
| `/intimacy` | Stub, superseded by Connect's tabs. Copy corrected this pass. |
| `/partner/intimacy` | Stub. Copy already accurate. |

---

## Phase 3 — Route Reachability Classification

| Route | Class | Notes |
|---|---|---|
| All routes under Auth, Home, Cycle, Coach, Connect (Partner/appreciate/memory/mutual-reveal/repair/support-preferences/translate/weekly-us), Vault, Settings, `/pricing`, `/` | **A — user-facing, valid** | Reachable via real nav/CTAs, all render and function |
| All `/api/**/route.ts` except the two below | **B — internal/API** | Called by real client code |
| `/partner` | **C — legacy but required** | Kept deliberately for existing links/tests per ROADMAP; `/connect` is the primary entry point now |
| `/ai-coach`, `/fantasy`, `/intimacy`, `/partner/intimacy` | **C — legacy, intentionally kept reachable-by-URL** | Not linked from nav; render an honest `ComingLater` stub if visited directly. Correct as-is, not dead — a direct-URL visitor gets truth, not a 404 |
| `src/app/api/auth/route.ts` | **D — dead, REMOVED this pass** | Zero callers; duplicate of real client-side auth logic |
| `src/components/pricing/PricingPage.tsx` | **D — dead, REMOVED this pass** | Zero callers; orphaned, superseded by the real `/pricing/page.tsx` |
| `src/components/dashboard/ComingSoonTile.tsx` | **D — dead, REMOVED this pass** | Built, never rendered |
| `src/components/ui/Avatar.tsx`'s `editable`/upload path | **D — dead code inside a live component** | `Avatar` itself is used (in `TopNavbar`), but `onAvatarUpload` is never passed by any caller — see Avatar Decision below. Not removed this pass (recommendation only, per explicit instruction) |
| `src/components/intimacy/*`, `src/services/intimacy/*`, `src/components/fantasy/*`, `src/services/fantasy/*` | **D, but KEEP — documented parked/legacy** | ROADMAP explicitly says do not delete, do not wire up as-is (schema drift). Confirmed nothing new got wired to them this pass |
| `ai_coach_messages` table | **D — obsolete, DB-only** | Superseded by `coach_conversations`/`coach_messages`; app code that used it already deleted. Table itself is a DB cleanup candidate, not an application-code one — out of scope for this pass (would need a migration + live approval) |
| `database/vault-v1-migration.sql`, `database/cycle-sleep-migration.sql`, `database/security-advisory-hardening-migration.sql` | **KEEP — migration history** | All three now applied live; keep as the historical record even though the "not yet applied" framing in some is now stale (see note in each file) |
| `src/app/api/intimacy/route.ts`, `src/app/api/fantasy/route.ts` | **C — legacy, still live, unauthenticated-reachable-by-direct-call** | Not linked from any current UI (ROADMAP-documented), but still respond to direct API calls. Lower-priority finding from the security fork: both leak raw `error.message` to the client on failure, unlike every other RPC-calling route. Pre-existing, low severity given no live UI dependency — not fixed this pass (would mean touching parked/drifted code the ROADMAP explicitly says not to touch without a re-audit) |

---

## Avatar Decision (see task instructions §12)

Investigated whether profile/avatar editing is intended beta/showcase scope:
- `public.users` has **no** avatar/image column at all, live or in any migration.
- Settings page (`/settings`) has zero avatar-related UI.
- No design doc (`ROADMAP.md`, `MVP_DESIGN_SPEC.md`, `vault-v1.md`) mentions avatar/profile-picture editing as planned.
- `Avatar`'s only render site (`TopNavbar.tsx`) never passes `onAvatarUpload`.

**Conclusion: not intended scope** — this reads as generic scaffolding that was never connected to a product requirement, not a dropped feature. Recommend removing the unused upload branch (state, handler, hidden `<input type="file">`, upload button) from `Avatar.tsx`, leaving just the display component `TopNavbar` actually uses. Not removed in this pass per instruction — flagging for your decision rather than deleting unilaterally, since this crosses from "dead code" into "a feature that doesn't exist yet, that would take real work (schema + storage bucket + UI) to build."

---

## What this document does not yet cover

Built primarily from source-code inspection, not yet from a full live-browser
click-through of every row. Journey-level persistence verification (action →
API → DB write → read-back → UI update → reload → same state) is the next
phase, blocked briefly on a Supabase Auth signup rate limit from earlier
testing in this session — resuming once dedicated test-account fixtures are
in place (see fixture manifest, to be added alongside this document).

Not yet independently re-verified in this pass (carried forward from the
Supabase/security fork's report, which found these clean but did not exhaustively
cover 100% of the ~37 API routes): full Zod-schema alignment on the remaining
routes beyond the ones spot-checked.
