# Vault V1

A private, intimate-content space between connected partners. A "Spark" is
a private, owner-authored piece of content that can optionally be teased,
mutually revealed through an explicit two-sided ceremony, and reflected on
afterward. Built from the approved Figma design (Section "Vault V1 —
Approved Implementation", 22 canonical desktop frames; no mobile frames
were in scope for V1).

## Non-negotiable privacy rules

These are enforced structurally (by what a query or RPC can even return),
not just by convention:

- A Spark's `content` is owner-only at every status. No RLS policy or RPC
  returns it to anyone but the owner, except `get_revealed_vault_spark()`
  once `revealed_at` is set and the relationship is still active.
- Tease text is a separate, explicitly-authored field — never derived from
  or exposing `content`.
- A partner reading their view of another user's Vault goes through RPCs
  only (`get_partner_vault_summary()`, mirroring `shared_replies`' zero
  direct-policy pattern). There is no direct SELECT policy that could
  accidentally expose `content` to a partner, regardless of Spark status.
  `get_partner_vault_summary()`'s column list structurally never includes
  `content` — the leak is impossible by construction, not convention.
- Curiosity, a mutual match, a past reaction, or a deck-answer overlap are
  never treated as consent for anything beyond viewing that one
  already-revealed Spark. Reveal always requires the explicit two-sided
  ceremony (see below) or the owner's explicit "Share Directly" action.
- `get_deck_prompt_matches()` (the "For Tonight" feature) can only ever
  return the caller's OWN spark id plus deck metadata — never the
  partner's content, interest level, or spark id — so a blind match
  between two independent deck answers can be surfaced without leaking
  either side's private answer before either party acts on it.

## Domain model

```
PRIVATE (created via /vault/new or a Desire Deck prompt)
  → owner reviews, clicks "Maybe this is for us →" → 3-way branch:
    (a) Keep Private → no-op, stays PRIVATE
    (b) Create a Tease → TEASED (separate tease_text, never derived from content)
    (c) Share Directly → REVEALED immediately (skips the ceremony entirely)

TEASED → partner responds: {curious, maybe_later, not_tonight, not_for_me}
  - only "curious" promotes status to WAITING
  - the other three leave status unchanged (re-promptable / archivable)

WAITING → owner reviews (tease vs. full Spark side by side)
  → owner clicks "Reveal Spark" → an explicit confirm view (still no RPC
    call) → owner clicks "Reveal" → mark_vault_spark_ready() → READY_TO_REVEAL

READY_TO_REVEAL → real-time ceremony: either party calls
  mark_vault_spark_ready() to set their own ready timestamp; once BOTH are
  set, either party calls reveal_vault_spark_together() → REVEALED.
  This mirrors relationship_sessions' mark_session_ready/
  reveal_session_together exactly (see relationship-experience-v1-migration.sql)
  rather than inventing a new reveal mechanic.

REVEALED (persistent) → 5-way reaction {love_this, curious, lets_talk_first,
  not_tonight, not_for_me} — a DIFFERENT vocabulary from the tease-response
  4-way set. "Talk about this →" opens a focused conversation.

AFTERGLOW (optional) → private 4-way emoji reaction {loved_it, liked_it,
  not_sure, not_for_me} + free text, entirely private per author. When both
  participants react positively, the UI treats it as mutual and offers a
  path into the existing Connect Hub.

ARCHIVED ← reachable from PRIVATE ("Archive Spark") or from a declined
  tease ("Archive for Later"). Plain owner-scoped UPDATE, no RPC needed.
```

Desire Decks are **not** a separate entity: a deck-originated Spark is a
`vault_sparks` row with `deck_id`/`deck_prompt_id`/`deck_interest_level`
set, flowing through the exact same pipeline as any other Spark. "Give &
Receive" is the same pipeline with `deck_prompt_id` set to `"give"` or
`"receive"`. "For Tonight" surfaces a match between two independently
positive deck answers (see `get_deck_prompt_matches()` above).

Four distinct rating vocabularies exist and are kept as separate enums,
never conflated: tease-response (4), post-reveal reaction (5), deck
self-rating (4), Afterglow reaction (4).

## Architecture

Built in the order: domain types → migration/RLS/RPCs → service/API →
shared visual primitives → screens, per this project's standing
architecture discipline.

- **Domain types**: `src/types/vault.ts`
- **Database**: `database/vault-v1-migration.sql` — `vault_sparks` and
  `vault_afterglow_reflections` tables (RLS: owner/author-only direct
  access, no partner-facing SELECT policy exists on either table), plus
  `SECURITY DEFINER` RPCs for every cross-party transition
  (`create_vault_tease`, `share_vault_spark_directly`,
  `respond_to_vault_tease`, `mark_vault_spark_ready`,
  `reveal_vault_spark_together`, `react_to_revealed_vault_spark`,
  `get_revealed_vault_spark`, `get_partner_vault_summary`,
  `get_vault_afterglow_reflections`, `get_deck_prompt_matches`), each with
  the standard `REVOKE ALL FROM PUBLIC, anon` / `GRANT TO authenticated`
  hardening used throughout this codebase. Also extends the existing
  `_has_reply_source_access()` function (from
  `relationship-experience-v1-migration.sql`) with a new `'vault_spark'`
  branch, reusing the existing `shared_replies` source-scoped reply system
  for Vault's focused conversation rather than building parallel
  messaging infrastructure. **Nothing in this migration has been applied
  to a live database yet.**
