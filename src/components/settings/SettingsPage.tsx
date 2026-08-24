"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import {
  Download,
  Heart,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  Users,
} from "lucide-react";

import { TopNavbar, Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { state, toggleTheme, logout } = useApp();
  const { user: authUser } = useAuth();
  const { isDarkMode, isLoading } = state;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  const handleExportData = () => {
    const data = {
      user: authUser,
      cycleData: state.cycleData,
      aiMessages: state.aiMessages,
      intimacyCards: state.intimacyCards,
      fantasyEntries: state.fantasyEntries,
      notifications: state.notifications,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shesync-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = () => {
    localStorage.clear();
    logout();
    setShowDeleteConfirm(false);
  };

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
          <article className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
            <div className="flex items-center gap-3">
              <User className="h-7 w-7 text-cta-start" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-foreground">Account</h2>
            </div>

            <div className="mt-6 space-y-4">
              <ReadOnlyField label="Name" value={authUser?.name || "Sarah J."} />
              <ReadOnlyField
                label="Email"
                value={authUser?.email || "hello@example.com"}
              />
            </div>
          </article>

          <article className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="h-7 w-7 text-info" aria-hidden="true" />
                ) : (
                  <Sun className="h-7 w-7 text-warning" aria-hidden="true" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Theme</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isDarkMode ? "Dark sanctuary mode" : "Soft light mode"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="relative h-8 w-14 rounded-full bg-bg-tertiary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                aria-label="Toggle theme"
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-cta-start transition ${
                    isDarkMode ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </article>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <SettingsAction
            href="/settings/privacy"
            icon={ShieldCheck}
            title="Privacy & Partner"
            description="Choose exactly what your partner can see."
          />
          <SettingsAction
            href="/partner"
            icon={Users}
            title="Partner View"
            description="Preview the read-only partner experience."
          />
        </section>

        <section className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md">
          <div className="flex items-center gap-3">
            <Heart className="h-7 w-7 text-[color:var(--accent-peach)]" />
            <h2 className="text-2xl font-bold text-foreground">
              Data Management
            </h2>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" onClick={handleExportData}>
              <Download className="h-5 w-5" aria-hidden="true" />
              Export My Data
            </Button>
            <Button
              variant="secondary"
              className="border-error/30 text-error hover:border-error"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
              Delete All Data
            </Button>
          </div>
        </section>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-[2rem] border border-border bg-bg-surface p-6 shadow-lg">
            <div className="text-center">
              <Trash2 className="mx-auto mb-4 h-14 w-14 text-error" />
              <h3 className="mb-2 text-2xl font-bold text-foreground">
                Delete All Data?
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                This action cannot be undone. All cycle data, entries, and local
                settings will be permanently deleted.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  className="border-error bg-error/10 text-error hover:border-error"
                  onClick={handleDeleteAllData}
                >
                  Delete Everything
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-muted-foreground">
        {label}
      </label>
      <input className="input" value={value} readOnly />
    </div>
  );
}

function SettingsAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md transition hover:border-cta-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
    >
      <Icon className="h-7 w-7 text-cta-start" aria-hidden="true" />
      <h2 className="mt-5 text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
