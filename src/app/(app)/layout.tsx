"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ThemeProvider from "@/components/ThemeProvider";
import { getLoginRedirectPath } from "@/utils/authRedirects";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  isWaitingForOnboardingStatus,
  shouldRedirectToOnboarding,
} from "@/features/onboarding/onboarding.utils";
import {
  isTrackedOnlyRoute,
  isWaitingForTrackingStatus,
  shouldBlockTrackedRoute,
} from "@/features/account/capabilities";

const AuthLoadingState = ({ text }: { text: string }) => (
  <div className="min-h-screen bg-bg text-foreground">
    <div className="flex min-h-screen items-center justify-center p-4">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  </div>
);

function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  const { session, user, loading, profileError } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace(getLoginRedirectPath(pathname));
      return;
    }

    if (session && shouldRedirectToOnboarding(user)) {
      router.replace("/onboarding");
      return;
    }

    if (session && shouldBlockTrackedRoute(user, pathname)) {
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

  if (shouldRedirectToOnboarding(user)) {
    return <AuthLoadingState text="Taking you to onboarding..." />;
  }

  if (isTrackedOnlyRoute(pathname) && isWaitingForTrackingStatus(user, profileError)) {
    return <AuthLoadingState text="Loading..." />;
  }

  if (shouldBlockTrackedRoute(user, pathname)) {
    return <AuthLoadingState text="Redirecting..." />;
  }

  return (
    <AppProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-bg text-foreground md:flex">
          <Sidebar />
          <MobileHeader />
          <div className="min-h-screen flex-1 pb-16 md:pb-0">{children}</div>
          <BottomTabBar />
        </div>
      </ThemeProvider>
    </AppProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>
    </AuthProvider>
  );
}
