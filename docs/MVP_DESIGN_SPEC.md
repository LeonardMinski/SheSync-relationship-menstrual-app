# SheSync+ MVP Design Specification

**Status:** Specification only. No production UI was modified to produce this document. Grounded in the actual current codebase (`src/styles/tokens.css`, `tailwind.config.js`, `src/components/ui/*`, `src/components/layout/*`) and in `docs/MVP_AUDIT.md` / `docs/MVP_AUDIT_VALIDATION.md`. No image references were attached to this conversation — "Intimate Wellness" and "Lover Girl" are treated as the two named mood directions described in the brief, not literal source files.

This spec designs **only** the MVP journey: sign up/log in → log cycle data → dashboard from real data → control partner privacy → invite/connect a partner → partner accepts → partner sees owner-approved data only → owner revokes. AI Coach, Fantasy, Intimacy, Pricing/Stripe, and Notifications are parked and must not shape MVP navigation, dashboard hierarchy, or settings.

---

## 1. Design Principles

1. **Unknown must look unknown.** Every value the app cannot yet derive (cycle day, partner status, sharing status) renders as an explicit "not available yet" state — never a plausible-looking placeholder. This is the single hardest rule in this spec and overrides every other visual preference.
2. **Private by default, visibly so.** The privacy screen's job is to make "nothing is shared unless you choose it" *feel* true, not just be technically true. Sage-toned "private/off" states should look calm and safe, not alarming.
3. **Calm data, warm chrome.** The app is not a magazine and not a clinic. Numbers, forms, and logs read like considered daily journaling; the shell around them (landing, auth, empty states, section headers) can afford a warmer, more editorial voice.
4. **One rose, used rarely.** The brand's punchy rose is a spotlight, not a wash. It marks the single primary action on a screen and a small number of active/selected states — never large surface fills, never more than one rose element competing for attention per screen.
5. **Same product, two widths.** Mobile is not a cut-down version of desktop; it is the same information hierarchy read top-to-bottom instead of arranged in columns. No feature exists on one breakpoint and not the other.
6. **Truthful under all conditions.** A screen must be designed for its empty, loading, and error states as first-class citizens, not afterthoughts bolted on once the happy path exists.

---

## 2. Final Design System

The existing token system in `src/styles/tokens.css` is closer to "Intimate Wellness" than a rebuild is warranted — linen backgrounds, sage-adjacent naming, generous radii, and soft dual-layer shadows are already present. Two deliberate changes are needed, both flagged explicitly so they aren't lost in implementation:

- **The CTA role changes hands.** Today `--cta-start`/`--cta-end` *is* sage (`#b8d3bd` → `#8fa98f`). In this spec, **sage is reassigned to mean "private / secure / connected"** (a semantic/status color), and a **new rose token pair becomes the primary CTA**. This is a token *remapping*, not just a new addition — every current `.btn-cta` sage button becomes rose; every current "connected"/"shared" pill that borrowed CTA-sage keeps sage, now under its correct semantic name.
- **A serif display face is added** (Playfair Display) for a small, deliberately-limited set of editorial moments. Inter remains the only face for anything resembling data, forms, or UI chrome.

Everything else — spacing scale, radius scale, shadow pairing, light/dark structure — is retained as-is.

---

## 3. Colour Roles

| Role | Token (proposed) | Light value (indicative) | Dark value (indicative) | Used for |
|---|---|---|---|---|
| Page background | `--bg` | `#f8f6f3` (existing, unchanged) | `#101411` (existing) | App background, linen ground |
| Surface | `--bg-surface` | `#ffffff` (existing) | `#1a211c` (existing) | Cards, sheets, dialogs |
| Elevated surface | `--bg-elevated` | `#f1efec` (existing) | `#202821` (existing) | Nested panels, input fills |
| **Primary CTA (new)** | `--cta-rose-start` / `--cta-rose-end` | `#e0637e` → `#c23f5e` | `#eb7f96` → `#d1546e` | The single primary action per screen: "Save," "Log Today," "Send Invitation," "Continue," "Accept" |
| CTA foreground | `--cta-rose-foreground` | `#ffffff` | `#241014` | Text/icon on top of rose fill — verify ≥4.5:1 at implementation, adjust rose lightness if a chosen shade fails |
| **Trust / private / connected (repurposed)** | `--accent-sage` | `#4b604f` (existing, kept) / soft fill `#b8d3bd` | `#93ad95` (existing) | "Private," "Nothing shared," "Connected," "Active" pills; the privacy master toggle's "on/safe" state; success confirmations tied to privacy actions specifically |
| Secondary accent | `--accent-peach` | `#e5ad95` (existing) | `#efa88e` (existing) | Small decorative brand moments only — icon backgrounds, illustration accents. Never a CTA, never a status color. |
| Tertiary accent | `--accent-lilac`, `--accent-blue` | existing values | existing values | Rare, optional — dashboard section dividers or illustration only |
| Success (non-privacy) | `--success` | `#5cbf85` (existing) | `#6bd88f` (existing) | Generic save-succeeded toasts not tied to sharing/privacy semantics |
| Warning | `--warning` | `#d8a548` (existing) | `#f0bd54` (existing) | Pending states (invitation sent, awaiting acceptance) |
| Error / destructive | `--error` | `#c84654` (existing) | `#ff6f7d` (existing) | Validation errors, destructive-action confirmations, revoke/delete |
| Info / neutral | `--info` | `#7c91b6` (existing) | `#86a6d8` (existing) | Loading/informational banners |
| Text — foreground / muted / help | unchanged | `#171917` / `#61685f` / `#7d847c` | unchanged | Body, secondary, tertiary text |
| Border / border-subtle | unchanged | `#ddd9d2` / `#ebe7e0` | unchanged | Card outlines, dividers |

**Rule of one rose:** on any given screen, rose appears on exactly one primary action and, where relevant, the active/selected state of one control group (e.g., the selected date pill in the cycle calendar, a selected mood value). It never fills a whole card, header bar, or nav rail. Sage never competes with rose for "primary action" — sage is reserved for status communication, not calls to action.

**Contrast obligation:** every rose/sage/peach value above is *indicative*. Before implementation, each color-on-color pairing actually used (rose-on-white, white-on-rose, sage-text-on-sage-fill, etc.) must be checked against WCAG AA (4.5:1 for normal text, 3:1 for large text/UI components) and adjusted in lightness — do not ship the indicative hex values unchecked.

---

## 4. Typography

