"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  CalendarDays,
  EyeOff,
  Heart,
  Lock,
  NotebookPen,
  ShieldCheck,
  Smile,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { useAuth } from "@/context/AuthContext";
import type { PrivacySettings } from "@/schemas/privacy";
import {
  getPrivacySettings,
  updatePrivacySettings,
} from "@/services/privacy/settings";
import { cn } from "@/utils/cn";

interface PrivacySettingsFormProps {
  initialSettings?: PrivacySettings;
}

const defaultSettings: PrivacySettings = {
  share_with_partner: false,
  share_cycle_phase: false,
  share_mood: false,
  share_fantasy_vault: false,
  share_intimacy_deck: false,
};

export default function PrivacySettingsForm({
  initialSettings,
}: PrivacySettingsFormProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(
    initialSettings ?? defaultSettings,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const userSettings = await getPrivacySettings(user.id);
      setSettings(userSettings);
    } catch (err) {
      setError("Failed to load privacy settings");
      console.error("Error loading privacy settings:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!initialSettings && user?.id) {
      void loadSettings();
    }
  }, [user?.id, initialSettings, loadSettings]);

  const handleSettingChange = async (
    key: keyof PrivacySettings,
    value: boolean,
  ) => {
    if (!user?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updatePrivacySettings(user.id, { [key]: value });

      if (result.success) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSuccess("Privacy settings updated");
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(result.error || "Failed to update privacy settings");
      }
    } catch (err) {
      setError("Failed to update privacy settings");
      console.error("Error updating privacy settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updatePrivacySettings(user.id, defaultSettings);

      if (result.success) {
        setSettings(defaultSettings);
        setSuccess("Privacy settings reset");
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(result.error || "Failed to reset privacy settings");
      }
    } catch (err) {
      setError("Failed to reset privacy settings");
      console.error("Error resetting privacy settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const stealthMode = !settings.share_with_partner;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-cta-start"
          aria-label="Loading privacy settings"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(success || error) && (
        <div
          role={error ? "alert" : "status"}
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm font-semibold",
            error
              ? "border-error/20 bg-error/10 text-error"
              : "border-success/20 bg-success/10 text-success",
          )}
        >
          {error ?? success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(320px,1fr)_minmax(280px,0.8fr)]">
        <section className="rounded-[2rem] border border-border border-l-[6px] border-l-[color:var(--accent-peach)] bg-bg-surface p-6 shadow-md">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-cta-start" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-foreground">
              Manage Partner
            </h2>
          </div>

          <div className="mt-7 rounded-2xl bg-bg p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--accent-peach)] bg-bg-elevated text-xl font-black text-foreground">
                A
              </span>
              <div>
                <p className="text-xl font-bold text-foreground">Alex M.</p>
                <p className="text-sm font-semibold text-[color:var(--accent-peach)]">
                  Connected
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button variant="secondary" className="w-full justify-between">
                View Partner&apos;s Perspective
                <Heart className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-between border-error/30 text-error hover:border-error"
                onClick={handleReset}
                disabled={saving}
              >
                Revoke Access
                <Lock className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border border-l-[6px] border-l-cta-start bg-bg-surface p-6 shadow-md">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-cta-start" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-foreground">
              What You&apos;re Sharing
            </h2>
          </div>

          <div className="mt-7 divide-y divide-border rounded-2xl bg-bg p-4">
            <SharingRow
              icon={CalendarDays}
              title="Cycle Dates"
              description="Share phase context and prediction windows."
              checked={settings.share_cycle_phase}
              disabled={saving || stealthMode}
              onChange={(checked) =>
                handleSettingChange("share_cycle_phase", checked)
              }
            />
            <SharingRow
              icon={Smile}
              title="Mood Insights"
              description="Share high-level mood trends with your partner."
              checked={settings.share_mood}
              disabled={saving || stealthMode}
              onChange={(checked) => handleSettingChange("share_mood", checked)}
            />
            <LockedRow
              icon={Heart}
              title="Symptoms"
              description="Physical symptoms remain private during the MVP phase."
            />
            <LockedRow
              icon={NotebookPen}
              title="Private Notes"
              description="Journal entries are never shared."
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-border border-l-[6px] border-l-info bg-bg-surface p-6 shadow-md">
          <div className="flex items-center gap-3">
            <EyeOff className="h-7 w-7 text-info" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-foreground">
              Stealth Mode
            </h2>
          </div>

          <div className="mt-7 flex items-start justify-between gap-5">
            <div>
              <p className="text-lg font-bold text-foreground">
                {stealthMode ? "Sharing Paused" : "Sharing Active"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Instantly pause all partner sharing without affecting your local
                logging.
              </p>
            </div>
            <Toggle
              checked={stealthMode}
              disabled={saving}
              onChange={(checked) =>
                handleSettingChange("share_with_partner", !checked)
              }
            />
          </div>

          <div className="mt-8 rounded-2xl bg-bg p-5 text-sm text-muted-foreground">
            <p className="font-bold text-foreground">When active:</p>
            <ul className="mt-3 space-y-2">
              <li>Partner sees a data paused message.</li>
              <li>No new partner notifications are sent.</li>
              <li>Your private logs remain unaffected.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

interface SharingRowProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

function SharingRow({
  icon: Icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: SharingRowProps) {
  return (
    <div className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
      <Icon className="h-6 w-6 shrink-0 text-cta-start" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function LockedRow({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 py-5 opacity-55 first:pt-0 last:pb-0">
      <Icon className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <span className="rounded-md bg-bg-elevated px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-info">
        Locked
      </span>
    </div>
  );
}
