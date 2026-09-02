# SheSync+ MVP Audit — Validation Pass

**Date:** 2026-08-30 · **Branch:** `develop` (unchanged since the original audit — `git status` clean, no new commits, only the untracked `docs/MVP_AUDIT.md` from that pass). **Mode:** read-only re-verification against current source. No production code, SQL, or RLS policy was modified.

This is a focused re-check of the findings in `docs/MVP_AUDIT.md` that could change architecture or priorities, per the request. It does not re-run the full 26-section audit.

---

## 1. Current Build State

Ran `rm -rf .next && npm run build` fresh (not reusing any stale build cache).

```
✓ Compiled successfully in 3.0s
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/auth/login"
Error occurred prerendering page "/auth/login".
Export encountered an error on /(public)/auth/login/page: /auth/login, exiting the build.
Next.js build worker exited with code: 1
```

**Result: FAILS. CONFIRMED, not stale.** The code at `src/app/(public)/auth/login/page.tsx:35` (`const searchParams = useSearchParams();`) is unchanged from the original audit and is still called with no Suspense boundary. This is not a fixed-then-regressed issue — it was never fixed. The original audit's P0 build blocker stands exactly as written.

---

## 2. Live Schema vs Repository Schema

Re-read `database/supabase-schema.sql` and `database/intimacy-schema.sql` directly (not from memory) and cross-checked against the API/service code that writes/reads each table today.

| Table | Column | Expected by application | Present in `supabase-schema.sql` | Present in `supabase-initial-schema.sql` | Present in `intimacy-schema.sql` | Conflicting defaults? | Migration ambiguity |
|---|---|---|---|---|---|---|---|
| `users` | `id` | yes (FK to `auth.users`) | yes, FK'd | yes, standalone PK (no `auth.users` FK) | — | — | Two files model `id` incompatibly — following `supabase-initial-schema.sql` breaks every RLS policy that assumes `auth.uid() = id` |
| `users` | `privacy_settings` | yes, JSONB, all-false default | yes — **column `DEFAULT` sets `share_cycle_phase: true, share_mood: true`** | not present (no such column) | — | **YES — confirmed live.** Column default disagrees with the `handle_new_auth_user()` trigger in the same file (which explicitly inserts all-`false`, lines 176-189) and with all 5 app-level `DEFAULT_PRIVACY_SETTINGS`/`defaultPrivacySettings` constants (verified in §5 below, all all-`false`) | Dead in practice today (every insert path supplies the column explicitly), but live in the schema file — any future insert that omits the column inherits share-on-by-default |
| `users` | `profile_image_url` | yes — written unconditionally by `src/services/auth/index.ts:149` and `src/app/api/auth/route.ts:136,159` | **not present** | not present | — | — | If the live DB matches the committed file exactly, every signup insert including this field would be rejected by PostgREST. Cannot confirm live-DB state from the repo — no migrations directory exists |
| `users` | `subscription_status`, `stripe_subscription_id` | yes — read/written by `src/app/api/webhooks/stripe/route.ts` | **not present** | not present | — | — | Same ambiguity; lower blast radius since Stripe is parked |
| `cycle_data` | `user_id`, `date`, `phase`, `mood`, `energy`, `libido`, `stress`, `symptoms`, `notes` | yes | yes, matches exactly | different table entirely (`cycles`, no `date`/`energy`/`libido`/`stress`) | — | — | `supabase-initial-schema.sql` is not runnable against the current app code at all |
| `cycle_data` | `period_flow`, `temperature`, `weight` | supported by API, never collected by UI | yes | not present | — | — | Dead surface, not a conflict |
| `cycle_data` | RLS | owner-only read/write | `CREATE POLICY ... USING (auth.uid() = user_id)` for SELECT/INSERT/UPDATE/DELETE, confirmed present, **no partner exception** | owner-only on `cycles` | — | — | No ambiguity — confirmed as audited |
| `privacy_settings` | (see `users.privacy_settings` above) | — | — | — | — | — | — |
| `partner_links` | table existence | required by `/api/partner`, `/api/partner/shared-data`, `src/services/partner/data.ts` | **does not exist** in this file | **does not exist** (a differently-shaped `partners` table exists instead, with a `('pending','accepted','declined')` status enum) | **yes**, defined here | — | The MVP's partner feature depends entirely on a table that lives in a *third*, separate SQL file neither setup doc (`docs/SUPABASE_CONFIG.md` → `supabase-schema.sql`; `docs/SUPABASE_SETUP.md` → `supabase-initial-schema.sql`) tells a new operator to run. A fresh setup following either doc literally will not have this table. |
| `partner_links` | `status` column default | app always writes `'pending'` explicitly on insert, `'active'`/`'inactive'` elsewhere | n/a | n/a | **column `DEFAULT 'active'`** — confirmed at `intimacy-schema.sql:24` | Latent — the app never relies on the column default (every insert supplies `status` explicitly), but it is the opposite of what a cautious default should be for an unconsented partner relationship | No CHECK constraint on `status` at all — any string is accepted at the DB layer |
| `partner_links` | RLS | needs SELECT (both sides), INSERT (initiator), **UPDATE (to accept/activate)** | n/a | n/a | Confirmed: **only `SELECT` (`partner_links_owner_or_partner`) and `INSERT` (`partner_links_owner_insert`) policies exist. There is no `UPDATE` policy on `partner_links` at all.** | — | **This independently confirms, at the RLS layer, that `acceptPartnerLink()` (`src/services/partner/data.ts:141-157`) cannot succeed even if it were called from the UI** — a client-side RLS-scoped `UPDATE` on `partner_links` would be rejected by Postgres with zero matching rows, regardless of the missing UI handler. |

