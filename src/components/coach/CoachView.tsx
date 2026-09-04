"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, MessageCircleHeart, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { Textarea } from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CoachContextPanel } from "@/components/coach/CoachContextPanel";
import { CoachEntryTileButton } from "@/components/coach/CoachEntryTileButton";
import {
  COACH_ENTRY_TILES,
  FOLLOW_UP_SUGGESTIONS,
  PROMPT_SUGGESTIONS,
  SAMPLE_REPLY,
  type CoachEntryTile,
  type CoachSampleReply,
} from "@/components/coach/coach.constants";

// Flip this to true locally to preview the error banner below. There is no
// real failure path yet — this screen has no live backend call to fail.
const SIMULATE_ERROR = false;

type CoachStatus = "start" | "loading" | "answered" | "error";

interface CoachTurn {
  question: string;
  reply: CoachSampleReply;
}

export default function CoachView() {
  const router = useRouter();
  const [status, setStatus] = useState<CoachStatus>("start");
  const [input, setInput] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [turn, setTurn] = useState<CoachTurn | null>(null);

  const submitQuestion = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || status === "loading") return;

    setPendingQuestion(trimmed);
    setInput("");
    setStatus("loading");

    // Simulated latency for the placeholder reply — this is not a real
    // network call.
    // TODO(V1-COACH): replace this timeout with an authenticated call to the
    // Coach service and render its actual response.
    window.setTimeout(() => {
      if (SIMULATE_ERROR) {
        setStatus("error");
        return;
      }
      setTurn({ question: trimmed, reply: SAMPLE_REPLY });
      setStatus("answered");
    }, 750);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitQuestion(input);
  };

  const handleReset = () => {
    setStatus("start");
    setTurn(null);
    setInput("");
    setPendingQuestion("");
  };

  const handleRetry = () => {
    if (pendingQuestion) {
      submitQuestion(pendingQuestion);
    }
  };

  const handleFollowUp = (question: string) => {
    submitQuestion(question);
  };

  const handleTileSelect = (tile: CoachEntryTile) => {
    if (tile.action.type === "link") {
      router.push(tile.action.href);
      return;
    }
    submitQuestion(tile.action.question);
  };

  const handleShareWithPartner = () => {
    if (!turn) return;
    // No cross-route state store here on purpose — Coach and Partner
    // Translation are both placeholder-backed, so the bridge between them
    // stays as simple as possible: a plain query param the destination
    // reads to pre-fill the private insight field. See
    // PartnerTranslationView.tsx.
    router.push(
      `/coach/translate?insight=${encodeURIComponent(turn.reply.fromLogs)}`,
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cta-start">
            Coach
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {status === "start"
              ? "What would you like to understand?"
              : "Your conversation"}
          </h1>
          {status === "start" && (
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Your Coach helps you notice patterns and find ways to share
              what matters.
            </p>
          )}
        </div>

        {status !== "start" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            New Conversation
          </Button>
        )}
      </div>

      {status === "start" && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {COACH_ENTRY_TILES.map((tile) => (
                <CoachEntryTileButton
                  key={tile.id}
                  tile={tile}
                  onSelect={handleTileSelect}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                id="coach-question"
                label="Explore something I've noticed"
                placeholder="e.g. What patterns have you noticed in my sleep?"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((prompt) => (
                  <button
                    key={prompt.question}
                    type="button"
                    onClick={() => submitQuestion(prompt.question)}
                    className="min-h-[44px] rounded-full border border-border bg-bg-surface px-4 text-left text-sm text-foreground transition hover:border-cta-start/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                  >
                    {prompt.question}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="cta" disabled={!input.trim()}>
                  Send Question
                </Button>
              </div>
            </form>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <CoachContextPanel />
          </div>
        </div>
      )}

      {status === "loading" && (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-border bg-bg-surface px-6 py-16">
          <LoadingSpinner size="md" text="Coach is thinking..." />
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="mt-10 flex flex-col gap-3 rounded-2xl border border-error/30 bg-error/10 px-4 py-4 text-sm text-error sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">
                Coach couldn&apos;t load a response.
              </p>
              <p className="mt-1 text-error/90">Try again.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="shrink-0 self-start sm:self-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {status === "answered" && turn && (
        <div className="mt-8 space-y-6">
          <div className="space-y-4" role="log" aria-live="polite">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-accent-rose/30 bg-accent-rose/15 px-4 py-3 text-sm leading-6 text-foreground sm:max-w-[70%]">
                {turn.question}
              </div>
            </div>

            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[70%]">
                <FeaturePlaceholder
                  title="Sample response — not yet connected to a live Coach service"
                  description="This reply is a static placeholder for this UI pass. It isn't personalized and shouldn't be read as real analysis of your logs."
                >
                  <div className="space-y-4">
                    <div>
                      <span className="inline-flex items-center rounded-full bg-accent-sage-soft/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-sage">
                        From your logs
                      </span>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {turn.reply.fromLogs}
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-full bg-bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        General context
                      </span>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {turn.reply.general}
                      </p>
                    </div>
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="cta"
                        size="sm"
                        onClick={handleShareWithPartner}
                      >
                        <MessageCircleHeart
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        Turn this into something I can share with my partner
                      </Button>
                    </div>
                  </div>
                </FeaturePlaceholder>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Suggested follow-ups
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FOLLOW_UP_SUGGESTIONS.map((followUp) => (
                <button
                  key={followUp}
                  type="button"
                  onClick={() => handleFollowUp(followUp)}
                  className="min-h-[44px] rounded-full border border-border bg-bg-surface px-4 text-sm text-foreground transition hover:border-cta-start/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                >
                  {followUp}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
