"use client";

import { TopNavbar } from "@/components/layout/TopNavbar";
import { LogoutButton } from "@/components/layout/LogoutButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { canUseTracking } from "@/features/account/capabilities";
import { useSettingsPageState } from "@/hooks/useSettingsPageState";

import { AccountCard } from "./AccountCard";
import { CoachDataCard } from "./CoachDataCard";
import { DataManagementCard } from "./DataManagementCard";
import { SettingsActionGrid } from "./SettingsActionGrid";
import { ThemeCard } from "./ThemeCard";

export default function SettingsPage() {
  const { authUser, exportData, isDarkMode, isLoading, toggleTheme } =
    useSettingsPageState();
  const canTrack = canUseTracking(authUser);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title="Settings"
        subtitle="Account, privacy, and preferences"
      />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <AccountCard user={authUser} />
          <ThemeCard isDarkMode={isDarkMode} onToggle={toggleTheme} />
        </section>

        <SettingsActionGrid canTrack={canTrack} />

        {canTrack && <CoachDataCard />}

        <DataManagementCard onExport={exportData} />

        <section className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
          <h2 className="text-2xl font-bold text-foreground">Sign out</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You&apos;ll need to sign back in to access your logs and settings again.
          </p>
          <div className="mt-5 max-w-xs">
            <LogoutButton />
          </div>
        </section>
      </main>
    </div>
  );
}