**Net finding, confirmed and slightly sharpened from the original audit:** the partner feature's non-functionality is over-determined — it fails independently at (a) no UI handler, (b) no RLS UPDATE policy to accept a link even via direct API/SQL use, and (c) no RLS SELECT grant on `users`/`cycle_data` for a partner even if a link were somehow marked active. Fixing only one of these three would not be sufficient.

---

## 3. Auth Journey

Traced signup → verification email → `/auth/callback` → session → profile → dashboard against current source.

- **Signup**: `src/services/auth/index.ts` → `supabase.auth.signUp({ emailRedirectTo: `${origin}/auth/callback` })`. Unchanged, working as audited.
- **Verification required branch**: signup page routes to `/auth/verify-email` (static instructional page) when no session comes back immediately. Unchanged.
- **`/auth/callback` — re-read in full, confirmed BROKEN, not visual-only-by-design but visual-only-in-fact:**

```tsx
"use client";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

export default function AuthCallback() {
  return (
    <div className="...">
      ...
      <h1 className="text-2xl font-bold text-white dark:text-white mb-4">
        Email Confirmed!
      </h1>
      <p>Your email has been confirmed successfully. You can now log in...</p>
      <Link href="/auth/login">Continue to Login</Link>
      ...
    </div>
  );
}
```

There is no `useSearchParams`, no `useEffect`, no import of the Supabase client, no call to `exchangeCodeForSession`, `getSession`, or anything else that reads the URL or talks to Supabase. **This component is 100% static markup.** It renders "Email Confirmed!" unconditionally — for a valid link, an expired link, a already-used link, or someone navigating to `/auth/callback` directly with no query string at all. It does not establish a session; it does not fail visibly for a bad link; it does not read `code`/`token_hash`. Whatever actually confirms the email and creates a session must happen either (a) entirely server-side inside Supabase's own hosted confirmation redirect before the browser ever reaches this page, or (b) not at all client-side. Static review cannot distinguish those — but the page's own code contributes nothing to session establishment either way, and gives no correct feedback if the link is bad.