- **API**: `src/app/api/vault/**` — one route per action, following this
  codebase's `authenticateRequest` → Zod-parse → Supabase/RPC call →
  sanitized-error-response pattern. `src/app/api/vault/_lib/rpc-error.ts`
  centralizes the RPC error-message → HTTP status mapping shared across
  every RPC-calling route.
- **Client**: `src/services/vault/data.ts` (fetch layer),
  `src/hooks/useVaultHome.ts` / `useVaultSpark.ts`,
  `src/components/vault/primitives.tsx` (shared visual primitives —
  `VaultRoom`, `VaultHeader`, `VaultCard`, `VaultPill`, `VaultButton`,
  `HeatBadge`), `src/styles/vault-tokens.css` (the `.vault-theme` scoped
  dark palette).
- **Screens**: `src/app/(app)/vault/**`.

### Why Vault has its own color tokens

The approved Figma design uses a fixed, dark, moody palette with zero
Figma variables (all raw hex) and no light-mode Vault frames at all.
Rather than force those exact values onto the app-wide `--bg`/
`--accent-*` tokens (shared by Home/Cycle/Coach/Connect and toggled by the
light/dark theme), Vault gets its own scoped token set
(`.vault-theme` in `src/styles/vault-tokens.css`), applied only to each
Vault page's content area. Vault is a deliberately dark-only "mood",
independent of the user's light/dark preference — the same shared
Button/Card/Modal/StatusPill *component shapes* are reused throughout
(via className overrides), just with a different skin.

### Why there's no Vault sidebar

The Figma mockups show a 260px left sidebar shell. The real app has no
sidebar anywhere — it was deliberately replaced with `TopNav` +
`MobileHeader` + `BottomTabBar` in a recent, unrelated pass (see
`src/app/(app)/layout.tsx`). Resurrecting a sidebar for Vault alone would
both fork the shared shell and reverse that recent architecture decision
outside this feature's scope. Vault pages render inside the existing
shell unchanged; only the content area gets the `.vault-theme` treatment.

## Capability gating

Vault is **not** tracked-only. It was initially wired into
`TRACKED_ONLY_HREFS`/`TRACKED_ONLY_ROUTE_PREFIXES` (nav visibility and the
`(app)/layout.tsx` route guard) alongside Cycle and Coach — this was
wrong and has been fixed. Vault has no dependency on cycle-tracking data,
and a partner-only account (`tracking_enabled = false`) is exactly who
needs to respond to teases, mark ready, and react to a revealed Spark.
`canUseVault` (which aliased `canUseTracking`) was removed from
`src/features/account/capabilities.ts` for the same reason.

## Premium entitlement — deliberately not gated in V1

Desire Decks show a "Premium" label for product-truth/branding purposes
(these are intended to be premium content), but **nothing in Vault
actually checks `subscription_tier`**. Investigation confirmed:

- No API route anywhere in the codebase branches on `subscription_tier`.
- The Stripe webhook (`src/app/api/webhooks/stripe/route.ts`) cannot
  currently write `subscription_tier` even on a real successful payment —
  it authenticates with the anon key (`persistSession: false`, no user
  session), so `auth.uid()` is null and `public.users`' owner-only RLS
  UPDATE policy silently rejects the write.
- Stripe itself is stub-configured (placeholder keys only); see
  `docs/ROADMAP.md`.

Per this build's explicit rule against protecting paid functionality with
only a client-side check, and against faking gates in general, Vault
ships fully accessible in V1 rather than behind a check that isn't real.
Adding a real Premium gate is future work that starts with making the
Stripe webhook able to write `subscription_tier` (a service-role client,
not the anon-key client it uses today).

## What's deferred / not done in this pass

- **Figma pixel-level visual reconciliation.** No browser-automation tool
  was available in this environment, so implementation followed the
  extracted structural/token-level design spec (exact hex values,
  spacing, typography, copy) rather than live screenshot diffing against
  each Figma frame. Server-side route compilation was verified for every
  screen; a real authenticated in-browser QA pass is still needed.
- **Mobile/tablet Vault layouts.** Per explicit instruction, only the
  approved desktop Section was in scope for V1; responsive behavior below
  desktop widths has not been specifically verified.
- **Real-time reveal ceremony.** `ready_to_reveal`/`waiting` states poll
  every 4 seconds rather than using a push/websocket subscription — there
  is no realtime infrastructure elsewhere in this app to build on.
- **"Between Us" / partner offer notifications.** The Figma copy for
  "Send gentle nudge" and similar notification-delivery claims was
  deliberately *not* implemented as worded, since no real notification
  infrastructure (push/email/in-app) exists in this app — this build does
  not claim a partner "has been notified" anywhere.
- **Connect Hub integration ("Save to More of Us").** Currently links to
  `/connect`; does not yet render inside a specific Connect Hub card, since
  that requires its own design/placement decision.
