"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  getPartnerContext,
  setPartnerContextStatus,
  upsertPartnerContext,
} from "@/services/relationship/partnerContext";
import type {
  PartnerContext,
  TranslationExclusionChoice,
  TranslationHelpChoice,
} from "@/types/relationship";

const HELP_OPTIONS: { value: TranslationHelpChoice; label: string }[] = [
  { value: "space", label: "Space" },
  { value: "quiet_company", label: "Quiet company" },
  { value: "practical_help", label: "Practical help" },
  { value: "reassurance", label: "Reassurance" },
  { value: "physical_affection", label: "Physical affection" },
];

const EXCLUSION_OPTIONS: { value: TranslationExclusionChoice; label: string }[] = [
  { value: "advice", label: "Advice" },
  { value: "questions_about_it", label: "Questions about it" },
  { value: "trying_to_fix_it", label: "Trying to fix it" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function PartnerTranslationComposer({
  partnerName,
  initialInsight,
}: {
  partnerName: string;
  /** Pre-fills "what I want them to know" only when there's no existing saved draft to overwrite — e.g. handed off from a Coach reply. */
  initialInsight?: string;
}) {
  const [context, setContext] = useState<PartnerContext | null>(null);
  const [whatTheyShouldKnow, setWhatTheyShouldKnow] = useState(initialInsight ?? "");
  const [mightHelp, setMightHelp] = useState<TranslationHelpChoice[]>([]);
  const [dontNeed, setDontNeed] = useState<TranslationExclusionChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getPartnerContext().then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.success && result.data.own) {
        setContext(result.data.own);
        setWhatTheyShouldKnow(result.data.own.whatTheyShouldKnow || initialInsight || "");
        setMightHelp(result.data.own.mightHelp);
        setDontNeed(result.data.own.dontNeed);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await upsertPartnerContext({ whatTheyShouldKnow, mightHelp, dontNeed });
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setContext(result.data.context);
  }

  async function handleShare() {
    await handleSave();
    setSaving(true);
    const result = await setPartnerContextStatus("shared");
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setContext(result.data.context);
  }

  async function handleRevoke() {
    setSaving(true);
    const result = await setPartnerContextStatus("revoked");
    setSaving(false);
    if (result.success) setContext(result.data.context);
  }

  const isShared = context?.status === "shared";

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-[1.5rem] border border-border bg-bg-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">
              Share Context with {partnerName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Translate your internal state into high-level suggestions {partnerName} can act on. Fully
              private until you choose to share.
            </p>
          </div>
          <StatusPill tone={isShared ? "sage" : "muted"} className="shrink-0 uppercase tracking-wide">
            {isShared ? "Shared" : "Private draft"}
          </StatusPill>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-sm text-error" role="alert">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="what-they-should-know" className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              What I want them to know
            </label>
            <textarea
              id="what-they-should-know"
              value={whatTheyShouldKnow}
              onChange={(event) => setWhatTheyShouldKnow(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="I'm having a rough day. Cramps are intense and I'm feeling low energy."
              className="w-full rounded-lg border border-border bg-bg-elevated p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              What might help today
            </p>
            <div className="flex flex-wrap gap-2">
              {HELP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={mightHelp.includes(option.value)}
                  onClick={() => setMightHelp((current) => toggle(current, option.value))}
                  className={`min-h-[36px] rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    mightHelp.includes(option.value)
                      ? "border-[color:var(--accent-rose)] bg-[color:var(--accent-rose)]/15 text-[color:var(--accent-rose)]"
                      : "border-border bg-bg-elevated text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              What I don&apos;t need right now
            </p>
            <div className="flex flex-wrap gap-2">
              {EXCLUSION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={dontNeed.includes(option.value)}
                  onClick={() => setDontNeed((current) => toggle(current, option.value))}
                  className={`min-h-[36px] rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    dontNeed.includes(option.value)
                      ? "border-foreground bg-bg-elevated text-foreground"
                      : "border-border bg-bg-elevated text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            You can modify or {isShared ? "revoke" : "recall"} shared context at any time.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleSave} loading={saving}>
              Save draft
            </Button>
            {isShared ? (
              <Button variant="outline" size="sm" onClick={handleRevoke} loading={saving}>
                Revoke
              </Button>
            ) : (
              <Button variant="cta" size="sm" onClick={handleShare} loading={saving}>
                Share with {partnerName}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-border bg-bg-elevated p-5">
        <StatusPill tone="muted" className="uppercase tracking-wide">
          Live preview for {partnerName}
        </StatusPill>
        <div className="mt-4 rounded-2xl border border-border bg-bg-surface p-4">
          <p className="text-sm italic text-foreground">
            {whatTheyShouldKnow || "Nothing written yet."}
          </p>
          {mightHelp.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">May help today</p>
              <p className="mt-1 text-xs text-foreground">
                {mightHelp.map((v) => HELP_OPTIONS.find((o) => o.value === v)?.label).join(", ")}
              </p>
            </div>
          )}
          {dontNeed.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Tends not to help</p>
              <p className="mt-1 text-xs text-foreground">
                {dontNeed.map((v) => EXCLUSION_OPTIONS.find((o) => o.value === v)?.label).join(", ")}
              </p>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {isShared
            ? `${partnerName} can see this now.`
            : `${partnerName} will only see this once you share it.`}
        </p>
      </div>
    </div>
  );
}