- **Classification: BROKEN** (as a component — it does not do what its own copy claims to have verified) **for the specific claim "this page confirms your email and can tell you if it didn't."** The overall question "does the user end up with a working session after clicking the email link" is **UNCERTAIN — MANUAL TEST REQUIRED**, since Supabase's default `signUp`/email-link flow may complete session establishment via its own redirect mechanics before this page's code ever runs — that cannot be confirmed by reading this repository alone, and there is no live Supabase project credential available in this session to test against.
- **Session/profile/dashboard legs**: unchanged from the original audit — `AuthContext` hydration, `loadOrCreateUserProfile`, and the `(app)/layout.tsx` guard all still read exactly as previously described. **WORKING**, contingent on the callback question above.

**Overall auth-journey classification: `/auth/callback` = BROKEN (as authored); full session-establishment outcome = UNCERTAIN — MANUAL TEST REQUIRED.**

---

## 4. Partner Security Architecture

Traced `/api/partner/shared-data` line by line against the current file.

- **Which Supabase client does it use?** `authenticateRequest()` (`src/lib/api/authentication.ts`) constructs a fresh `createClient(url, ANON_KEY, { global: { headers: { Authorization: \`Bearer ${token}\` } } })` — i.e. the **anon key**, with the caller's own access token forwarded so Postgres sees `auth.uid()` as the caller. **No service-role key is used anywhere in this path** (confirmed: `SUPABASE_SERVICE_ROLE_KEY` is referenced only in `src/lib/env.ts`'s declaration, never passed to `createClient` anywhere in `src/`).
- **Under whose credentials does the query execute?** The **partner's own** credentials (the person calling `GET /api/partner/shared-data`) — every query in this route runs RLS-scoped as the authenticated caller, not as the data owner and not as a privileged role.
- **Can the partner directly query the owner's `cycle_data` through browser Supabase?** No route in `src/services/partner/data.ts` does this — `getPartnerSharedData()` always goes through the `/api/partner/shared-data` `fetch()` call, never a direct `supabase.from('cycle_data')` query for someone else's rows. Even if a partner tried this by hand from browser devtools using their own session, the owner-only RLS policy on `cycle_data` (`auth.uid() = user_id`) would block it — confirmed in §2.
- **Does the API intentionally act as the data boundary?** Yes — this is the one route in the codebase deliberately structured to look up the relationship, check privacy flags, and assemble a response object field-by-field rather than querying-then-filtering client-side. The *intent* is architecturally sound.
- **Where is relationship authorisation checked?** `partner_links` lookup at the top of the route: `.eq('user_id', userId).eq('status', 'active')` where `userId` is the caller. **Note a directional subtlety confirmed by re-reading `src/app/api/partner/route.ts` POST**: a link is created with `user_id = <inviter/caller>, partner_user_id = <invited email's user>`. For `shared-data`'s query (`.eq('user_id', userId)`) to return that link, **the caller of `shared-data` must be the same person who originally sent the invite** — i.e., today's code models "the person who typed in an email address becomes the viewer, and the invited email's owner becomes the one whose data is exposed." There is no endpoint anywhere that lets the *invited* party see or act on an incoming link where they are `partner_user_id` (no query filters on `partner_user_id = callerId AND status = 'pending'`). This means even setting aside the missing accept-UI and missing RLS UPDATE policy (§2, §6), the invited party currently has no way to discover an invitation exists at all, regardless of who is supposed to initiate.
- **Where are privacy settings checked?** Immediately after the partner-info lookup: `canShareWithPartner = privacySettings.share_with_partner === true`, then `canShareCyclePhase`/`canShareMood` each additionally gated on `canShareWithPartner`. Confirmed field-by-field.
- **Does raw forbidden data ever enter the browser?** No. Re-read lines 102-177 in full: `sharedData.todayCycle` is only ever *assigned* `phase`/`mood`/`energy` keys inside `if (canShareCyclePhase)`/`if (canShareMood)` blocks — the keys simply don't exist on the response object otherwise, they are not fetched-then-omitted. `shareFantasyVault`/`shareIntimacyDeck` are hardcoded `false` in the DTO regardless of the owner's real setting, and no fantasy/intimacy table is ever queried by this route. **Confirmed clean** — this is the one place in the partner feature that already matches the required `DB → auth → filter → DTO → client` shape.
- **Does the current architecture actually require direct partner SELECT RLS on `cycle_data`/`users`?** **Yes, as currently written, it does** — because the route executes its Supabase queries under the *partner's own* JWT (anon key + forwarded token), any query against `users`/`cycle_data` for the owner's `id`/`user_id` will return zero rows unless RLS explicitly grants the partner read access to those rows. That grant does not currently exist (§2), which is why the feature returns "not found" for every partner today, confirmed by the route's own dedicated `42501`/`PGRST116` handling that anticipates exactly this failure.

