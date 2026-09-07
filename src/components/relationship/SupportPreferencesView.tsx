"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Toggle } from "@/components/ui/Toggle";
import {
  getSupportPreferences,
  setSupportPreferenceShared,
  upsertSupportPreference,
} from "@/services/relationship/supportPreferences";
import type { SupportBarrier, SupportChoice, SupportContext, SupportPreference } from "@/types/relationship";

const CONTEXTS: { value: SupportContext; label: string }[] = [
  { value: "overwhelmed", label: "When I'm overwhelmed" },
  { value: "upset", label: "When I'm upset" },
  { value: "difficult_period_day", label: "When I have a difficult period day" },
];

const SUPPORT_OPTIONS: { value: SupportChoice; label: string }[] = [
  { value: "space_first", label: "Give me space first" },
  { value: "reassure", label: "Reassure me" },
  { value: "help_practically", label: "Help practically" },
  { value: "ask_what_i_need", label: "Ask me what I need" },
  { value: "physical_affection", label: "Physical affection" },
  { value: "quiet_company", label: "Quiet company" },
];

const BARRIER_OPTIONS: { value: SupportBarrier; label: string }[] = [
  { value: "advice_problem_solving", label: "Advice or problem solving" },
  { value: "crowding", label: "Crowding me" },
  { value: "telling_to_relax", label: "Telling me to relax" },
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

type Mode = "edit" | "preview" | "manage";

export function SupportPreferencesView({ partnerName }: { partnerName: string }) {
  const [preferences, setPreferences] = useState<Record<SupportContext, SupportPreference | null>>({
    overwhelmed: null,
    upset: null,
    difficult_period_day: null,
  });
  const [activeContext, setActiveContext] = useState<SupportContext>("overwhelmed");
  const [mode, setMode] = useState<Mode>("edit");
  const [preferredSupports, setPreferredSupports] = useState<SupportChoice[]>([]);
  const [whatDoesNotHelp, setWhatDoesNotHelp] = useState<SupportBarrier[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getSupportPreferences().then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.success) {
        const byContext: Record<SupportContext, SupportPreference | null> = {
          overwhelmed: null,
          upset: null,
          difficult_period_day: null,
        };
        for (const pref of result.data.own) byContext[pref.context] = pref;
        setPreferences(byContext);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const current = preferences[activeContext];
    setPreferredSupports(current?.preferredSupports ?? []);
    setWhatDoesNotHelp(current?.whatDoesNotHelp ?? []);
    setAdditionalContext(current?.additionalContext ?? "");
  }, [activeContext, preferences]);

  async function persist(): Promise<SupportPreference | null> {
    setSaving(true);
    const result = await upsertSupportPreference({
      context: activeContext,
      preferredSupports,
      whatDoesNotHelp,
      additionalContext: additionalContext.trim() || null,
    });
    setSaving(false);
    if (!result.success) return null;
    setPreferences((current) => ({ ...current, [activeContext]: result.data.preference }));
    return result.data.preference;
  }

  async function handleShare() {
    await persist();
    setSaving(true);
    const result = await setSupportPreferenceShared(activeContext, true);
    setSaving(false);
    if (result.success) {
      setPreferences((current) => ({ ...current, [activeContext]: result.data.preference }));
      setMode("edit");
    }
  }

  async function handleToggleShared(context: SupportContext, isShared: boolean) {
    const result = await setSupportPreferenceShared(context, isShared);
    if (result.success) {
      setPreferences((current) => ({ ...current, [context]: result.data.preference }));
    }
  }

  const activeLabel = CONTEXTS.find((c) => c.value === activeContext)?.label ?? "";
  const activePreference = preferences[activeContext];

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (mode === "manage") {
    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">Support Preferences</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Manage how and when your support preferences are visible to {partnerName}. Keep them
              personal or toggle shared sync.
            </p>
          </div>
          <StatusPill tone="muted" className="shrink-0 uppercase tracking-wide">
            Private to you
          </StatusPill>
        </div>

        <div className="mt-6 space-y-4">
          {CONTEXTS.map(({ value, label }) => {
            const pref = preferences[value];
            return (
              <div
                key={value}
                className="rounded-[1.5rem] border border-border bg-bg-surface p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg italic text-foreground">{label}</h2>
                  <div className="flex items-center gap-3">
                    <label htmlFor={`share-toggle-${value}`} className="text-xs font-semibold text-muted-foreground">
                      Share with {partnerName}
                    </label>
                    <Toggle
                      id={`share-toggle-${value}`}
                      checked={pref?.isShared ?? false}
                      disabled={!pref || (pref.preferredSupports.length === 0 && !pref.additionalContext)}
                      onChange={(checked) => void handleToggleShared(value, checked)}
                    />
                  </div>
                </div>
                {pref && pref.preferredSupports.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pref.preferredSupports.map((choice) => (
                      <span
                        key={choice}
                        className="rounded-full border border-[color:var(--accent-rose)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-rose)]"
                      >
                        {SUPPORT_OPTIONS.find((o) => o.value === choice)?.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sharing preferences is not the same as consent. You decide what to share, and you can
          unshare at any time.
        </p>

        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => setMode("edit")}>
            Back to editing
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "preview") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[1.5rem] border border-border bg-bg-surface p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">
                Preview Preferences
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This is exactly what {partnerName} will see once you choose to share your preferences.
              </p>
            </div>
            <StatusPill tone="muted" className="shrink-0 uppercase tracking-wide">
              Preview mode
            </StatusPill>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-bg-elevated p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-rose)]">
                When you are {activeLabel.replace("When I'm ", "").replace("When I have ", "")}:
              </p>
              <StatusPill tone="rose" className="shrink-0">
                Shared by you
              </StatusPill>
            </div>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {preferredSupports.length > 0
                ? preferredSupports.map((v) => SUPPORT_OPTIONS.find((o) => o.value === v)?.label).join(", ")
                : "No preferences selected yet."}
            </p>
            {additionalContext && <p className="mt-2 text-sm text-muted-foreground">{additionalContext}</p>}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-bg-elevated p-5">
          <h2 className="font-display text-lg italic text-foreground">Confirm sharing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            By sharing, {partnerName} will receive this preference. This preference does not include
            your underlying logs.
          </p>
          <Button variant="cta" className="mt-4 w-full" onClick={handleShare} loading={saving}>
            Share this with {partnerName}
          </Button>
          <Button variant="secondary" className="mt-2 w-full" onClick={() => setMode("edit")}>
            Back to editing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">Support Preferences</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Design how you would like {partnerName} to show up when you share context. This remains
            private until you choose to share.
          </p>
        </div>
        <StatusPill tone="muted" className="shrink-0 uppercase tracking-wide">
          Private to you
        </StatusPill>
      </div>

      <div className="mt-6 flex gap-6 border-b border-border" role="tablist" aria-label="Support preference contexts">
        {CONTEXTS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeContext === value}
            onClick={() => setActiveContext(value)}
            className={`min-h-[44px] border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              activeContext === value
                ? "border-[color:var(--accent-rose)] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-border bg-bg-surface p-5 sm:p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[color:var(--accent-rose)]">
          How would you prefer help?
        </p>
        <div className="flex flex-wrap gap-2">
          {SUPPORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={preferredSupports.includes(option.value)}
              onClick={() => setPreferredSupports((current) => toggleValue(current, option.value))}
              className={`min-h-[36px] rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                preferredSupports.includes(option.value)
                  ? "border-[color:var(--accent-rose)] bg-[color:var(--accent-rose)]/15 text-[color:var(--accent-rose)]"
                  : "border-border bg-bg-elevated text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <label htmlFor="support-additional-context" className="mb-2 block text-sm font-semibold text-foreground">
            Add your own context (optional)
          </label>
          <textarea
            id="support-additional-context"
            value={additionalContext}
            onChange={(event) => setAdditionalContext(event.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-border bg-bg-elevated p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
          />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            What tends not to help?
          </p>
          <div className="flex flex-wrap gap-2">
            {BARRIER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={whatDoesNotHelp.includes(option.value)}
                onClick={() => setWhatDoesNotHelp((current) => toggleValue(current, option.value))}
                className={`min-h-[36px] rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  whatDoesNotHelp.includes(option.value)
                    ? "border-[color:var(--accent-sage)] bg-[color:var(--accent-sage-soft)] text-[color:var(--accent-sage)]"
                    : "border-border bg-bg-elevated text-muted-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {activePreference?.isShared ? `Currently shared with ${partnerName}.` : "Changes save when you continue."}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={persist} loading={saving}>
            Save
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMode("manage")}>
            Manage sharing
          </Button>
          <Button variant="cta" size="sm" onClick={() => setMode("preview")}>
            Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
