"use client";

import { TopNavbar } from "@/components/layout/TopNavbar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useSettingsPageState } from "@/hooks/useSettingsPageState";

import { AccountCard } from "./AccountCard";
import { DataManagementCard } from "./DataManagementCard";
import { DeleteDataDialog } from "./DeleteDataDialog";
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
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title="Settings"
        subtitle="Account, privacy, and preferences"
        showNotifications
      />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <section className="hidden md:block">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-3 max-w-2xl text-xl leading-relaxed text-muted-foreground">
            Manage your account, privacy, and preferences.
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
      </main>

      {showDeleteConfirm && (
        <DeleteDataDialog
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={deleteAllData}
        />
      )}
    </div>
  );
}
