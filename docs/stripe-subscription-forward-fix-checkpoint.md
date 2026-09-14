# Stripe subscription-sync forward fix — final checkpoint

Branch: `fix/stripe-subscription-sync`
Last commit: `68042f98d501fb1e3bf3bc13debf28ea38c05384`
Status: **NOT APPLIED live.** No DDL executed, no merge, no force-push.
Full detailed writeup and post-apply verification plan:
`docs/stripe-subscription-migration-review.md` ("Round 3 — Forward Fix",
"Round 3 — correctness re-review" for the UPDATE below, and "Round 4 —
same-day correctness re-review #2" for the UPDATE 2 below that).

---

## UPDATE 2 — same-day correctness re-review #2 (uncommitted, supersedes parts of UPDATE below)

A second same-day re-review found the UPDATE below's own fix still had two
gaps, both amended IN PLACE (not layered on top) in the same not-yet-applied
migration file and `route.ts`:

1. **Fencing keyed the wrong entity** — UPDATE's `subscription_reconciliation_locks`
   fenced by `stripe_subscription_id`, but `public.subscriptions` is
   canonical per USER/CUSTOMER. A resubscribe (old subscription → new one,
   same customer) or a Lifetime-vs-recurring race produced two different,
   mutually-blind lock rows fencing the SAME shared canonical row. Fixed by
   re-keying the table to `stripe_customer_id`, and bringing the Lifetime
   checkout path (previously untouched, writing via a separate
   `upsertSubscription()`/`syncUserDisplayTier()` pair) into the SAME fence.
2. **No canonical-subscription-id rule** — even with a correct fence, a
   normal `customer.subscription.*` lifecycle event could still silently
   switch which subscription (or Lifetime billing state) is canonical.
   Fixed with a new `p_is_authoritative` parameter on
   `reconcile_subscription_if_owner`: only an authoritative
   purchase/checkout path may establish/replace canonical identity; an
   ordinary lifecycle event may only reconcile the subscription that is
   ALREADY canonical, enforced via its own `SELECT ... FOR UPDATE` inside
   the same atomic RPC — never merely a stale client-side check.
3. **Grace-period fix from UPDATE was still timestamp-trusting** —
   `hasConfirmedPastDueTransition()` proved an event changed status at
   SOME point, never that it was the transition behind the CURRENTLY
   retrieved `past_due` state; an out-of-order "confirmed" event could
   still backdate the window. Fixed by deleting that function and
   `pastDueTransitionConfirmed` entirely — grace is now unconditionally
   `now() + 7 days` on any fresh transition into `past_due`, never
   anchored to any event's own timestamp.

Full detail: review doc sections V–AA. `route.test.ts`: 28 cases (was 24).

**Validation re-run after this update:** `tsc` clean, `lint` clean (same 2
pre-existing unrelated warnings), **828/828 tests passed** (104 files),
`npm run build` succeeds.

**Files touched beyond UPDATE below** (same three files, still uncommitted):
`database/subscriptions-entitlement-forward-fix-migration.sql`,
`src/app/api/webhooks/stripe/route.ts`,
`src/app/api/webhooks/stripe/route.test.ts`.

---

## UPDATE — same-day correctness re-review (uncommitted on top of 68042f98) — fencing key and grace-anchor logic below superseded by UPDATE 2 above

A same-day re-review of this checkpoint's own forward fix found two further
races in `reconcileSubscriptionFromStripe()` (not in the migration's
schema/grants, which stand as sections A–Q describe). Both are implemented,
tested, and validated, but **not yet committed** as of this update:

1. **Stale reconciler overwrite** — a request that retrieved Stripe state
   and then stalled could resume after a different attempt for the same
   subscription (a reclaim of the same event, or a distinct event racing
   concurrently) already wrote newer state, and overwrite it. Fixed with a
   per-subscription fencing token: new table
   `subscription_reconciliation_locks` + new `SECURITY DEFINER` function
   `reconcile_subscription_if_owner` (migration section 4, appended to the
   same not-yet-applied file), plus `acquireReconciliationLock` /
   `writeSubscriptionIfOwner` in `route.ts`.
2. **Grace-period backdating** — a fresh `past_due` grace window was
   anchored to the *triggering event's* `created` time, but reconciliation
   always re-fetches Stripe's current state, so an old/unrelated delivery
   could backdate (shorten) the promised 7 days. Fixed with
   `hasConfirmedPastDueTransition()`: anchor to the event's `created` time
   only when its own payload proves it IS the transition (Stripe
   `previous_attributes.status` present), otherwise anchor to `now` (the
   safe, never-shorter fallback).

Full detail, algorithm, and the exact tests added: review doc sections R–U.

**Validation re-run after this update:** `tsc` clean, `lint` clean (same 2
pre-existing unrelated warnings), **824/824 tests passed** (104 files;
`route.test.ts` 24 cases, was 19), `npm run build` succeeds.

**Files touched beyond this checkpoint's own commit** (all still
uncommitted in the working tree):
`database/subscriptions-entitlement-forward-fix-migration.sql`,
`src/app/api/webhooks/stripe/route.ts`,
`src/app/api/webhooks/stripe/route.test.ts`.