### Recommendation: **B — partner gets NO raw database access; a server endpoint produces a filtered DTO.**

The application-layer filtering logic in `/api/partner/shared-data` is already correct and already assumes this shape — the only thing missing is *how the route itself is allowed to read the owner's raw rows* without depending on the partner's own RLS grant. Do not fix this by giving the partner's session direct `SELECT` rights on `users`/`cycle_data` (Option A) — that would mean the safety of the owner's raw cycle/mood data now depends on the correctness of a same-request-time boolean check in application code, with no independent enforcement if that route is ever modified, forked, or reused. That is a strictly worse security posture than what's already documented as the audit's required architecture.

Instead, the query the route runs against the owner's data should execute under a narrowly-scoped, privileged path that is *not* the partner's own RLS session — for example, a Postgres `SECURITY DEFINER` function (invoked via `.rpc()`) that internally re-verifies the active `partner_links` row and the owner's `privacy_settings` before returning only the permitted columns, or (less preferred, since it's a broader instrument) a service-role client used *only* inside this one route, with the authorization+filtering check happening before any such privileged read. Either approach keeps "partner never gets a raw grant on the owner's tables" true at the database level, not just in this one route's application code — which is the actual security property the original audit's required architecture diagram was describing. **This is an architecture decision, not implemented here, per instructions.**

---

## 5. Privacy Defaults

Every source defining a privacy-settings default, re-read directly from current files:

| Source | File:line | Values |
|---|---|---|
| SQL column `DEFAULT` (`users.privacy_settings`) | `database/supabase-schema.sql` (`CREATE TABLE public.users`) | `share_with_partner: false, share_cycle_phase: **true**, share_mood: **true**, share_fantasy_vault: false, share_intimacy_deck: false` |
| SQL trigger `handle_new_auth_user()` | `database/supabase-schema.sql:176-189` | `share_with_partner: false, share_cycle_phase: false, share_mood: false, share_fantasy_vault: false, share_intimacy_deck: false` |
| Zod / app constant | `src/schemas/privacy.ts:30-36` (`DEFAULT_PRIVACY_SETTINGS`) | all five: `false` |
| Service layer constant | `src/services/auth/index.ts:37-43` (`DEFAULT_PRIVACY_SETTINGS`) | all five: `false` |
| API route constant | `src/app/api/auth/route.ts:9-15` (`DEFAULT_PRIVACY_SETTINGS`) | all five: `false` |
| Hook constant | `src/hooks/usePrivacySettingsForm.ts:12-18` (`defaultPrivacySettings`) | all five: `false` |
| Auth context fallback | `src/context/AuthContext.tsx:27-33` (`defaultPrivacySettings`, camelCase) | all five: `false` |

**Six of seven sources are already `false` across the board — the target product rule ("all partner sharing OFF by default") is already the practical behavior for every real signup, since the trigger (not the column default) is what actually fires on `auth.users` insert.** The single outlier is the SQL column `DEFAULT` clause itself, which is inert today only because every current insert path supplies the column explicitly. It should be corrected to match the other six sources so there is one, not two, sources of truth — flagged, not fixed, per instructions.

---

## 6. Partner Link Journey

Traced whether two real accounts can currently become linked, re-reading `src/app/api/partner/route.ts`, `src/services/partner/data.ts`, `src/components/partner/NoPartnerState.tsx`, and the `partner_links` RLS policies directly.

