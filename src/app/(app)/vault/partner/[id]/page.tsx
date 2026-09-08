"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircleHeart } from "lucide-react";

import {
  getPartnerVaultSummary,
  getRevealedSpark,
  markSparkReady,
  reactToRevealedSpark,
  respondToTease,
  revealSparkTogether,
} from "@/services/vault/data";
import {
  VaultBackLink,
  VaultButton,
  VaultCard,
  VaultHeader,
  VaultPill,
  VaultRoom,
} from "@/components/vault/primitives";
import type { RevealReaction, TeaseResponse, VaultPartnerSparkSummary, VaultRevealedSpark } from "@/types/vault";

const TEASE_RESPONSES: { value: TeaseResponse; label: string; primary?: boolean }[] = [
  { value: "curious", label: "I'm curious", primary: true },
  { value: "maybe_later", label: "Maybe later" },
  { value: "not_tonight", label: "Not tonight" },
  { value: "not_for_me", label: "Not for me" },
];

const REVEAL_REACTIONS: { value: RevealReaction; label: string }[] = [
  { value: "love_this", label: "I love this" },
  { value: "curious", label: "I'm curious" },
  { value: "lets_talk_first", label: "Let's talk first" },
  { value: "not_tonight", label: "Not tonight" },
  { value: "not_for_me", label: "Not for me" },
];

export default function PartnerSparkResponsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [summary, setSummary] = useState<VaultPartnerSparkSummary | null>(null);
  const [revealed, setRevealed] = useState<VaultRevealedSpark | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await getPartnerVaultSummary();
    const spark = list.find((item) => item.id === id) ?? null;
    setSummary(spark);
    if (spark?.status === "revealed") {
      setRevealed(await getRevealedSpark(id));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!summary || summary.status !== "ready_to_reveal") return;
    const interval = setInterval(() => void load(), 4000);
    return () => clearInterval(interval);
  }, [summary, load]);

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <VaultRoom>
      <VaultBackLink href="/vault/partner" label="Back to their Vault" />
      <VaultHeader eyebrow="Tease From Them" title="A Spark shared with you" pill={<VaultPill tone="purple">Not Revealed Yet</VaultPill>} />

      {loading && <p className="text-sm text-[var(--vault-text-muted)]">Loading...</p>}
      {!loading && !summary && <p className="text-sm text-[var(--vault-text-muted)]">This Spark isn&apos;t available.</p>}

      {summary && summary.status === "teased" && (
        <VaultCard className="mx-auto max-w-2xl space-y-6 text-center">
          <VaultCard padding="md">
            <p className="font-display text-2xl italic leading-relaxed text-[var(--vault-text-primary)]">
              {summary.teaseText}
            </p>
          </VaultCard>
          <p className="text-sm text-[var(--vault-text-secondary)]">How do you feel about exploring this?</p>
          {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}
          <div className="flex flex-wrap justify-center gap-3">
            {TEASE_RESPONSES.map((option) => (
              <VaultButton
                key={option.value}
                variant={option.primary ? "cta" : "secondary"}
                disabled={pending}
                onClick={() => run(() => respondToTease(id, option.value))}
              >
                {option.label}
              </VaultButton>
            ))}
          </div>
        </VaultCard>
      )}

      {summary && summary.status === "waiting" && (
        <VaultCard className="mx-auto max-w-xl space-y-4 text-center">
          <p className="font-display text-2xl italic text-[var(--vault-text-primary)]">You&apos;re curious</p>
          <p className="text-sm text-[var(--vault-text-secondary)]">
            They know you&apos;re curious. They&apos;ll decide when to reveal the full Spark.
          </p>
        </VaultCard>
      )}

      {summary && summary.status === "ready_to_reveal" && (
        <VaultCard className="mx-auto max-w-xl space-y-8 text-center">
          <p className="font-display text-3xl italic text-[var(--vault-text-primary)]">Ready to open this together?</p>
          <VaultCard padding="md" className="mx-auto flex max-w-md items-center justify-center gap-10">
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2
                className={`h-8 w-8 ${summary.partnerReadyAt ? "text-[var(--vault-accent-sage)]" : "text-[var(--vault-text-muted)]"}`}
                aria-hidden="true"
              />
              <p className="text-sm">You: {summary.partnerReadyAt ? "Ready ✓" : "Waiting..."}</p>
            </div>
            <div className="h-px w-16 bg-[var(--vault-border-surface)]" />
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2
                className={`h-8 w-8 ${summary.ownerReadyAt ? "text-[var(--vault-accent-sage)]" : "text-[var(--vault-text-muted)]"}`}
                aria-hidden="true"
              />
              <p className="text-sm">Them: {summary.ownerReadyAt ? "Ready ✓" : "Waiting..."}</p>
            </div>
          </VaultCard>
          {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}
          {summary.ownerReadyAt && summary.partnerReadyAt ? (
            <VaultButton variant="cta" disabled={pending} onClick={() => run(() => revealSparkTogether(id))}>
              Reveal together
            </VaultButton>
          ) : !summary.partnerReadyAt ? (
            <VaultButton variant="cta" disabled={pending} onClick={() => run(() => markSparkReady(id))}>
              I&apos;m ready
            </VaultButton>
          ) : (
            <p className="text-sm text-[var(--vault-text-muted)]">Waiting for them to be ready.</p>
          )}
        </VaultCard>
      )}

      {summary && summary.status === "revealed" && revealed && (
        <VaultCard className="mx-auto max-w-2xl space-y-8 text-center">
          <VaultPill tone="rose">Revealed</VaultPill>
          <p className="whitespace-pre-wrap font-display text-2xl italic leading-relaxed text-[var(--vault-text-primary)]">
            {revealed.content}
          </p>
          <div className="h-px bg-[var(--vault-border-surface)]" />
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--vault-text-muted)]">
              How do you feel about this tonight?
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {REVEAL_REACTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => reactToRevealedSpark(id, option.value))}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    revealed.partnerReaction === option.value
                      ? "border-[var(--vault-accent-rose)] bg-[var(--vault-accent-rose-tint)] text-[var(--vault-accent-rose)]"
                      : "border-[var(--vault-border-surface)] bg-[var(--vault-bg-sidebar)] text-[var(--vault-text-secondary)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}
          <Link href={`/vault/${id}/talk`}>
            <VaultButton variant="cta" className="mx-auto">
              <MessageCircleHeart className="h-4 w-4" aria-hidden="true" />
              Talk about this →
            </VaultButton>
          </Link>
        </VaultCard>
      )}
    </VaultRoom>
  );
}
