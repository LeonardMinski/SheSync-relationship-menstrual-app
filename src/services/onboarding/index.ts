import { supabase } from "@/lib/supabase/client";

type UserApiResponse = {
  data?: {
    onboarding_completed_at?: string | null;
  };
  error?: string;
};

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("[onboarding] failed to read Supabase session", error);
    return null;
  }
  return session?.access_token || null;
}

export type CompleteOnboardingResult =
  | { success: true; onboardingCompletedAt: string; error?: never }
  | { success: false; onboardingCompletedAt?: never; error: string };

/**
 * Marks the signed-in user's onboarding as complete. Write-only from the
 * client's perspective — the server sets the timestamp itself (see
 * `PUT /api/user`'s `completeOnboarding` handling), so this can only ever
 * move a profile from "incomplete" to "complete," never back.
 */
export async function completeOnboarding(): Promise<CompleteOnboardingResult> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.error(
        "[onboarding] cannot complete onboarding without an authenticated session",
      );
      return { success: false, error: "Authentication required" };
    }

    const response = await fetch("/api/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completeOnboarding: true }),
    });
    const data = (await response.json()) as UserApiResponse;

    if (!response.ok) {
      console.error("[onboarding] failed to complete onboarding", data);
      return {
        success: false,
        error: data.error || "Failed to complete onboarding",
      };
    }

    const onboardingCompletedAt = data.data?.onboarding_completed_at;

    if (!onboardingCompletedAt) {
      console.error(
        "[onboarding] server accepted the request but returned no completion timestamp",
        data,
      );
      return {
        success: false,
        error: "Onboarding completion could not be confirmed",
      };
    }

    return { success: true, onboardingCompletedAt };
  } catch (error) {
    console.error("[onboarding] unexpected error completing onboarding", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
