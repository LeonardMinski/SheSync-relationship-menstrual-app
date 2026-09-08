"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";

type RevealStage = "waiting" | "ready" | "revealed";

/**
 * A small, local-state-only preview of what an "answer together" flow
 * could look like inside Explore's UI-only prompt cards: both partners
 * answer the same prompt, then reveal together. There is no real
 * shared-answer backend behind this yet — clicking through the stages
 * below only demonstrates the visual states for this session.
 *
 * Deliberately NOT named "Mutual Reveal" in any user-facing copy: that
 * name is already the real, relationship_sessions-backed feature at
 * /connect/mutual-reveal (see MutualRevealView.tsx). Reusing the same
 * product name for this simulated preview would let a real feature and a
 * fake one answer to the same name.
 */
export function AnswerTogetherPreview({
  yourAnswer,
  onClose,
}: {
  yourAnswer: string;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<RevealStage>("waiting");

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-bg-elevated p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[color:var(--accent-rose)]" aria-hidden="true" />
        <h3 className="font-display text-lg font-semibold text-foreground">Answer Together — Preview</h3>
      </div>

      {stage === "waiting" && (
        <EmptyState
          title="Waiting for your partner"
          description="Your answer is saved for this preview. Once your partner answers too, you could reveal both responses together."
          action={
            <Button variant="secondary" onClick={() => setStage("ready")}>
              Simulate: partner has answered
            </Button>
          }
        />
      )}

      {stage === "ready" && (
        <div className="space-y-3 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            Both Answers Submitted!
          </p>
          <p className="text-sm text-muted-foreground">
            You can reveal both responses to each other now, whenever you&apos;re ready.
          </p>
          <Button variant="cta" onClick={() => setStage("revealed")}>
            Reveal answers
          </Button>
        </div>
      )}

      {stage === "revealed" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your answer
            </p>
            <p className="mt-2 text-sm text-foreground">{yourAnswer || "(no answer written)"}</p>
          </div>
          <div className="rounded-xl border border-border bg-bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Partner&apos;s answer
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              This is a placeholder for what your partner&apos;s answer would look like once this
              is wired up for real.
            </p>
          </div>
        </div>
      )}

      <FeaturePlaceholder
        title="This is a preview, not real partner synchronization"
        description="This isn't connected to a real shared-answer backend yet. Nothing here is sent to or received from an actual partner — the states above are simulated for this session only."
      />

      <Button variant="ghost" onClick={onClose}>
        Close preview
      </Button>
    </div>
  );
}
