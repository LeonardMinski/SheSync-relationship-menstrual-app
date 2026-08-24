import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session, User as SupabaseAuthUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { auth, translateAuthError } from "@/services/auth";

type SupabaseAuthMock = typeof supabase.auth & {
  getSession: Mock;
  signInWithPassword: Mock;
  signUp: Mock;
  resetPasswordForEmail: Mock;
  updateUser: Mock;
  signOut: Mock;
};

const authMock = supabase.auth as SupabaseAuthMock;
const fromMock = supabase.from as unknown as Mock;

const authUser = {
  id: "user-1",
  email: "person@example.com",
  created_at: "2026-01-01T00:00:00.000Z",
  user_metadata: { name: "Person" },
  identities: [{ id: "identity-1" }],
} as Partial<SupabaseAuthUser> as SupabaseAuthUser;

const session = {
  access_token: "token",
  refresh_token: "refresh",
  expires_in: 3600,
  token_type: "bearer",
  user: authUser,
} as Session;

const profile = {
  id: "user-1",
  email: "person@example.com",
  name: "Person",
  subscription_tier: "premium",
  created_at: "2026-01-01T00:00:00.000Z",
  profile_image_url: null,
  privacy_settings: {
    share_with_partner: false,
    share_cycle_phase: false,
    share_mood: false,
    share_fantasy_vault: false,
    share_intimacy_deck: false,
  },
};

const setProfileResult = ({
  data,
  error,
  upsertError = null,
}: {
  data: unknown;
  error: unknown;
  upsertError?: unknown;
}) => {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const upsert = vi.fn().mockResolvedValue({ error: upsertError });

  fromMock.mockReturnValue({
    select,
    upsert,
  } as unknown as ReturnType<typeof supabase.from>);

  return { maybeSingle, upsert };
};

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  });

  it("translates invalid credentials without exposing account existence", () => {
    const error = translateAuthError(
      { message: "Invalid login credentials" },
      "INVALID_CREDENTIALS",
    );

    expect(error.code).toBe("INVALID_CREDENTIALS");
    expect(error.message).toBe("Incorrect email or password.");
  });

  it("translates unconfirmed email errors", () => {
    const error = translateAuthError({ message: "Email not confirmed" });

    expect(error.code).toBe("EMAIL_NOT_CONFIRMED");
  });

  it("translates rate-limited auth errors", () => {
    const error = translateAuthError({ message: "Too many requests" });

    expect(error.code).toBe("RATE_LIMITED");
  });

  it("fails login safely for incorrect passwords", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const result = await auth.signIn({
      email: "person@example.com",
      password: "wrong-password",
    });

    expect(result.session).toBeNull();
    expect(result.user).toBeNull();
    expect(result.error?.code).toBe("INVALID_CREDENTIALS");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("uses the same safe login error for unknown emails", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User not found" },
    });

    const result = await auth.signIn({
      email: "unknown@example.com",
      password: "password-1",
    });

    expect(result.error?.code).toBe("INVALID_CREDENTIALS");
    expect(result.error?.message).toBe("Incorrect email or password.");
  });

  it("returns an email verification error without loading a profile", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email not confirmed" },
    });

    const result = await auth.signIn({
      email: "person@example.com",
      password: "password-1",
    });

    expect(result.error?.code).toBe("EMAIL_NOT_CONFIRMED");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("restores an existing session and profile", async () => {
    authMock.getSession.mockResolvedValue({
      data: { session },
      error: null,
    });
    setProfileResult({ data: profile, error: null });

    const result = await auth.getCurrentUser();

    expect(result.session).toBe(session);
    expect(result.user?.subscription_tier).toBe("premium");
    expect(result.error).toBeNull();
  });

  it("creates a missing profile for an authenticated user", async () => {
    authMock.getSession.mockResolvedValue({
      data: { session },
      error: null,
    });
    const { upsert } = setProfileResult({ data: null, error: null });

    const result = await auth.getCurrentUser();

    expect(result.session).toBe(session);
    expect(result.user?.id).toBe("user-1");
    expect(result.user?.subscription_tier).toBe("free");
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("keeps profile query failures distinct from auth failures", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: authUser, session },
      error: null,
    });
    setProfileResult({
      data: null,
      error: { message: "permission denied for table users" },
    });

    const result = await auth.signIn({
      email: "person@example.com",
      password: "password-1",
    });

    expect(result.session).toBe(session);
    expect(result.user).toBeNull();
    expect(result.error?.code).toBe("PROFILE_ERROR");
  });

  it("reports profile creation failure deliberately", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: authUser, session },
      error: null,
    });
    setProfileResult({
      data: null,
      error: null,
      upsertError: { message: "new row violates row-level security policy" },
    });

    const result = await auth.signIn({
      email: "person@example.com",
      password: "password-1",
    });

    expect(result.session).toBe(session);
    expect(result.user).toBeNull();
    expect(result.error?.code).toBe("PROFILE_ERROR");
  });

  it("handles successful signup that requires email verification", async () => {
    authMock.signUp.mockResolvedValue({
      data: { user: authUser, session: null },
      error: null,
    });

    const result = await auth.signUp({
      email: "person@example.com",
      password: "password-1",
      name: "Person",
    });

    expect(result.requiresEmailVerification).toBe(true);
    expect(result.session).toBeNull();
    expect(result.error).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("handles duplicate signup safely", async () => {
    authMock.signUp.mockResolvedValue({
      data: {
        user: { ...authUser, identities: [] } as SupabaseAuthUser,
        session: null,
      },
      error: null,
    });

    const result = await auth.signUp({
      email: "person@example.com",
      password: "password-1",
      name: "Person",
    });

    expect(result.error?.code).toBe("ACCOUNT_ALREADY_EXISTS");
    expect(result.error?.message).toContain("may already exist");
  });

  it("requests password reset with a reset redirect", async () => {
    authMock.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    });

    const result = await auth.requestPasswordReset("person@example.com");

    expect(result.error).toBeNull();
    expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith(
      "person@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/reset-password"),
      }),
    );
  });

  it("updates passwords through Supabase Auth", async () => {
    authMock.updateUser.mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    const result = await auth.updatePassword("password-1");

    expect(result.error).toBeNull();
    expect(authMock.updateUser).toHaveBeenCalledWith({
      password: "password-1",
    });
  });

  it("clears remember-me persistence on sign out", async () => {
    window.localStorage.setItem("supabase-remember-me", "true");
    authMock.signOut.mockResolvedValue({ error: null });

    await auth.signOut();

    expect(window.localStorage.getItem("supabase-remember-me")).toBeNull();
  });
});
