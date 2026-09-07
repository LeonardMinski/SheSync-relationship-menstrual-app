"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAuth } from "@/context/AuthContext";
import { useRelationshipSession } from "@/hooks/useRelationshipSession";
import { saveRelationshipMemory } from "@/services/relationship/memory";

/**
 * Deliberately no biological/physiological framing here — conflict is
 * treated as a relationship-communication moment, not a symptom to
 * diagnose. See RULE (Phase 19) for what this replaces.
 */
export function RepairSpaceView({ partnerName }: { partnerName: string }) {
  const { user } = useAuth();
  const { session, answers, loading, actionLoading, error, start, answer, markReady, reveal } =
    useRelationshipSession("repair");
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
        <h1 className="font-display text-2xl italic text-foreground">Repair Space</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Take a few private moments to gather your thoughts before reconnecting. This is not
          therapy — just a structured way to slow down before you talk.
        </p>
        <Button variant="cta" className="mt-5" onClick={() => void start()} loading={actionLoading}>
          Start a repair reflection
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
              Repair Space · Both Revealed
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Two safe, quiet reflections side-by-side. Read slowly and give each other room to
              breathe.
            </p>
          </div>
          {!savedMemory && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await saveRelationshipMemory({
                  sourceType: "repair",
                  sourceId: session.id,
                  title: "Repair reflection",
                  content: session.prompts.map((p) => p.text).join(" / "),
                });
                setSavedMemory(true);
              }}
            >
              Save what we learned
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
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl italic text-foreground sm:text-3xl">Repair Space</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Take a few private moments to gather your thoughts before reconnecting. Nothing is
            shared with {partnerName} until you both choose to reveal.
          </p>
        </div>
        <StatusPill tone="muted" className="shrink-0 uppercase tracking-wide">
          Private to you
        </StatusPill>
      </div>

      <div className="mt-6 space-y-4">
        {session.prompts.map((prompt, index) => (
          <div key={prompt.key} className="rounded-[1.5rem] border border-border bg-bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--accent-rose)]">
              {index + 1}. {prompt.text}
            </p>
            <textarea
              aria-label={`Your answer to: ${prompt.text}`}
              value={drafts[prompt.key] ?? ""}
              onChange={(event) => setDrafts((current) => ({ ...current, [prompt.key]: event.target.value }))}
              onBlur={() => {
                const text = drafts[prompt.key]?.trim();
                if (text) void answer(prompt.key, text);
              }}
              disabled={isOwnReady}
              rows={3}
              maxLength={2000}
              placeholder="Take your time..."
              className="mt-3 w-full rounded-lg border border-border bg-bg-elevated p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cta-start disabled:opacity-70"
            />
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isOwnReady
            ? bothReady
              ? `${partnerName} has completed their reflection.`
              : `Waiting on ${partnerName} to finish their reflection.`
            : ""}
        </p>
        {!isOwnReady ? (
          <Button
            variant="secondary"
            onClick={() => void markReady()}
            loading={actionLoading}
            disabled={session.prompts.some((p) => !drafts[p.key]?.trim())}
          >
            Ready to Reveal
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
        ) : null}
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
