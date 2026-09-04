"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { SharingGate } from "@/components/ui/SharingGate";
import {
  TRANSLATION_DEFAULT_EXCLUSIONS,
  TRANSLATION_NOT_SENT_DESCRIPTION,
  TRANSLATION_NOT_SENT_TITLE,
} from "@/components/coach/coach.constants";

/**
 * Partner Translation surface (/coach/translate). Lets someone turn a
 * private insight into a partner-facing draft. Like the rest of Coach, this
 * has no backend: composing the draft is harmless local component state,
 * but "Share with your partner" must never claim anything was sent or
 * saved — see handleShare below.
 *
 * The entry point on the Coach conversation view links here via a plain
 * `?insight=` query param (read with useSearchParams, matching the
 * Suspense-wrapped pattern already used on the login page) rather than
 * piping React/router state across routes — simplest option that still
 * lets a reply's "from your logs" sentence show up pre-filled.
 */
export function PartnerTranslationView() {
  const searchParams = useSearchParams();
  const initialInsight = searchParams.get("insight") ?? "";

  const [privateInsight, setPrivateInsight] = useState(initialInsight);
  const [wantThemToKnow, setWantThemToKnow] = useState("");
  const [whatMightHelp, setWhatMightHelp] = useState("");
  const [exclusions, setExclusions] = useState<string[]>(
    TRANSLATION_DEFAULT_EXCLUSIONS,
  );
  const [newExclusion, setNewExclusion] = useState("");
  const [shareAttempted, setShareAttempted] = useState(false);
  const [kept, setKept] = useState(false);

  const removeExclusion = (item: string) => {
    setExclusions((current) => current.filter((entry) => entry !== item));
  };

  const addExclusion = () => {
    const trimmed = newExclusion.trim();
    if (!trimmed || exclusions.includes(trimmed)) return;
    setExclusions((current) => [...current, trimmed]);
    setNewExclusion("");
  };

  const handleShare = () => {
    // TODO(V1-COACH): there is no partner-sharing service yet. Do not
    // replace this with an optimistic "sent" state until one exists.
    setShareAttempted(true);
    setKept(false);
  };

  const handleKeepPrivate = () => {
    setWantThemToKnow("");
    setWhatMightHelp("");
    setExclusions(TRANSLATION_DEFAULT_EXCLUSIONS);
    setShareAttempted(false);
    setKept(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/coach"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Coach
      </Link>

      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-accent-amber">
        Connection tool
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        Partner Translation
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
        Turn a private insight into something you can choose to share. Your
        private note stays on this screen — the draft on the right isn&apos;t
        sent anywhere until a real sharing feature exists.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <Card className="border-2 border-accent-sage/30">
          <CardHeader>
            <CardTitle as="h2" className="font-display text-xl">
              Private Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="private-insight"
              label="Only you see this"
              placeholder="What's actually going on for you right now?"
              value={privateInsight}
              onChange={(event) => setPrivateInsight(event.target.value)}
              rows={8}
            />
          </CardContent>
        </Card>

        <SharingGate label="Translate" />

        <Card className="border-2 border-accent-amber/30">
          <CardHeader>
            <CardTitle as="h2" className="font-display text-xl">
              Partner Translation Draft
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Textarea
              id="translation-want-known"
              label="What I want them to know"
              placeholder="e.g. I've been feeling low-energy this week, not upset with you."
              value={wantThemToKnow}
              onChange={(event) => setWantThemToKnow(event.target.value)}
              rows={3}
            />
            <Textarea
              id="translation-what-helps"
              label="What might help"
              placeholder="e.g. Some extra patience and low-key evenings."
              value={whatMightHelp}
              onChange={(event) => setWhatMightHelp(event.target.value)}
              rows={3}
            />

            <div className="space-y-2">
              <label
                htmlFor="translation-exclusion-input"
                className="block text-sm font-medium text-foreground"
              >
                What I don&apos;t need right now
              </label>
              <div className="flex flex-wrap gap-2">
                {exclusions.map((item) => (
                  <span
                    key={item}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-1 text-sm text-foreground"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeExclusion(item)}
                      aria-label={`Remove "${item}"`}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-muted-foreground transition hover:text-cta-start focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  id="translation-exclusion-input"
                  type="text"
                  value={newExclusion}
                  onChange={(event) => setNewExclusion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addExclusion();
                    }
                  }}
                  placeholder="Add something else, e.g. Questions right now"
                  className="input flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addExclusion}
                  disabled={!newExclusion.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleKeepPrivate}>
                Keep private
              </Button>
              <Button type="button" variant="cta" onClick={handleShare}>
                Share with your partner
              </Button>
            </div>

            {kept && (
              <p role="status" className="text-sm text-muted-foreground">
                Draft cleared. Nothing was shared or saved.
              </p>
            )}

            {shareAttempted && (
              <FeaturePlaceholder
                title={TRANSLATION_NOT_SENT_TITLE}
                description={TRANSLATION_NOT_SENT_DESCRIPTION}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
