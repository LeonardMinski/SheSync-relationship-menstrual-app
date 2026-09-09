import { describe, expect, it } from "vitest";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { buildUserRecord } from "@/services/auth";
import type { Database } from "@/types/supabase.generated";
import type { UserProfileInsert } from "@/types/auth";

// Regression test for the profile_image_url incident (2026-09-08): a
// client-side profile-creation fallback wrote a column that had never
// existed on the live public.users table, silently stranding every user
// whose signup relied on it — no existing test caught it because the auth
// service's other tests mock the Supabase client instead of validating
// against the real schema shape. This test does the opposite: it checks
// buildUserRecord()'s actual output keys against a snapshot of the live
// schema (src/types/supabase.generated.ts), so an unknown-column write
// fails a fast, offline test instead of a live 400 in production.
//
// Keep this list in sync with src/types/supabase.generated.ts's users
// table (regenerate that file after any users-table migration, then
// update this list to match — deliberately duplicated rather than derived
// at runtime, since TS types don't exist at runtime to introspect).
const LIVE_USERS_COLUMNS = [
  "id",
  "email",
  "name",
  "subscription_tier",
  "created_at",
  "partner_id",
  "privacy_settings",
  "onboarding_completed_at",
  "tracking_enabled",
] as const;

// Compile-time half of the contract: if buildUserRecord's return type ever
// gains a key that isn't a valid live column, this line fails
// `tsc --noEmit` (which already runs in this repo's baseline validation),
// independent of whether anyone remembers to update LIVE_USERS_COLUMNS
// above.
type UsersInsert = Database["public"]["Tables"]["users"]["Insert"];
type BuiltRecordKeys = keyof ReturnType<typeof buildUserRecord>;
type _AssertBuiltRecordKeysAreValidColumns =
  BuiltRecordKeys extends keyof UsersInsert
    ? true
    : ["buildUserRecord writes a column not present in the live schema — see src/types/supabase.generated.ts", BuiltRecordKeys];
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- type-only assertion, never read at runtime
const _typeContract: _AssertBuiltRecordKeysAreValidColumns = true as _AssertBuiltRecordKeysAreValidColumns;

const fakeAuthUser = {
  id: "user-1",
  email: "person@example.com",
  created_at: "2026-01-01T00:00:00.000Z",
  user_metadata: { name: "Person" },
  identities: [{ id: "identity-1" }],
} as Partial<SupabaseAuthUser> as SupabaseAuthUser;

describe("buildUserRecord schema contract", () => {
  it("only writes columns that exist on the live public.users table", () => {
    const record = buildUserRecord(fakeAuthUser);
    const unknownColumns = Object.keys(record).filter(
      (key) => !(LIVE_USERS_COLUMNS as readonly string[]).includes(key),
    );

    expect(unknownColumns).toEqual([]);
  });

  it("does not write profile_image_url specifically (the incident this guards against)", () => {
    const record = buildUserRecord(fakeAuthUser);
    expect(record).not.toHaveProperty("profile_image_url");
  });
});

// Regression test for the authenticated-INSERT trust boundary: RLS on
// public.users only checks row ownership (auth.uid() = id), not column
// values, so subscription_tier — server-owned billing display state —
// must never appear in the payload a client-side INSERT actually sends,
// independent of the database-level column grant that backs it up (see
// database/subscriptions-entitlement-forward-fix-migration.sql).
type _AssertProfileInsertExcludesSubscriptionTier =
  "subscription_tier" extends keyof UserProfileInsert
    ? ["UserProfileInsert must not include subscription_tier"]
    : true;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- type-only assertion, never read at runtime
const _profileInsertContract: _AssertProfileInsertExcludesSubscriptionTier =
  true as _AssertProfileInsertExcludesSubscriptionTier;

describe("UserProfileInsert schema contract", () => {
  it("excludes subscription_tier from the columns a client INSERT may write", () => {
    const keys: Array<keyof UserProfileInsert> = [
      "id",
      "email",
      "name",
      "created_at",
      "privacy_settings",
      "tracking_enabled",
    ];
    expect(keys).not.toContain("subscription_tier");
  });
});