| Step | Classification | Evidence |
|---|---|---|
| Owner/inviter initiates | **PARTIAL** | `POST /api/partner` with a `partnerEmail` works mechanically (creates a `partner_links` row, `status: 'pending'`) — but there is no UI form anywhere that calls it. `NoPartnerState.tsx`'s "Connect Partner" button has **no `onClick` handler at all** (confirmed present in current source, unchanged). The backend half works if called directly; the UI half doesn't exist. |
| Invitation/link record created | **IMPLEMENTED** (mechanically) | Row is created correctly with `status: 'pending'`, `UNIQUE(user_id, partner_user_id)` enforced. |
| Invited party can see/discover the pending invite | **MISSING** | No endpoint or UI queries `partner_links` for `partner_user_id = callerId AND status = 'pending'` anywhere in the codebase — the invited party has no way to know an invite exists. |
| Partner accepts | **MISSING / would fail even if called** | `acceptPartnerLink(linkId)` exists in `src/services/partner/data.ts` but (a) is never called by any component, and (b) would be rejected by RLS even if called directly — **confirmed in §2: no `UPDATE` policy exists on `partner_links` at all.** This is doubly missing, not just missing a UI hookup. |
| Relationship becomes active | **MISSING** | Direct consequence of the above — nothing in the system can ever set `status = 'active'` through any currently-reachable path. |
| Owner can revoke | **PARTIAL** | `DELETE /api/partner` and `removePartnerLink()` both correctly flip `status` to `'inactive'` for the caller's own link — this part is real and would work, but is moot while no link ever reaches `'active'` in the first place. |
| Dashboard/settings UI reflects any of the above | **FAKE UI** | `PartnerCard` (dashboard) and `ManagePartnerCard` (settings) both display a hardcoded fake connected-partner state regardless of whether any of the above steps have ever happened for the current user — confirmed unchanged, full text quoted in §8. |

**Answer: No, two real accounts cannot currently become linked.** Not "difficult" or "requires a manual step" — there is no reachable sequence of UI actions or even direct, authenticated API calls (the RLS gap blocks the API path too) that results in an active `partner_links` row today.

---

## 7. Delete Data

Re-read `src/hooks/useSettingsPageState.ts` and `src/components/settings/DeleteDataDialog.tsx` directly.

The confirmation dialog's copy: *"This action cannot be undone. All cycle data, entries, and local settings will be permanently deleted."*

The actual handler, in full:
```ts
const deleteAllData = async () => {
  localStorage.clear();
  await signOut();
  setShowDeleteConfirm(false);
  router.replace("/");
};
```

| Data category | Actually deleted? |
|---|---|
| Local component state | Yes (implicitly, via navigation away) |
| Browser `localStorage` | **Yes** — `localStorage.clear()` |
| `cycle_data` rows (Supabase) | **No** — no API call, no Supabase delete |
| `privacy_settings` (Supabase) | **No** |
| `partner_links` rows (Supabase) | **No** |
| `users` profile row (Supabase) | **No** |
| Underlying Supabase Auth account | **No** — only `signOut()` is called, which ends the session; the account and every row above remain intact |