Nothing below this point in the original checkpoint has been re-verified
against live schema state — section A's read-only schema snapshot is
unaffected by this update (no new DDL was applied, only proposed).

---

## A. Confirmed live starting schema

Re-verified read-only immediately before implementing, unchanged from the
prior checkpoint:

- **`public.subscriptions`** — 0 rows. All Round-1/Round-2-shared columns
  already present (`stripe_price_id` nullable, `billing_type` NOT NULL with
  no default, etc.). Constraint is `subscriptions_billing_type_identifiers_check`
  (Round-1's looser shape), not `subscriptions_billing_shape_check`. Grants/RLS
  already match the final target.
- **`public.stripe_webhook_events`** — 0 rows. Only 4 columns live:
  `event_id`, `event_type`, `event_created_at`, `processed_at` (NOT NULL
  DEFAULT now()). No `status`, `started_at`, or `claim_token`; no CHECK
  tying `processed_at` to status. `service_role` holds unrestricted `ALL
  PRIVILEGES` (Round-1's exact flagged under-narrowing bug).
- **`public.users`** — UPDATE already correctly narrowed live. INSERT was
  never touched by any prior migration: `authenticated` holds full-column
  INSERT, including `subscription_tier`. RLS INSERT/UPDATE policies
  restrict row ownership only, never columns.

No stop-and-report was needed — live state matched the prior checkpoint
exactly; nothing had drifted.

## B. Why Round 2's committed migration file cannot be applied directly

It targets a pristine pre-migration schema — `CREATE TABLE
public.stripe_webhook_events` (already exists) and `ALTER TABLE
public.subscriptions ADD COLUMN ...` (already added by the live Round-1
apply). Running it now errors immediately on the first conflicting
statement.

## C. Forward-fix migration

New file: `database/subscriptions-entitlement-forward-fix-migration.sql`.
Three parts, each valid against the *actual* live schema in A:

1. Swap `subscriptions_billing_type_identifiers_check` for the stricter
   `subscriptions_billing_shape_check`; set `stripe_price_id NOT NULL`.
2. Evolve `stripe_webhook_events` in place — add `status`, `started_at`,
   `claim_token uuid not null`; drop `processed_at`'s NOT NULL/default; add
   the `processed_at ⇔ status='processed'` CHECK; add the status index;
   re-narrow `service_role`'s grant via an explicit `REVOKE ALL` first.
3. `REVOKE INSERT ... GRANT INSERT (id, email, name, created_at,
   privacy_settings, tracking_enabled)` on `public.users` for
   `authenticated` — `subscription_tier` excluded.

## D. Final `subscriptions` constraints/nullability

- `subscriptions_billing_shape_check`: exactly two legal shapes —
  `lifetime` (`plan='lifetime'`, `stripe_subscription_id IS NULL`) or
  `recurring` (`plan IN ('premium','vip')`, `stripe_subscription_id IS NOT NULL`).
- `stripe_price_id`: `NOT NULL` (was nullable).
- Everything else unchanged — already correct live.

## E. Final `stripe_webhook_events` schema

```
event_id           text primary key
event_type         text not null
event_created_at   timestamptz not null
status             text not null default 'processing' check (status in ('processing','processed','failed'))
started_at         timestamptz not null default now()
claim_token        uuid not null                 -- new in this round
processed_at       timestamptz null              -- was NOT NULL DEFAULT now()
constraint stripe_webhook_events_processed_at_matches_status
  check ((status = 'processed') = (processed_at is not null))
```

Grants after the fix: `service_role` → `SELECT, INSERT, UPDATE` only (no
DELETE), via an explicit `REVOKE ALL` first. `anon`/`authenticated` → none.

## F. Claim-token ownership algorithm

`claimEvent` returns `{ outcome: 'duplicate' }` or `{ outcome: 'claimed',
claimToken }` — every fresh claim and every reclaim (from `'failed'` or a
stale `'processing'` row) mints a brand-new `claimToken` via
`randomUUID()`. `markProcessed(eventId, claimToken)` and
`markFailed(eventId, claimToken)` finalize with `UPDATE ... WHERE event_id
= ? AND claim_token = ?` — a stale claimant's token no longer matches once
a reclaim has replaced it, so the CAS affects 0 rows. Both finalize
functions return `'finalized' | 'lost_ownership'` explicitly; the POST
handler branches on this and, on `'lost_ownership'`, logs a distinct
warning and responds success without forcing an extra Stripe retry — the
mutation already performed is safe to have run, and the reclaiming
attempt's own response is what should drive any further retry.

Implemented in `src/app/api/webhooks/stripe/route.ts`
(`claimEvent`/`tryReclaim`/`markProcessed`/`markFailed`).

## G. Final webhook ordering/reconciliation algorithm

Deleted the `>=`-based `isStaleEvent()` heuristic entirely, rather than
patching it to `>` — a `>` fix still doesn't produce a total order across
events sharing a timestamp. `reconcileSubscriptionFromStripe()` is now the
single source of every subscription-lifecycle write: for
`customer.subscription.created/updated/deleted` **and** for
`checkout.session.completed`'s subscription-mode branch, it calls
`stripe.subscriptions.retrieve(subscriptionId)` and writes *that* object's
state — never the triggering event's own embedded payload. A delivery that
is old, retried, or ties another event's timestamp still converges to the
same current Stripe truth a "new" delivery would, so it can never regress
canonical state, with no ordering heuristic needed. Canceled subscriptions
remain retrievable from Stripe indefinitely, so `customer.subscription.deleted`
uses this same path rather than a separate handler.

## H. Checkout responsibility after the fix

`checkout.session.completed` (subscription mode) now only establishes the
customer↔user↔checkout-session linkage (and creates the row for a
brand-new customer); it delegates to the same `reconcileSubscriptionFromStripe()`
lifecycle events use. It no longer authoritatively writes
status/current_period_end/cancel_at_period_end/grace state itself. Lifetime
(payment mode) is unchanged — there is no ongoing Stripe subscription
object to reconcile against, so checkout remains the sole source of truth
there.

## I. `public.users` INSERT/UPDATE grants matrix (final)

| | INSERT | UPDATE |
|---|---|---|
| `authenticated` | `id, email, name, created_at, privacy_settings, tracking_enabled` | `name, email, privacy_settings, onboarding_completed_at, tracking_enabled` |
| `subscription_tier` | **excluded** (new in this round) | excluded (Round 1) |
| `anon` | none | none |
| `service_role` | unchanged (ALL) | unchanged (ALL) |

## J. Proof `subscription_tier` is structurally non-writable by authenticated users

- **INSERT:** the forward-fix migration's `REVOKE INSERT ... GRANT INSERT
  (6 named columns)` excludes it.
- **UPDATE:** already excluded live since the Round-1 apply.
- **App-level, belt-and-suspenders:** `createUserProfile()`'s payload
  (`toProfileInsertPayload` in `src/services/auth/index.ts`) explicitly
  omits `subscription_tier`. `UserProfileInsert` (`src/types/auth.ts`) is
  `Omit<UserRecord, "subscription_tier">` — a distinct type from the
  read-model `UserRecord`. Covered by
  `src/services/auth/profileSchemaContract.test.ts`'s new contract block
  and a strengthened assertion in `src/services/auth/index.test.ts`.

## K. Test files/cases added

- `src/app/api/webhooks/stripe/route.test.ts` — 19 cases (was 14): every
  subscription-lifecycle test now mocks `stripe.subscriptions.retrieve` as
  the source of truth; the two old staleness-skip tests were replaced with
  "OLDER EVENT AFTER NEWER STATE", "EQUAL-SECOND DISTINCT EVENTS", and
  "CHECKOUT CANNOT REGRESS"; added "CURRENT OWNER CAN MARK
  PROCESSED/FAILED" and "STALE OWNER CANNOT MARK PROCESSED/FAILED AFTER
  RECLAIM".
- `src/services/auth/profileSchemaContract.test.ts` — +1 case
  (`UserProfileInsert schema contract`).
- `src/services/auth/index.test.ts` — same 15 cases, 2 strengthened
  (existing profile not overwritten; insert payload omits
  `subscription_tier`).

**Net: 104 test files (unchanged), 819 cases (was 813, +6).**

## L. Full validation results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean |
| `npm run lint` | Clean — same 2 pre-existing, unrelated warnings (`layout.tsx` custom-font, `Avatar.tsx` `<img>`) |
| `npm test` | **819/819 passed**, 104 files, 0 failed, 0 skipped |
| `npm run build` | Succeeds |

## M. Files changed

- `database/subscriptions-entitlement-forward-fix-migration.sql` (new)
- `src/app/api/webhooks/stripe/route.ts` (claim-token ownership,
  Stripe-truth reconciliation, narrowed checkout responsibility)
- `src/app/api/webhooks/stripe/route.test.ts` (rewritten per K)
- `src/types/auth.ts` (`UserProfileInsert` type)
- `src/services/auth/index.ts` (`toProfileInsertPayload`, narrowed
  `createUserProfile` payload)
- `src/services/auth/index.test.ts` (strengthened per K)
- `src/services/auth/profileSchemaContract.test.ts` (new contract per K)
- `docs/stripe-subscription-migration-review.md` (Round 3 section appended)

`database/subscriptions-entitlement-migration.sql` (Round 2's file) and
every prior section of the review doc are untouched.

## N. Commit SHA

`68042f98d501fb1e3bf3bc13debf28ea38c05384`, pushed to
`origin/fix/stripe-subscription-sync`. Not merged.

## O. git status + untouched stash list

Working tree clean except the same untracked, machine-local
`.claude/`/`.mcp.json`/`.ignore` noted since Round 2. Two pre-existing
stashes:

- `stash@{0}` — "wip: stripe subscription sync implementation"
- `stash@{1}` — unrelated `develop` WIP

Neither popped, applied, or dropped — left exactly as found.

## P. Remaining known issues

- The account-delete `partner_id` unlink bug (Round 1) — confirmed still
  present, deliberately **not** fixed here. Needs a service-role client or
  a `SECURITY DEFINER` RPC, and a check on whether `partner_id` is even
  still load-bearing now that `partner_links` is canonical.
- No automated test runs the forward-fix SQL against a real/ephemeral
  Postgres — consistent with every other migration in `database/`, not a
  new gap.

## Q. PROPOSED LIVE CHANGE — forward-fix migration

Migration SQL: section C above (full file in
`database/subscriptions-entitlement-forward-fix-migration.sql`).

**This migration has NOT been applied.** Post-apply verification plan:

1. **Schema:** `subscriptions_billing_shape_check` exists,
   `subscriptions_billing_type_identifiers_check` does not;
   `stripe_price_id` is `NOT NULL`; `stripe_webhook_events` has
   `status`/`started_at`/`claim_token`/nullable `processed_at` plus the
   matching-status CHECK and the `status` index.
2. **Grants:** `stripe_webhook_events` → `service_role` exactly
   `SELECT,INSERT,UPDATE` (no DELETE, no leftover `ALL`);
   `anon`/`authenticated` → nothing. `users` → `authenticated` INSERT
   limited to the 6 named columns, `subscription_tier` absent from both
   INSERT and UPDATE.
3. **Policies:** unchanged — owner-only SELECT on `subscriptions`; no
   policies on `stripe_webhook_events`.
4. **Attack — INSERT:** as an authenticated (non-service-role) client,
   attempt `INSERT INTO users (id, email, name, subscription_tier, ...)
   VALUES (auth.uid(), ..., 'lifetime', ...)` → expect a column-privilege
   error naming `subscription_tier`.
5. **Attack — UPDATE:** attempt `UPDATE users SET subscription_tier =
   'lifetime' WHERE id = auth.uid()` → expect the same class of error.
6. **Normal profile creation:** sign up a new account → `public.users` row
   appears with `subscription_tier = 'free'` from the column default.
7. **Subscription owner SELECT:** as the owning authenticated user,
   `SELECT * FROM subscriptions WHERE user_id = auth.uid()` succeeds.
8. **Cross-user subscription SELECT:** the same query against someone
   else's row returns zero rows (RLS).
9. **Webhook claim/process/finalize:** send a test
   `checkout.session.completed` and `customer.subscription.updated`
   through the real webhook endpoint → `stripe_webhook_events` gets a row
   with `status='processed'`, `claim_token` set, `processed_at` set;
   `subscriptions` reflects Stripe's actual current state.
10. **Vault FREE denied / Premium allowed:** as a FREE account, any Vault
    route returns 403; after upgrade, the same route succeeds.

---

## FINAL CHECKPOINT (superseded twice — see UPDATE 2, then UPDATE, above)

```
CURRENT BRANCH:            fix/stripe-subscription-sync
HEAD:                      68042f98d501fb1e3bf3bc13debf28ea38c05384 (+ uncommitted changes, see UPDATE 2)
WORKING TREE CLEAN:        NO — same 3 files modified beyond this commit (see UPDATE 2): migration
                           section 4 (now customer-keyed fence + canonical-identity rule), route.ts
                           (customer-level fencing + isAuthoritative + simplified grace rule),
                           route.test.ts (28 cases, was 19 at this commit).
                           Untracked machine-local files unchanged; stashes untouched.
STRIPE CODE COMPLETE:      YES, including both re-review passes (customer-level reconciliation
                           fencing, canonical-subscription-id rule, now-anchored grace period) —
                           landed and tested, not yet committed
MIGRATION APPLIED LIVE:    NO
MIGRATION READY TO APPLY:  YES, pending reviewer sign-off — current file includes the amended
                           section 4 (subscription_reconciliation_locks keyed by stripe_customer_id
                           + reconcile_subscription_if_owner with the canonical-identity check),
                           not yet committed
TESTS GREEN:               YES (828/828, tsc/lint/build clean — re-run after UPDATE 2)
SAFE TO MERGE:             Reviewer's call — code/tests/migration are ready; nothing committed,
                           applied, or merged by this pass

NEXT EXACT ACTION:
Decide whether to commit the uncommitted changes (this session made no commits — see UPDATE 2 and
review doc sections V–AA), then get reviewer sign-off on the forward-fix migration (now including
the amended section 4), then apply it live and run the section Q verification plan, before merging
this branch.
```

Not performed as part of this pass — no live DDL executed, no merge, no
force-push.