| Role | Face | Used for | Not used for |
|---|---|---|---|
| Editorial display | **Playfair Display** (new) | Landing hero headline; auth screen headlines ("Welcome back," "Create your account," "Check your email"); large empty-state headlines ("No partner connected yet"); the dashboard's date/greeting line only | Any number, any form label, any button, any table/list content, any dense settings row |
| Body / UI / data | **Inter** (existing, unchanged) | All body copy, all form inputs/labels, all buttons, all navigation, all data values (mood scores, dates, status pills), all card titles inside the authenticated shell | — |

Type scale keeps the existing token steps (`--font-size-xs` … `--font-size-4xl`); Playfair is applied at the `2xl`–`4xl` steps only, always at a heavier weight (600–700) with slightly tighter tracking, and always paired with an Inter subhead/body directly beneath it. Playfair is decorative framing, not a competing information channel — a screen reader and a low-vision user should lose nothing if Playfair silently fell back to a system serif.

---

## 5. Spacing / Layout

- Desktop content max-width: **1200–1280px**, centered, with a persistent left sidebar (see §7) outside that measure.
- Mobile horizontal margin: **20–24px**.
- Card padding: **24–32px** (24px on mobile-width cards, 32px on desktop-width cards where content warrants it).
- Radius: **16px minimum** on cards/dialogs (existing `--radius-xl`/`--radius-2xl` tokens already satisfy this — 16px/24px).
- Interactive targets: **44px minimum** height/width (already the case for `.btn-cta`, `.btn-secondary`, `.input` in the current CSS — preserve this floor for every new control, including toggle hit areas and icon-only buttons).
- Vertical rhythm between primary sections on a page: one full spacing step larger than between elements *within* a section (e.g., 32–40px between dashboard cards, 12–16px between a card's internal rows).
- Section-to-section spacing should visibly group "today" content separately from "history" content separately from "sharing" content — whitespace does the grouping work; avoid heavy dividing rules.

---

## 6. Components

### 6.1 Existing components — reused as-is (behaviorally correct, only token values change)
- `Button` (`src/components/ui/Button.tsx`) — variants stay `cta`/`secondary`/`outline`/`ghost`; only the `cta` variant's underlying CSS class (`.btn-cta`) is repainted from sage to rose.
- `Card` + `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter` (`src/components/ui/Card.tsx`) — layout primitive is sound; no structural change needed.
- `Input` / `Textarea` (`src/components/ui/Input.tsx`) — label/error/helper wiring already correct and accessible; reuse untouched.
- `LoadingSpinner` (`src/components/ui/LoadingSpinner.tsx`) — reuse, but repaint its hardcoded `rose-200`/`rose-500` Tailwind classes to the token-based rose/sage per §3 so it isn't a fourth, uncoordinated spinner implementation (see Performance/Design-System audit findings).
- `ComingLater` (`src/components/ui/ComingLater.tsx`) — reuse as-is for all parked routes (AI coach, coach, fantasy, intimacy, partner/intimacy, pricing). Already correctly built.

### 6.2 Existing components — need modification
- `Toggle` (`src/components/ui/Toggle.tsx`) — behaviorally correct; its "on" fill needs to move from whatever currently renders (verify against `.toggle-slider` CSS) to the **sage** trust color specifically when used for privacy/sharing settings (a generic on/off toggle used elsewhere, if any, does not need to carry sage semantics — only privacy-context toggles do).
- `AppSidebar` / `TopNavbar` (`src/components/layout/*`) — structurally reusable, but the hardcoded "Sarah J." / "Premium Secure" identity block and the dead notification bell must be replaced with real-or-honestly-absent content (see §7, §16).
- `navItems.ts` — data-only change: parked entries (`coach`, `ai-coach`, `fantasy`, `intimacy`, `partner/intimacy`, `pricing`, and the non-functional `dashboard#insights`) move out of the *primary* nav array into a clearly separate "later" list not rendered in the main mobile tab bar (see §7).
- `PartnerCard` (dashboard) and `ManagePartnerCard` (settings) — not reusable in their current form; their fabricated content must be replaced per §14/§15's real-state designs. Treat as full rebuilds using the existing `Card`/`Button` primitives, not incremental edits.
- `DeleteDataDialog` — reusable shell (overlay, card, two-button footer), but copy and confirm-flow must change per §17.

### 6.3 New components needed
- `StatusPill` — generalized from the ad-hoc one inside the current `PartnerCard.tsx` into a shared primitive with explicit `tone: "sage" | "muted" | "warning" | "error"` — used across partner status, invitation status, and privacy summaries so there is one pill implementation, not several.
- `Modal` / `Dialog` primitive with real modal semantics (`role="dialog"`, `aria-modal="true"`, focus trap, `Escape`-to-close, focus return to trigger on close) — currently every overlay (cycle log, delete confirmation) is a plain `fixed inset-0` div. This is the single most-reused new primitive in this spec (cycle log dialog, delete/revoke confirmations, accept/decline invitation dialog).
- `EmptyState` — icon + Playfair headline + Inter body + optional single CTA, used for "no cycle data yet," "no partner connected yet," "no recent activity," etc. — consolidates several one-off empty-state markups into one component.
- `InlineBanner` — status/success/error banner with `role="status"`/`role="alert"` as appropriate, replacing the several slightly-different inline banner implementations already in the codebase (privacy form has one; cycle page has a different one).
- `SectionHeading` — the Playfair/Inter heading+subhead pairing used at the top of each major screen section, so the "editorial vs. UI" typographic rule (§4) is enforced by one component instead of ad hoc className combinations.
- `PartnerStatusCard` — the real, data-driven replacement for both `PartnerCard` and `ManagePartnerCard`, parameterized by connection state (see §14 state list) so dashboard and settings render the same honest states from one source instead of two independently-fabricated widgets.

---

## 7. Navigation

**Primary mobile tab bar (bottom, persistent on authenticated routes):** exactly four destinations, per the brief —

`Home` (`/dashboard`) · `Cycle` (`/cycle`) · `Partner` (`/partner`) · `Settings` (`/settings`)

Privacy lives **under** Settings (`/settings/privacy`), not in primary nav — consistent with the current route map. No parked route appears in this bar under any badge or "soon" treatment; if a user reaches a parked route directly (e.g. a stale bookmark), `ComingLater` handles it, but nothing invites them there from primary chrome.

**Desktop sidebar:** the same four destinations, in the same order, top-to-bottom, plus the sign-out control at the bottom. The sidebar's identity block at the bottom shows the **real** signed-in user's name (from `AuthContext`) and, if useful, nothing else fabricated — no subscription-tier label, since subscription tiers are not part of the MVP (see §12).

**Active state:** current route highlighted with a small sage-toned indicator (left border or filled icon background), not rose — rose is reserved for actions, and "which tab am I on" is a passive status, not a call to action.

**Where parked features go instead of primary nav:** nothing in the MVP surface needs to reference them at all. If a "More" or "Explore" affordance is wanted later for parked features, that is an explicit Phase 2/3 decision, not part of this spec — omit it entirely for V1 rather than inventing a placeholder entry point.

---

## 8. Landing (`/`)

- **Purpose:** convert an unauthenticated visitor into a signup, and let a returning user get to login quickly.
- **Primary user goal:** understand what the product is for in one screen and find the CTA.
- **Information hierarchy:** Playfair hero headline (product promise, privacy-forward language) → one-line Inter subhead → primary rose CTA ("Get started" → signup) → secondary outline/ghost CTA ("Log in"). Optionally, 2–3 short trust/value statements below the fold, in Inter, plain — no fabricated feature claims (no "AI-powered," no "end-to-end encrypted" unless that becomes true).
- **Controls:** two links only (signup, login). No SSO buttons here (see §9 on why they're excluded entirely for now).
- **States:** static; no loading/error state needed (no data fetching on this page).
- **Desktop composition:** centered column, max-width ~720px for the hero text, generous top/bottom whitespace, background is plain `--bg` linen (no imagery required).
- **Mobile composition:** identical structure, stacked, hero text scales down one step, CTA buttons full-width with 44px+ height.
- **Data required:** none.
- **Existing components reusable:** `Button` (cta + outline variants).
- **New components:** `SectionHeading` for the Playfair hero treatment.
- **Must NOT implement:** any subscription-tier comparison, any testimonial/social-proof block referencing unverified claims, the current README-style feature list (AI predictions, fantasy vault, intimacy deck) — none of that is MVP-true.

---

## 9. Authentication

Covers Login, Signup, Verify Email, Auth Callback Success, Auth Callback Failure.

### 9.1 Login
- **Purpose/goal:** return an existing user to their dashboard.
- **Hierarchy:** Playfair headline ("Welcome back") → email/password fields → primary rose "Log in" CTA → secondary links (forgot password, "Don't have an account? Sign up").
- **Controls:** email `Input`, password `Input` (with visibility toggle), "Remember me" checkbox, submit button.
- **States:** default, field-level validation error (inline, tied to the specific field via `aria-describedby`), submit-in-progress (button `loading` state, disabled), auth failure (single inline banner — do not distinguish "wrong password" from "unknown email" in the copy, matching the existing enumeration-safe backend behavior), already-authenticated redirect (no visible flash of the form).
- **Desktop:** centered card, max-width ~440px, on plain linen background.
- **Mobile:** full-bleed within the 20–24px margin, same vertical order.
- **Data required:** none until submit; submits to existing auth service.
- **Reusable:** `Input`, `Button`, `InlineBanner` (new).
- **Must NOT implement:** the Apple/Google SSO buttons as they exist today (styled, no handler). **Omit them entirely from V1** unless real OAuth is wired up first — a styled-but-dead button is exactly the kind of fake affordance this spec exists to eliminate. If/when real OAuth ships, it gets its own design pass with real provider branding guidelines, not a placeholder pair.

### 9.2 Signup
- **Purpose/goal:** create an account with minimal friction.
- **Hierarchy:** Playfair headline ("Create your account") → name/email/password/confirm-password fields → primary rose "Create account" CTA → link to login.
- **Controls/states:** same pattern as login — inline field errors (including the existing password-mismatch check), loading state, generic failure banner.
- **Desktop/mobile:** same card pattern as login.
- **Data required:** none until submit.
- **Reusable:** `Input`, `Button`, `InlineBanner`.
- **Must NOT implement:** SSO buttons (same reasoning as 9.1); any subscription-tier selection at signup (free/premium/etc. is not an MVP concern).

### 9.3 Verify Email
- **Purpose/goal:** tell the user to check their inbox and give them a real path forward if the email doesn't arrive.
- **Hierarchy:** Playfair headline ("Check your email") → Inter body explaining what was sent and to which address → primary rose "Resend email" CTA (must call a real resend action — see implementation note) → secondary "Back to login" link.
- **Controls:** one button (resend), one link.
- **States:** default; resend-in-progress (loading); resend-succeeded (brief inline confirmation, e.g. "Email sent again"); resend-failed (inline error); rate-limited (if the backend enforces a cooldown, show it explicitly — "You can resend in 47s" rather than letting the user hit a silent failure).
- **Desktop/mobile:** same centered-card pattern.
- **Data required:** the email address the user just signed up with (from signup response/session), and a real resend endpoint.
- **Must NOT implement:** the current dead `/auth/resend-verification` link — either build the real resend action behind the existing button, or don't show a resend affordance at all until it's real. **Also fix, independent of any redesign:** the current white-on-light-background heading contrast bug on this screen must not be reproduced in the new design — verify the headline color against whatever surface it sits on.

### 9.4 Auth Callback — Success
- **Purpose/goal:** confirm, truthfully, that the email link worked and the user now has a session.
- **Hierarchy:** Playfair headline ("You're confirmed") → Inter body → primary rose CTA ("Continue to dashboard" if a session now exists, or "Continue to login" if it doesn't).
- **Controls:** one primary CTA, routed based on **actual verified session state at render time**, not shown unconditionally.
- **States:** this screen's entire reason for existing is to only show up when confirmation is genuinely known to have succeeded — see 9.5 for the failure twin.
- **Data required:** the callback page must actually resolve the confirmation (read the URL's code/token, exchange it for a session, or check the resulting session state) before choosing which of 9.4/9.5 to render. **This is a functional fix, not a visual one — flagged as an implementation dependency, not solved by design alone.**
- **Reusable:** same centered-card pattern as other auth screens.
- **Must NOT implement:** the current "Email Confirmed!" message shown unconditionally regardless of whether the link was valid.

### 9.5 Auth Callback — Failure
- **Purpose/goal:** tell the user plainly that the confirmation link didn't work and give them a way to recover.
- **Hierarchy:** Playfair or plain Inter headline ("That link didn't work") — deliberately less celebratory than the success screen, no checkmark iconography — → Inter body explaining likely causes (expired, already used) → primary rose CTA ("Send a new link" → back to a working resend flow) → secondary "Back to login."
- **Controls:** one primary CTA, one secondary link.
- **States:** default only; this *is* the error state for the callback flow.
- **Data required:** same callback resolution as 9.4 — this renders when that resolution fails or the code is missing/invalid.
- **Must NOT implement:** silently redirecting to login with no explanation, or showing the success screen by default when confirmation status is actually unknown.

---

## 10. Dashboard (`/dashboard`)

- **Purpose:** answer, at a glance and using only real data: where am I in my cycle (if known), what did I log today, what should I do next, is anything shared, is a partner connected.
- **Primary user goal:** either confirm today is logged, or get to logging it in one tap.
- **Information hierarchy (top to bottom, matches the brief exactly):**
  1. Today's cycle summary (phase if known, otherwise an honest "not enough data yet" state — never a fabricated phase or day number)
  2. Today's check-in/log status ("Logged for today" with a summary chip row, or "Not logged yet" with the primary CTA)
  3. Recent data/history (last 3–5 entries, compact list, links to full history on `/cycle`)
  4. Privacy/partner summary (one honest line: connected/not connected, and — only if connected and something is actually shared — a short list of what's shared; see §14/§15 for exact states)
  5. Primary CTA to log/update today (rose, appears once, pinned near the top since it's the main action, *not* buried at the bottom)
- **Controls:** one primary CTA (log/update today's entry, routes to `/cycle`); a "Manage sharing" secondary link inside the privacy/partner summary card, routing to `/settings/privacy` or `/partner` as appropriate.
- **States:** loading (skeleton cards, not a full-page spinner, so the nav/shell stays visible); empty (brand-new user — every section shows its own honest empty copy, not one interstitial blocking the whole page); error (inline banner scoped to whichever section failed to load, not a full-page error unless auth itself failed); populated (real data in every section).
- **Desktop composition:** two-column layout inside the 1200–1280px measure — a wider left column for today's summary + history, a narrower right column (or a right-aligned card) for the privacy/partner summary — so the "is anything shared" question is always visible without scrolling.
- **Mobile composition:** single column, same vertical order as the hierarchy above (today → log status → history → privacy/partner → nothing below it needs repeating since the CTA is already pinned near the top).
- **Data required:** most recent cycle entries (for today + history), computed phase/day *only if legitimately derivable* (see note below), and the real partner/privacy summary from the actual privacy settings + partner link state — not the current hardcoded widget.
- **Existing components reusable:** `Card` family, `Button`.
- **New components:** `PartnerStatusCard` (the honest dashboard widget replacing `PartnerCard`), `EmptyState`, `SectionHeading`.
- **Things from the current app that must NOT be implemented:**
  - The hardcoded "Alexandria Montgomery-Santos" / "Shared: Cycle phase, mood logs" widget — replaced entirely by `PartnerStatusCard` driven by real data (see §14 for its exact states, including "no partner connected yet").
  - A fabricated "Cycle Day 14"-style number. If a legitimate cycle-day calculation does not exist yet (it doesn't, per the audit), the summary shows **"Not enough data yet"** or omits the day number entirely rather than hiding the absence behind a dash or a guess.
  - Any AI Coach, Fantasy, Intimacy, external health-news, or "recommendation" card in the primary hierarchy. If a teaser for a parked feature is ever wanted, it must be visually and spatially separated from the real dashboard content and explicitly labeled "Coming later" — not part of this spec's primary hierarchy.

---

## 11. Cycle (`/cycle`)

- **Purpose:** log or review a specific day's cycle data; see recent history.
- **Primary user goal:** log today (or edit an already-logged day) in as few steps as possible without feeling like a medical form.
- **Information hierarchy:** selected date (defaults to today, changeable) → existing entry for that date if any (mood/energy/libido/stress/phase/symptoms/notes, period/flow if in MVP scope) → save/update CTA → recent entries list below.
- **Controls:** date selector, phase select, 1–10 sliders for mood/energy/libido/stress (each with a visible numeric value, not just a slider thumb position, for accessibility and clarity), multi-select symptom chips, free-text notes, primary rose "Save entry" / "Update entry" CTA (label changes based on whether today already has a log, matching current behavior).
- **States:** first log for this date (empty form, all fields at a neutral default *the user must explicitly confirm*, not silently submitted); existing log for this date (form pre-filled); saving (button loading state); save succeeded (a real, visible success confirmation — currently missing entirely, flagged as the audit's UI gap #5 — a brief `InlineBanner` or toast, not just a silently-closed dialog); validation error (inline, tied to the specific field — e.g., phase not selected); network/save error (inline banner, form stays populated so nothing is lost); loading (skeleton for the history list while fetching).
- **Desktop composition:** two-column — form on the left (or in a modal/dialog invoked from a compact "today" card, matching current UX), recent-entries list on the right, inside the 1200–1280px measure.
- **Mobile composition:** single column — compact "today" summary card with an "Add/Edit" CTA that opens the logging form as a full-height sheet (using the new `Modal`/`Dialog` primitive with real focus trapping), recent entries below as a simple list.
- **Avoid overwhelming the user:** group fields visually (Phase → Feelings [mood/energy/libido/stress] → Symptoms/notes) with clear section labels rather than one long undifferentiated form; sliders show their number so the user isn't guessing at a bare handle position.
- **Data required:** real `cycle_data` rows for the signed-in user (today + recent history); no fabricated defaults for any field.
- **Existing components reusable:** `Input`/`Textarea`, `Button`.
- **New components:** `Modal`/`Dialog` (replacing the current plain-div overlay), `InlineBanner` for save-success feedback.
- **Must NOT implement:** a slider that silently carries a "default" value (e.g., mood defaulting to 5) into a save the user never confirmed — every field the user hasn't touched on a first log should visibly read as "not set" until they interact with it, or the form should require explicit interaction before allowing submit.

---

## 12. Settings (`/settings`)

- **Purpose:** the one place for account-level controls.
- **Primary user goal:** find privacy/partner controls, appearance, and account/data management without hunting.
- **Information hierarchy / sections:** Account (name/email, read-only or editable per what's real) → Appearance (light/dark/system) → Privacy & Partner (a summary card linking to `/settings/privacy` and showing the same honest partner-status line as the dashboard) → Data management (export, delete — see §17) → Sign out.
- **Controls:** simple list/section rows, each either a link (to a subpage) or an inline control (theme toggle).
- **States:** loading (skeleton rows), error (inline banner if account data fails to load), default.
- **Desktop composition:** single centered column, max-width ~720–800px (settings doesn't need the full 1200px measure — it's a list, not a dashboard).
- **Mobile composition:** identical, full-width within the standard margin.
- **Data required:** real authenticated user (name/email), real theme preference, real privacy/partner summary.
- **Existing components reusable:** `Card`, `Button`, `Toggle` (for theme).
- **New components:** none beyond what's already listed in §6.
- **Must NOT implement:** any subscription-management section, any notification-preferences section, any "Premium"/"VIP"/plan-status label. If none of that functionality is real for V1, it does not appear in settings at all — not grayed out, not "coming later" (settings is a utility screen, not a place to advertise parked features; unlike the dashboard/nav, there's no value in teasing Stripe/notifications here).

---

## 13. Privacy (`/settings/privacy`)

This is the trust screen — treat it with the most design care in the spec.

- **Purpose:** make "nothing is shared unless you choose it" legible and controllable in under 10 seconds.
- **Primary user goal:** understand current sharing status at a glance, and change it with confidence that the change takes effect immediately.
- **Information hierarchy:**
  1. Headline reinforcing the private-by-default promise, e.g. Playfair "Your privacy, your rules" + Inter subhead "Nothing is shared with your partner unless you turn it on here."
  2. **Master control:** "Share with partner" — one prominent toggle. Off by default; when off, every category below is visually de-emphasized/disabled (not hidden — the user should see what *could* be shared, just clearly inactive).
  3. **Individual categories**, each a row with a label, one-line description, and a toggle: Cycle phase, Mood. (Only these two — matching the current MVP's actual filtered fields.)
  4. **Fantasy vault** and **Intimacy deck** rows: shown with a "Coming later" badge and their toggle **disabled** (not just visually muted — actually non-interactive), with a one-line note that these categories aren't available to share yet. Do not render them as working toggles that silently do nothing when flipped, which is what happens today.
  5. **Current partner status** — a compact, honest line: "No partner connected" / "Invitation pending" / "Connected to [partner's real name]" (see §14 for the full state set), so a user configuring privacy always knows *who*, if anyone, these settings currently apply to.
  6. **"What your partner can currently see"** — a short, literal list generated from the actual enabled categories (e.g., "Cycle phase" / "Mood" as separate lines, or "Nothing yet" if the master toggle is off or nothing is connected) — this is the plain-language mirror of the real filtered DTO, not a separate claim that could drift from it.
- **Controls:** one master `Toggle`, two (soon: more) category `Toggle`s, disabled toggles for parked categories, an implicit save-on-change model (each toggle persists immediately) or an explicit "Save changes" CTA if the product prefers batched saves — either is acceptable, but whichever is chosen must give real save feedback (see states below).
- **States:** loading (skeleton rows); default/loaded; saving (the specific toggle being changed shows a brief in-place loading indicator, not a full-page spinner); save succeeded (`InlineBanner`, `role="status"`, auto-dismissing); save failed (`InlineBanner`, `role="alert"`, and the toggle visually reverts to its last-known-good state rather than showing an unconfirmed change as if it succeeded); reset-to-default action available and clearly labeled (e.g., "Reset all to private").
- **Desktop composition:** single column, max-width ~720px, generous spacing between the master toggle, the category list, and the partner-status/visibility summary so they read as three distinct trust "chapters," not one dense list.
- **Mobile composition:** identical structure, full-width rows, 44px+ tap targets on every toggle row (the whole row should be tappable, not just the small switch).
- **Data required:** real `privacy_settings` for the signed-in user; real partner-link status; the same filtered-field logic the partner-facing API actually applies (so the "what your partner can see" list is generated from, or at minimum kept in lockstep with, the real DTO logic — this is a cross-cutting implementation note, not purely visual).
- **Existing components reusable:** `Toggle` (sage "on" state), `Card`.
- **New components:** `InlineBanner`, `StatusPill` (for the partner-status line).
- **Must NOT implement:** functioning-looking toggles for fantasy/intimacy that don't actually do anything server-side; a privacy screen that shows "what partner can see" as a hardcoded or independently-maintained string rather than reflecting the actual sharing logic.

---

## 14. Partner Linking

Designed strictly around the corrected product model from the validation pass: **the cycle owner initiates, the partner discovers and explicitly accepts, the owner controls sharing thereafter, and the owner can revoke.** This is the reverse of what the current backend's query direction happens to implement — flagged here explicitly so implementation corrects the direction rather than designing UI around the wrong one (see `docs/MVP_AUDIT_VALIDATION.md` §4/§6, "Architecture Decisions Needed").

All of these states live primarily on `/partner` for the owner's side, with two of them (incoming invitation, accept/decline) needing a surface for the *invited* person — who may not yet have visited `/partner` with any context. For V1, treat the invited person's experience as: they receive the invite via the email-based lookup already in the backend, and upon their own login, `/partner` itself becomes the place they see and act on a pending incoming invitation — no separate route needed.

### 14.1 No Partner Connected (owner's view)
- **Purpose/goal:** explain what partner sharing is and offer a clear way to start.
- **Hierarchy:** `EmptyState` — icon, Playfair headline ("No partner connected yet"), Inter body (one or two sentences on what connecting enables, referencing the privacy screen), primary rose CTA ("Invite a partner").
- **Controls:** one CTA, opens the invite flow (14.2).
- **Must NOT implement:** the current wording/visual that implies a partner might already be there; no fabricated preview of "what it would look like."

### 14.2 Invite Partner
- **Purpose/goal:** let the owner send a real invitation by email.
- **Hierarchy:** Playfair or plain headline ("Invite your partner"), one email `Input`, primary rose "Send invitation" CTA, secondary "Cancel."
- **Controls/states:** default; validation error (invalid email, inviting yourself, partner not found, partnership already exists — each a specific inline message, matching the real API error cases already implemented); sending (loading); success → transitions to 14.3.
- **Desktop/mobile:** presented as a `Modal`/`Dialog` (real focus trap) over the no-partner-connected screen, or as its own simple sub-screen — either is acceptable, but must use the new `Modal` primitive if it's an overlay.

### 14.3 Invite Sent / Pending (owner's view)
- **Purpose/goal:** confirm the invite went out and set expectations.
- **Hierarchy:** `StatusPill` (warning tone, "Pending") + Playfair/Inter headline ("Invitation sent") + Inter body naming the invited email + a secondary "Cancel invitation" action.
- **States:** default; cancel-in-progress; cancelled (returns to 14.1); (optional) resend action if the invite can expire.
- **Must NOT implement:** any implication that the partner has seen or responded to it yet.

### 14.4 Incoming Partner Invitation (invited person's view)
- **Purpose/goal:** let the invited person discover they've been invited *at all* — currently impossible in the shipped product; this is new surface, not a restyle.
- **Hierarchy:** `EmptyState`-style card on `/partner` for this person: Playfair headline ("[Owner's real name] wants to share their cycle data with you"), Inter body explaining what accepting means (read-only, owner controls what's visible, can be revoked anytime), two CTAs.
- **Controls:** primary rose "Accept" CTA, secondary "Decline" (outline/ghost, not styled as equally weighted as accept — this is a consent screen, not a neutral choice between two buttons of equal visual weight).
- **Data required:** the inviting owner's real display name/email; the pending link record.

### 14.5 Accept / Decline Invitation
- **Purpose/goal:** the explicit consent moment — the single most important click in the partner journey, and currently the missing one.
- **Hierarchy:** if presented as a confirmation dialog rather than inline on 14.4: Playfair headline restating the decision ("Accept invitation from [name]?"), Inter body reiterating read-only + revocable, two clearly-weighted buttons.
- **States:** default; confirming (loading); accepted → transitions to 14.7 for both parties (on next load); declined → invitation is dismissed, no relationship is created, owner's 14.3 state should reflect the decline rather than staying silently "pending" forever.
- **Must NOT implement:** an accept action with no explanation of what the other person is agreeing to.

### 14.6 (moved) — see 14.4/14.5; numbering follows the brief's list where 14 covers invite states and 15 covers the active/viewer experience.

### 14.7 Connected (owner's view)
- **Purpose/goal:** confirm an active relationship exists and route to managing what's shared.
- **Hierarchy:** `StatusPill` (sage tone, "Connected") + the real partner's name + a link into `/settings/privacy` ("Manage what's shared") + a "Disconnect" action.
- **This is the real replacement for `ManagePartnerCard`** — same slot, real data, sage instead of an unstated accent, no "View Partner's Perspective" dead button (omit entirely unless/until that's real).

### 14.8 Disconnect / Revoke (confirmation)
- **Purpose/goal:** a deliberate, hard-to-misclick confirmation before ending the relationship.
- **Hierarchy:** destructive-pattern `Modal` (see §17) — headline ("Disconnect from [name]?"), body explaining that the partner will immediately lose access to any shared data, two buttons (destructive-styled confirm in `--error`, not rose — disconnecting is not a "positive brand action" moment; cancel as the visually calmer option).
- **States:** default; confirming (loading); success (returns to 14.1); failure (inline error, relationship unchanged).

### 14.9 Access Revoked (partner's view)
- **Purpose/goal:** tell the (former) partner plainly that access has ended, without being unkind about it.
- **Hierarchy:** `EmptyState` — neutral icon (not an error icon), Inter headline ("Your access has ended"), one sentence of context ("[Name] has ended shared access. You can reconnect if they invite you again.").
- **Must NOT implement:** an error-styled/red treatment — this is an expected, normal product outcome, not a failure.

---

## 15. Partner View (`/partner`, the viewer's read-only experience)

Distinct states, matching the brief's list, all read-only:

| State | What renders |
|---|---|
| **No connection** | Same `EmptyState` pattern as 14.1, but worded for a viewer who hasn't been invited yet: "You're not connected to anyone yet." No CTA to "invite," since inviting is the owner's action in this model — a viewer-side invite CTA would contradict the one-directional journey the brief specifies. |
| **Pending** | The 14.3-equivalent from the viewer's side is actually 14.4 (they have something to act on) — if they haven't acted, this state doesn't linger silently; 14.4 *is* the pending state for a viewer, always actionable. |
| **Active, nothing shared** | `StatusPill` sage "Connected," followed by plain Inter body: "Nothing is shared with you yet." No blank cards standing in for absent data — one honest line, full stop. |
| **Active, some data shared** | `StatusPill` sage "Connected," then **only** the fields the real DTO actually returned rendered as simple labeled rows — e.g. "Current phase: Follicular," "Mood: 7/10" — each row only appears if that field was actually present in the response. A category the owner hasn't enabled simply has no row at all; it is never shown as "Hidden" or "Locked" (that would itself leak the fact that data exists to hide). |
| **Access revoked** | 14.9's `EmptyState`, as above. |
| **Error** | `InlineBanner` (`role="alert"`) explaining the fetch failed, with a retry action — never a silent blank screen, and never a state indistinguishable from "active, nothing shared" (an error must look like an error, not like an empty success). |

- **Supportive copy rule:** any generic educational copy (e.g., a one-line explainer of what a "follicular phase" means) must be visually and textually distinct from the owner-derived data rows above it — e.g., in a separate lighter-weight card or clearly labeled "General info," never interleaved as if it were personalized insight. No inference beyond the literal returned fields (no "they might be more energetic today" commentary attached to a shared mood score).
- **Desktop/mobile:** single centered column, max-width ~720px — this is a read-only status page, not a dashboard, and doesn't need the two-column treatment.
- **Data required:** the real filtered partner DTO only; no client-side field guessing.
- **Existing components reusable:** `Card`, `StatusPill`, `EmptyState`, `InlineBanner`.
- **Must NOT implement:** any of the current fabricated identity/status content; any inferred health/relationship advice attached to shared fields.

---

## 16. Empty / Loading / Error States

General rules applied consistently across every screen in §8–15:

- **Loading:** prefer skeleton placeholders shaped like the real content over full-page spinners, except for the very first paint of an auth-gated route (where a brief centered `LoadingSpinner` is acceptable while session state resolves). Skeletons respect `prefers-reduced-motion` (see §19) by using a static shimmer or none at all rather than a moving gradient when that preference is set.
- **Empty:** always a purpose-built `EmptyState` (icon + Playfair headline + Inter body + optional single CTA) — never an unstyled blank area, and never real-looking placeholder data standing in for "nothing yet."
- **Error:** always an `InlineBanner` with `role="alert"`, scoped to the smallest region that actually failed (a dashboard section, a form, a list) rather than replacing the whole page unless the failure is truly page-level (e.g., not authenticated).
- **Save success:** always an explicit, visible confirmation (`InlineBanner` with `role="status"`) — currently missing on the cycle-log flow specifically; required on every save action in this spec (cycle log, privacy toggle, invite sent, accept/decline, disconnect).

---

## 17. Destructive Actions

Applies to: disconnect/revoke partner (14.8), delete-data/account (below), decline an invitation (lighter-weight than the other two, but still an explicit confirm, not a single misclick).

**Pattern:** `Modal` with real focus trapping → destructive headline stating the consequence in plain language → explicit list of what will actually happen (not a vague "this cannot be undone") → two buttons, cancel visually calmer/first, confirm styled in `--error` (not rose — rose is reserved for constructive primary actions) → loading state on confirm (disabled, spinner, no double-submit) → success routes away from the now-irrelevant screen → failure keeps the modal open with an inline error and the original state intact.

### Delete My Data / Account
Per the brief, this spec does **not** design the current behavior as complete or acceptable, and flags final deletion semantics as **architecture-dependent** (per `docs/MVP_AUDIT_VALIDATION.md`'s open question #3 — full erasure vs. local-state-only is a product decision not yet made).

- **Hierarchy:** headline ("Delete my data"), a body that **lists exactly what will be removed**, written to match whatever the eventual real scope is decided to be — e.g., if full erasure: "Your cycle logs, privacy settings, partner connections, and account will be permanently deleted. This cannot be undone." If local-only: the screen must not claim to delete server data at all, and should be relabeled (e.g., "Clear this device" rather than "Delete all data") so its name matches its actual effect.
- **Controls:** a text-confirmation step for the account-deletion case (e.g., type "DELETE" or the account email) is recommended given the sensitivity of the data involved, in addition to the two-button confirm pattern.
- **States:** default; confirming (loading, clearly communicating this may take a moment if it's a real multi-table deletion); success (routes to a logged-out landing state with a brief confirmation, not silently back to `/`); failure (inline error, explicit statement that deletion did not complete, no false "your data is gone" messaging on partial failure).
- **Must NOT implement:** the current dialog's promise ("all cycle data, entries, and local settings will be permanently deleted") paired with a handler that only clears `localStorage`. Whichever real scope is chosen, the copy and the behavior must match exactly.

---

## 18. Responsive Behaviour

| Screen | Desktop | Mobile |
|---|---|---|
| Landing | Centered column, max 720px hero measure | Same structure, stacked, full-width CTAs |
| Auth (all) | Centered card, ~440px | Full-bleed within 20–24px margin |
| Dashboard | Two-column (today/history + privacy summary) within 1200–1280px | Single column, same vertical order as hierarchy |
| Cycle | Two-column (form + history) | Single column; form opens as a full-height sheet via `Modal` |
| Settings | Single column, ~720–800px | Full-width list rows |
| Privacy | Single column, ~720px | Full-width toggle rows, 44px+ tap targets |
| Partner linking states | Centered card/`EmptyState`, ~600–720px | Same, full-width within margin |
| Partner view | Centered column, ~720px | Same |

No screen exists only on one breakpoint. Tablet inherits the mobile single-column layout up to the point where the desktop two-column breakpoint comfortably fits the 1200px measure — no separate tablet-specific redesign is needed for any MVP screen; tablet is "mobile layout, more breathing room" until it crosses into desktop width.

---

## 19. Accessibility Requirements

Concrete, implementation-level — not a restated compliance claim:

- **Contrast:** every text/background and icon/background pairing introduced by the new rose/sage palette must be measured and meet **4.5:1** for normal text and **3:1** for large text (≥24px or ≥19px bold) and for meaningful UI component boundaries (e.g., toggle track vs. background). Do not ship an indicative hex from §3 without checking it in context.
- **Focus states:** every interactive element has a visible focus ring using the existing `--ring` token (already implemented on `.btn-cta`/`.input`) — extend this to every new component (`Modal` close button, `StatusPill` if it's ever interactive, nav items).
- **Semantic labels:** every form field keeps the existing `label`/`htmlFor` pattern already correct in `Input`/`Toggle`; new components (`Modal`, `EmptyState` CTA) must not introduce unlabeled icon-only controls.
- **Keyboard navigation:** full tab order through every form and dialog; the new `Modal` primitive must trap focus within itself while open and return focus to the triggering element on close; `Escape` closes any modal/dialog.
- **Touch targets:** 44px minimum height/width on every tappable element, including full toggle rows (not just the switch itself) and icon-only buttons (nav, dismiss/close controls).
- **Modal semantics:** `role="dialog"`, `aria-modal="true"`, an accessible name (`aria-labelledby` pointing at the dialog's headline) on every overlay — cycle-log sheet, delete/revoke confirmations, accept/decline dialog.
- **Field-level errors:** every validation error is associated with its field via `aria-describedby` (already the pattern in `Input`), and `role="alert"` on the error text itself so it's announced.
- **Status/success announcements:** `InlineBanner` uses `role="status"` for success/info and `role="alert"` for errors, so screen readers announce save results without requiring focus to move.
- **Reduced motion:** any transition/animation (toggle switch, modal open/close, skeleton shimmer) must have a `prefers-reduced-motion: reduce` variant that removes or drastically shortens motion rather than disabling the feedback entirely — the *state change* must still be perceivable without motion (e.g., an instant color/opacity change instead of a slide).

---

## 20. Design-to-Existing-Component Map

| Design need | Existing component | Fit |
|---|---|---|
| Primary/secondary buttons | `Button` | Direct reuse, token repaint only |
| Cards/sections | `Card` + subcomponents | Direct reuse |
| Text/textarea fields | `Input`/`Textarea` | Direct reuse |
| Privacy/theme toggles | `Toggle` | Reuse, sage "on" state for privacy context |
| Parked-route placeholder | `ComingLater` | Direct reuse |
| Loading indicator | `LoadingSpinner` | Reuse, repaint hardcoded colors to tokens |
| Nav structure | `AppSidebar`/`TopNavbar`/`navItems.ts` | Reuse structure, fix content (identity, nav list, dead bell) |
| Partner status (dashboard + settings) | *(none — currently fabricated)* | Build `PartnerStatusCard` |
| Modal/dialog overlays | *(none — plain divs today)* | Build `Modal` |
| Empty states | *(none — one-off markup per screen)* | Build `EmptyState` |
| Status/save banners | *(two divergent one-offs today)* | Build `InlineBanner` |
| Editorial headings | *(none — Inter only today)* | Build `SectionHeading`, add Playfair Display |
| Status pills (partner/privacy/invite) | *(one-off inside `PartnerCard.tsx` today)* | Generalize into `StatusPill` |

---

## 21. Components to Reuse

`Button`, `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`, `Input`, `Textarea`, `Toggle`, `ComingLater`, `LoadingSpinner` (with token repaint), the sidebar/topbar/nav-item *structure* (not their current fabricated content).

## 22. Components to Modify

- `Toggle` — sage "on" styling in privacy contexts.
- `AppSidebar` / `TopNavbar` — remove fabricated identity block and dead notification bell; wire to real `authUser`.
- `navItems.ts` — split MVP vs. parked, remove parked entries from the primary/mobile nav render path.
- `LoadingSpinner` — token-based colors instead of hardcoded `rose-*` Tailwind classes.
- `DeleteDataDialog` — new copy and confirm-flow per §17 (shell reusable, content is not).
- `.btn-cta` CSS class — repaint from sage gradient to rose gradient; sage becomes available under its own semantic class for status pills.

## 23. New Components Needed

`Modal`/`Dialog` (with focus trap and ARIA), `EmptyState`, `InlineBanner`, `SectionHeading`, `StatusPill` (generalized), `PartnerStatusCard` (real dashboard/settings partner widget, replacing `PartnerCard` and `ManagePartnerCard`).

## 24. Parked Design Elements

Explicitly excluded from this spec and from MVP navigation/hierarchy: AI Coach, Fantasy Vault, Intimacy Deck, Pricing/subscription tiers and plan-status UI, Notifications (bell and any preferences screen), Apple/Google SSO buttons (until real OAuth exists), any "insights"/external-health-news card, any hormone/AI-prediction claim, any partner "perspective" preview feature. All parked routes continue to use the existing `ComingLater` component if visited directly; none of them appear in primary nav, dashboard hierarchy, or settings.

---

## 25. Implementation Order

Sequenced to fix the most trust-damaging fabrications first and to avoid restyling screens whose underlying data flow is about to change anyway (per the architecture decisions still open in `docs/MVP_AUDIT_VALIDATION.md`):

1. **Design-system foundation** — add Playfair Display, repaint `.btn-cta` to rose, reserve sage for status/trust semantics, build `InlineBanner`, `EmptyState`, `StatusPill`, `SectionHeading` as small, independent, low-risk primitives. *(AI SAFE, no data-flow dependency.)*
2. **Build the `Modal`/`Dialog` primitive** with real focus trapping — needed by cycle logging, delete confirmation, and every partner-linking dialog. *(AI SAFE — a self-contained accessibility-critical component.)*
3. **Fix nav content** — split MVP/parked in `navItems.ts`, remove the dead notification bell, replace the sidebar's fabricated identity with the real authenticated user. *(AI SAFE — no backend dependency.)*
4. **Auth screens** — apply the design system to login/signup/verify-email; remove the SSO buttons; redesign callback success/failure as two real states — **gated on** the `/auth/callback` functional fix from the audit build plan (design can proceed in parallel, but do not ship the "success" state design live until the underlying confirmation logic is real).
5. **Cycle logging redesign** — apply `Modal`, add the missing save-success `InlineBanner`, restyle with the token system. Independent of the partner-architecture decisions, safe to do early.
6. **Dashboard redesign** — real hierarchy per §10, `PartnerStatusCard` in its honest "no partner connected yet" state. Can ship before the full partner-linking flow exists, since "no partner connected" is itself an honest, correct state.
7. **Privacy screen redesign** — per §13, including disabling (not hiding, not faking) the fantasy/intimacy rows. Independent of partner-linking work.
8. **Partner linking flow (14.1–14.9) and partner view (§15)** — **the largest slice, and the one most gated on unresolved architecture** (query direction, and how the server reads the owner's data per the validation pass's Option B recommendation). Design this last among the MVP screens so it isn't built twice against a direction that changes.
9. **Settings and delete-data redesign** — once the real deletion scope (full erasure vs. local-only) is decided, ship the matching copy/flow from §17.
10. **Accessibility pass** across everything shipped in 1–9 — focus order, contrast verification of the actual chosen rose/sage values, reduced-motion variants.

---

MVP DESIGN AUDIT COMPLETE

Design direction: Intimate Wellness as the base system (linen surfaces, calm tonal layering, Playfair Display for editorial moments, Inter for everything else, generous spacing), with Lover Girl's punchy rose reserved for exactly one primary CTA per screen; sage is reassigned from "the brand color" to "the privacy/trust/connected status color."

MVP screens: Landing, Login, Signup, Verify Email, Auth Callback Success, Auth Callback Failure, Dashboard, Cycle, Settings, Privacy, Partner Portal, plus 9 partner-linking states (no connection, invite, pending, incoming invitation, accept/decline, connected, disconnect confirmation, access revoked) and the shared system states (loading, empty, error, save success, destructive confirmation).

New states required: incoming-invitation discovery for the invited party (does not exist today at all), auth-callback failure state (today only a false-positive success exists), cycle-log save-success feedback, partner "active but nothing shared" as its own explicit state distinct from "no partner," privacy-screen "what your partner can currently see" as a live-generated list.

Existing components reusable: Button, Card family, Input/Textarea, Toggle, ComingLater, LoadingSpinner, nav shell structure.

Existing components needing redesign: AppSidebar/TopNavbar (fabricated identity, dead bell), navItems.ts (parked routes in primary nav), DeleteDataDialog (copy/flow mismatch), PartnerCard and ManagePartnerCard (full rebuild, not a restyle — replaced by PartnerStatusCard).

New components required: Modal/Dialog with real focus trapping, EmptyState, InlineBanner, SectionHeading, generalized StatusPill, PartnerStatusCard.

Design concepts deliberately excluded: fake partner names/status, fake subscription tiers, fake notifications, Apple/Google SSO buttons without real OAuth, Face ID/PIN, any encryption claim, fake AI insights or hormone claims, fabricated cycle-day numbers, fabricated sharing status, AI Coach/Fantasy/Intimacy/Pricing in primary navigation or dashboard hierarchy.

First UI implementation slice: design-system foundation — Playfair Display addition, rose/sage token repaint, and the three small new primitives (InlineBanner, EmptyState, StatusPill) — zero dependency on unresolved backend/architecture decisions, safe to build immediately.

Design spec complete. No UI implemented. Awaiting explicit instruction to begin.
