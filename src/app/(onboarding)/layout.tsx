"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ThemeProvider from "@/components/ThemeProvider";
import { getLoginRedirectPath } from "@/utils/authRedirects";
import {
  isWaitingForOnboardingStatus,
  shouldRedirectAwayFromOnboarding,
} from "@/features/onboarding/onboarding.utils";

const AuthLoadingState = ({ text }: { text: string }) => (
  <div className="min-h-screen bg-bg text-foreground">
    <div className="flex min-h-screen items-center justify-center p-4">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  </div>
);

// A minimal, chrome-free authenticated layout for full-bleed sequential
// flows (currently just onboarding) that shouldn't show primary nav while
// the user is still being set up.
function AuthenticatedOnboardingLayout({ children }: { children: React.ReactNode }) {
  const { session, user, loading, profileError } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace(getLoginRedirectPath(pathname));
      return;
    }

    if (session && shouldRedirectAwayFromOnboarding(user)) {
      router.replace("/dashboard");
    }
  }, [loading, pathname, router, session, user]);

  if (loading) {
    return <AuthLoadingState text="Loading..." />;
  }

  if (!session) {
    return <AuthLoadingState text="Redirecting to sign in..." />;
  }

  if (!user) {
    return (
      <AuthLoadingState text="We couldn't load your profile. Please refresh or try signing in again." />
    );
  }

  if (isWaitingForOnboardingStatus(user, profileError)) {
    return <AuthLoadingState text="Loading..." />;
  }

  if (shouldRedirectAwayFromOnboarding(user)) {
    return <AuthLoadingState text="Taking you to your dashboard..." />;
  }

  return (
    <AppProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-bg text-foreground">{children}</div>
      </ThemeProvider>
    </AppProvider>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedOnboardingLayout>{children}</AuthenticatedOnboardingLayout>
    </AuthProvider>
  );
}
