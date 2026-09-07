"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAuth } from "@/context/AuthContext";
import { useRelationshipSession } from "@/hooks/useRelationshipSession";
import { saveRelationshipMemory } from "@/services/relationship/memory";

export function WeeklyUsView({ partnerName }: { partnerName: string }) {
  const { user } = useAuth();
  const { session, answers, loading, actionLoading, error, start, answer, markReady, reveal } =
    useRelationshipSession("weekly_us");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedMemory, setSavedMemory] = useState(false);

  const ownAnswers = session && user ? answers.filter((a) => a.answererId === user.id) : [];
  const partnerAnswers = session && user ? answers.filter((a) => a.answererId !== user.id) : [];
  const isRevealed = Boolean(session?.revealedAt);
  const bothReady = Boolean(session?.ownReadyAt && session?.partnerReadyAt);
  const isOwnReady = Boolean(session?.ownReadyAt);

  useEffect(() => {
    if (!session) return;
    const next: Record<string, string> = {};
    for (const prompt of session.prompts) {
      next[prompt.key] = ownAnswers.find((a) => a.promptKey === prompt.key)?.answerText ?? "";
    }
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, answers.length]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (!session) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-bg-surface p-8 text-center">
        <h1 className="font-display text-2xl italic text-foreground">Weekly Us</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reflect on the week together. Your answers stay private until you&apos;re both ready to
          reveal.
        </p>
        <Button
          variant="cta"
          className="mt-5"
          onClick={() => void start()}
          loading={actionLoading}
        >
          Start this week&apos;s reflection
        </Button>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
      </div>
    );
  }

  if (isRevealed) {
    return (
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">
              Weekly Us · This Week
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Two voices, one conversation. Shared and saved into your private context.
            </p>
          </div>
          {!savedMemory && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await saveRelationshipMemory({
                  sourceType: "weekly_us",
                  sourceId: session.id,
                  title: "Weekly Us",
                  content: session.prompts.map((p) => p.text).join(" / "),
                });
                setSavedMemory(true);
              }}
            >
              Save to relationship memory
            </Button>
          )}
          {savedMemory && <StatusPill tone="sage">Saved</StatusPill>}
        </div>

        <div className="mt-6 space-y-6">
          {session.prompts.map((prompt) => (
            <div key={prompt.key}>
              <h2 className="font-display text-lg italic text-foreground">{prompt.text}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <AnswerCard label="You" text={ownAnswers.find((a) => a.promptKey === prompt.key)?.answerText} />
                <AnswerCard
                  label={partnerName}
                  text={partnerAnswers.find((a) => a.promptKey === prompt.key)?.answerText}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">Weekly Us</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Reflect on the week together. Your answers stay private until you&apos;re both ready to
              reveal.
            </p>
          </div>
          {isOwnReady && <StatusPill tone="sage">You answered</StatusPill>}
        </div>

        <div className="mt-6 space-y-4">
          {session.prompts.map((prompt) => (
            <div key={prompt.key} className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
              <h2 className="font-display text-lg italic text-foreground">{prompt.text}</h2>
              <textarea
                value={drafts[prompt.key] ?? ""}
                onChange={(event) => setDrafts((current) => ({ ...current, [prompt.key]: event.target.value }))}
                onBlur={() => {
                  const text = drafts[prompt.key]?.trim();
                  if (text) void answer(prompt.key, text);
                }}
                disabled={isOwnReady}
                rows={2}
                maxLength={2000}
                placeholder="Your private answer..."
                className="mt-3 w-full rounded-lg border border-border bg-bg-elevated p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start disabled:opacity-70"
              />
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        {!isOwnReady && (
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => void markReady()}
            loading={actionLoading}
            disabled={session.prompts.some((p) => !drafts[p.key]?.trim())}
          >
            Mark myself ready
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-[color:var(--accent-purple)]/30 bg-[color:var(--accent-purple-soft)] p-6 text-center">
        {bothReady ? (
          <>
            <h2 className="font-display text-xl italic text-foreground">Ready to Reveal</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Both you and {partnerName} have completed this week&apos;s reflection.
            </p>
            <Button
              variant="cta"
              className="![background:var(--accent-purple)] mt-4 text-white"
              onClick={() => void reveal()}
              loading={actionLoading}
            >
              Reveal Together
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Your answers stay private until you both explicitly reveal.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl italic text-foreground">Waiting</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isOwnReady
                ? `Waiting on ${partnerName} to finish their reflection.`
                : "Answer each prompt, then mark yourself ready."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function AnswerCard({ label, text }: { label: string; text?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground">{text ?? "—"}</p>
    </div>
  );
}
