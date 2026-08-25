"use client";

import { PublicFooter, PublicHeader } from "@/components/layout/PublicChrome";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useSettingsPageState } from "@/hooks/useSettingsPageState";

import { AccountCard } from "./AccountCard";
import { DataManagementCard } from "./DataManagementCard";
import { DeleteDataDialog } from "./DeleteDataDialog";
import { SessionManagementCard } from "./SessionManagementCard";
import { SettingsActionGrid } from "./SettingsActionGrid";
import { ThemeCard } from "./ThemeCard";

export default function SettingsPage() {
  const {
    authUser,
    deleteAllData,
    exportData,
    isDarkMode,
    isLoading,
    setShowDeleteConfirm,
    showDeleteConfirm,
    toggleTheme,
  } = useSettingsPageState();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="ss-page min-h-screen text-[color:var(--design-ink)]">
      <PublicHeader />

      <main className="mx-auto w-full max-w-5xl space-y-8 px-5 py-16 sm:px-8 lg:px-10">
        <section>
          <h1 className="ss-display text-5xl font-bold tracking-tight text-[color:var(--design-brown)] md:text-6xl">
            Settings
          </h1>
          <p className="mt-4 max-w-2xl text-xl leading-relaxed text-[color:var(--design-muted)]">
            Manage your intimate wellness journey preferences.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <AccountCard user={authUser} />
          <ThemeCard isDarkMode={isDarkMode} onToggle={toggleTheme} />
        </section>

        <SettingsActionGrid />

        <DataManagementCard
          onDelete={() => setShowDeleteConfirm(true)}
          onExport={exportData}
        />

        <SessionManagementCard />
      </main>

      {showDeleteConfirm && (
        <DeleteDataDialog
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={deleteAllData}
        />
      )}

      <PublicFooter />
    </div>
  );
}