**Confirmed exactly as the original audit found, unchanged.** The only real effect is clearing `localStorage` (which for the MVP journey holds theme/legacy `AppContext` state, not the user's actual cycle data — that lives in Supabase) and signing the user out. Every category the dialog explicitly promises to delete except "local settings" is left completely untouched.

---

## 8. Fake / Misleading MVP State

Re-confirmed by reading each source file directly (not from the earlier audit's memory):

| Item | Current status | User-visible on a real MVP screen? |
|---|---|---|
| "Alexandria Montgomery-Santos" | `src/components/dashboard/PartnerCard.tsx:4`, hardcoded `const partnerName = ...`, rendered unconditionally with no data binding | **Yes — dashboard, every user, regardless of partner state** |
| "Alex M." / "Connected" | `src/components/settings/ManagePartnerCard.tsx:22,25,27`, hardcoded, no props/data source | **Yes — `/settings/privacy`, every user** |
| "Sarah J." / "Premium Secure" | `src/components/layout/AppSidebar.tsx:88-93`, hardcoded, ignores the real `authUser`/subscription tier entirely | **Yes — sidebar, every authenticated page** |
| Apple login button | `src/app/(public)/auth/login/page.tsx` — plain `<button type="button">` with no `onClick` | **Yes — `/auth/login`, first screen of the funnel** |
| Google login button | same file, same pattern | **Yes — `/auth/login`** |
| Notification bell | `src/components/layout/TopNavbar.tsx` — renders on every MVP page (`showNotifications` passed by dashboard/cycle/settings/partner), no `onClick`. Confirmed the "unread" red dot is **not** hardcoded on — `hasUnreadNotifications` defaults `false` and is never passed `true` anywhere — so it's a dead affordance, not a fake-data indicator. | **Yes (dead button), but does not fabricate an unread count** |
| "Manage Sharing" / "Manage Partner" cards' `StatusPill`s ("Shared: Cycle phase, mood logs" / "Private: Symptoms, notes") | `PartnerCard.tsx:28-29`, static strings, not derived from `PrivacySettings` | **Yes — dashboard, every user** |
| "View Partner's Perspective" button | `ManagePartnerCard.tsx:33-36` — `<Button>` with no `onClick` | **Yes — `/settings/privacy`, every user** |
| Subscription status text | "Premium Secure" (sidebar) is not tied to `subscription_tier` at all — it's a static string, not a real "fake value that varies," just an unconditional label | **Yes** |

**Distinction requested — demo-only vs. user-visible:** none of the above are gated behind a demo flag, a dev-only environment check, or a Storybook-style fixture. Every one of these renders on the real, production-configured MVP route for any signed-in user today. There is no "demo mode" separating these from what a real user sees — they are load-bearing UI in the shipped MVP surface.

---

## Confirmed Deltas from the Original Audit

Nothing found in this validation pass contradicts `docs/MVP_AUDIT.md`. Two points are **sharper** than originally stated:

1. The partner-link direction analysis (§4, §6) adds a third independent failure mode beyond "no UI handler" and "no RLS UPDATE policy": **there is no code path anywhere for the invited party to even discover a pending invitation**, regardless of which side is expected to initiate. This wasn't spelled out explicitly in the original audit and further confirms the linking feature needs to be designed, not just wired up.
2. The `/api/partner` query direction confirms the *inviter* becomes the shared-data *viewer* in the current schema (`user_id` = caller of `shared-data`, `partner_user_id` = the data source) — worth stating explicitly before any UI is built for step 6, since it determines which side of a couple should see the "Connect Partner" CTA.

Nothing in the original audit is stale. The build blocker, the privacy-default inconsistency, the partner RLS gap, the fake UI content, and the "Delete All Data" gap are all confirmed present, unchanged, in the current `develop` branch.

---

## Architecture Decisions Needed Before Implementation

1. **Which side of a partner relationship initiates, and how does the other side discover and accept it?** Today's schema/query direction implies "inviter becomes viewer," which may or may not match the intended product model (typically: the cycle-tracking owner should control what's shared, and the partner should be the passive viewer). This must be decided before writing any accept-flow UI or RLS.
2. **How should the server read the owner's raw data without granting the partner's own session direct RLS access to `users`/`cycle_data`?** Recommended direction is a `SECURITY DEFINER` Postgres function or a narrowly-scoped server-side privileged read used only inside `/api/partner/shared-data`, per §4 — this needs sign-off before any RLS or service-role change is made, and explicitly should **not** be "give the partner SELECT rights on the raw tables."
3. **What should "Delete All Data" actually do**, and does it need to satisfy a specific data-retention/GDPR expectation (full account+data erasure) or a narrower "clear my local app state" scope? The current copy overpromises either way.

---

## Terminal Summary

See below.
