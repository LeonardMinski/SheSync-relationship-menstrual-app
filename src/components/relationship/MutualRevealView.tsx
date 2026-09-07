"use client";

import { useEffect, useState } from "react";
import { Compass, Heart, MessageCircle, ShieldCheck, Sparkles, Clock } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAuth } from "@/context/AuthContext";
import { MUTUAL_REVEAL_CATEGORIES, MUTUAL_REVEAL_CATEGORY_LABELS } from "@/features/relationship/prompts";
import { useRelationshipSession } from "@/hooks/useRelationshipSession";
import { saveRelationshipMemory } from "@/services/relationship/memory";
import type { RevealCategory } from "@/types/relationship";

const CATEGORY_ICONS: Record<RevealCategory, typeof Heart> = {
  affection: Heart,
  future: Compass,
  communication: MessageCircle,
  quality_time: Clock,
  intimacy: Sparkles,
  support: ShieldCheck,
};

export function MutualRevealView({ partnerName }: { partnerName: string }) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<RevealCategory | null>(null);
  const { session, answers, loading, actionLoading, error, start, answer, markReady, reveal, loadLatest } =
    useRelationshipSession("mutual_reveal");
  const [draft, setDraft] = useState("");
  const [savedMemory, setSavedMemory] = useState(false);

  useEffect(() => {
    if (selectedCategory) void loadLatest(selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const ownAnswer = session && user ? answers.find((a) => a.answererId === user.id) : undefined;
  const partnerAnswer = session && user ? answers.find((a) => a.answererId !== user.id) : undefined;
  const isRevealed = Boolean(session?.revealedAt);
  const bothReady = Boolean(session?.ownReadyAt && session?.partnerReadyAt);
  const isOwnReady = Boolean(session?.ownReadyAt);

  useEffect(() => {
    setDraft(ownAnswer?.answerText ?? "");
  }, [ownAnswer?.answerText]);

  if (!selectedCategory) {
    return (
      <div>
        <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">Mutual Reveal</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Choose a prompt to explore together. Your answers stay fully hidden until you both write
          yours.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MUTUAL_REVEAL_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className="rounded-[1.5rem] border border-border bg-bg-surface p-5 text-left transition-colors hover:border-[color:var(--accent-amber)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
              >
                <div className="flex items-center justify-between">
                  <StatusPill tone="amber" className="uppercase tracking-wide">
                    {MUTUAL_REVEAL_CATEGORY_LABELS[category]}
                  </StatusPill>
                  <Icon className="h-4 w-4 text-[color:var(--accent-amber)]" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">No answers shared yet</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (!session) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-bg-surface p-8 text-center">
        <StatusPill tone="amber" className="uppercase tracking-wide">
          {MUTUAL_REVEAL_CATEGORY_LABELS[selectedCategory]}
        </StatusPill>
        <Button
          variant="cta"
          className="mt-5"
          onClick={() => void start(selectedCategory)}
          loading={actionLoading}
        >
          Begin this reflection
        </Button>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={() => setSelectedCategory(null)}>
            Choose a different category
          </Button>
        </div>
      </div>
    );
  }

  const prompt = session.prompts[0];

  if (isRevealed) {
    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">Mutual Reveal</h1>
          <div className="flex items-center gap-2">
            <StatusPill tone="amber" className="uppercase tracking-wide">
              {MUTUAL_REVEAL_CATEGORY_LABELS[selectedCategory]}
            </StatusPill>
            {!savedMemory && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await saveRelationshipMemory({
                    sourceType: "mutual_reveal",
                    sourceId: session.id,
                    title: MUTUAL_REVEAL_CATEGORY_LABELS[selectedCategory],
                    content: prompt.text,
                  });
                  setSavedMemory(true);
                }}
              >
                Save to relationship memory
              </Button>
            )}
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-bg-elevated p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-amber)]">Active prompt</p>
          <p className="mt-2 font-display text-xl italic text-foreground">&quot;{prompt.text}&quot;</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AnswerCard label="You" text={ownAnswer?.answerText} />
          <AnswerCard label={partnerName} text={partnerAnswer?.answerText} />
        </div>
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={() => setSelectedCategory(null)}>
            Try another prompt
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">Mutual Reveal</h1>
      <div className="mt-4 rounded-2xl border border-border bg-bg-elevated p-5">
        <StatusPill tone="amber" className="uppercase tracking-wide">
          {MUTUAL_REVEAL_CATEGORY_LABELS[selectedCategory]}
        </StatusPill>
        <p className="mt-3 font-display text-xl italic text-foreground">&quot;{prompt.text}&quot;</p>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => draft.trim() && void answer(prompt.key, draft.trim())}
          disabled={isOwnReady}
          rows={3}
          maxLength={2000}
          placeholder="Your private answer..."
          className="mt-3 w-full rounded-lg border border-border bg-bg-surface p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start disabled:opacity-70"
        />
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!isOwnReady ? (
          <Button variant="secondary" onClick={() => void markReady()} loading={actionLoading} disabled={!draft.trim()}>
            Mark myself ready
          </Button>
        ) : bothReady ? (
          <Button
            variant="cta"
            className="![background:var(--accent-purple)] text-white"
            onClick={() => void reveal()}
            loading={actionLoading}
          >
            Reveal Together
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Waiting on {partnerName} to answer.</p>
        )}
      </div>
    </div>
  );
}

function AnswerCard({ label, text }: { label: string; text?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground">&quot;{text ?? "—"}&quot;</p>
    </div>
  );
}
