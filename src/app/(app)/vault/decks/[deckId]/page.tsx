"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createSpark } from "@/services/vault/data";
import { DECK_PROMPTS } from "@/features/vault/deck-prompts";
import {
  VAULT_TEXTAREA_CLASSES,
  VaultBackLink,
  VaultButton,
  VaultCard,
  VaultHeader,
  VaultPill,
  VaultRoom,
} from "@/components/vault/primitives";
import { cn } from "@/utils/cn";
import { VAULT_DECKS, type DeckInterestLevel, type VaultDeckId } from "@/types/vault";
import GiveAndReceivePage from "./give-receive-view";

const INTEREST_LEVELS: { value: DeckInterestLevel; label: string }[] = [
  { value: "into_this", label: "I'm into this" },
  { value: "curious", label: "I'm curious" },
  { value: "maybe_someday", label: "Maybe someday" },
  { value: "not_for_me", label: "Not for me" },
];

function isVaultDeckId(value: string): value is VaultDeckId {
  return VAULT_DECKS.some((deck) => deck.id === value);
}

export default function DeckPromptPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  if (!isVaultDeckId(deckId)) notFound();

  if (deckId === "give_receive") {
    return <GiveAndReceivePage />;
  }

  return <GenericDeckPromptFlow deckId={deckId} />;
}

function GenericDeckPromptFlow({ deckId }: { deckId: Exclude<VaultDeckId, "give_receive"> }) {
  const deck = VAULT_DECKS.find((item) => item.id === deckId)!;
  const prompts = DECK_PROMPTS[deckId];

  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [interest, setInterest] = useState<DeckInterestLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSparkId, setSavedSparkId] = useState<string | null>(null);

  const prompt = prompts[index];
  const done = index >= prompts.length;

  async function handleNext() {
    if (draft.trim()) {
      setSaving(true);
      setError(null);
      try {
        const spark = await createSpark({
          heatLevel: "warm",
          content: draft.trim(),
          deckId,
          deckPromptId: prompt.id,
          deckInterestLevel: interest,
        });
        setSavedSparkId(spark.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save this answer");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setDraft("");
    setInterest(null);
    setIndex((current) => current + 1);
  }

  if (done) {
    return (
      <VaultRoom>
        <VaultBackLink href="/vault/decks" label="Back to Decks" />
        <VaultCard className="mx-auto max-w-lg space-y-4 text-center">
          <p className="font-display text-2xl italic text-[var(--vault-text-primary)]">That&apos;s the whole deck</p>
          <p className="text-sm text-[var(--vault-text-secondary)]">
            Anything you answered was saved privately to your Vault as a new Spark.
          </p>
          <div className="flex justify-center gap-3">
            {savedSparkId && (
              <Link href={`/vault/${savedSparkId}`}>
                <VaultButton variant="secondary">View last Spark</VaultButton>
              </Link>
            )}
            <Link href="/vault">
              <VaultButton variant="cta">Go to your Vault</VaultButton>
            </Link>
          </div>
        </VaultCard>
      </VaultRoom>
    );
  }

  return (
    <VaultRoom>
      <VaultBackLink href="/vault/decks" label="Back to Decks" />
      <VaultHeader
        eyebrow={deck.name}
        title={`${deck.name} Deck`}
        subtitle="Let your imagination drift. Take a private moment to reflect."
        pill={
          <VaultPill tone="purple">
            Prompt {index + 1} of {prompts.length}
          </VaultPill>
        }
      />

      <VaultCard className="mx-auto max-w-2xl space-y-8 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--vault-accent-rose)]">
            The {deck.name} prompt
          </p>
          <p className="mt-3 font-display text-2xl italic leading-snug text-[var(--vault-text-primary)] sm:text-3xl">
            {prompt.text}
          </p>
        </div>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write your private thoughts here... Only you can see this until you choose to tease or reveal."
          rows={5}
          className={cn(VAULT_TEXTAREA_CLASSES, "text-left")}
        />

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--vault-text-muted)]">
            How do you rate this interest?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {INTEREST_LEVELS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setInterest(option.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  interest === option.value
                    ? "border-[var(--vault-accent-rose)] bg-[var(--vault-accent-rose-tint)] text-[var(--vault-accent-rose)]"
                    : "border-[var(--vault-border-surface)] bg-[var(--vault-bg-sidebar)] text-[var(--vault-text-secondary)]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="mb-1 text-xs text-[var(--vault-text-muted)]">Progress</p>
            <div className="h-1 w-full max-w-[120px] rounded-full bg-[var(--vault-border-surface)]">
              <div
                className="h-1 rounded-full bg-[var(--vault-accent-rose)]"
                style={{ width: `${((index + 1) / prompts.length) * 100}%` }}
              />
            </div>
          </div>
          <VaultButton variant="cta" disabled={saving} loading={saving} onClick={handleNext}>
            Next →
          </VaultButton>
        </div>
      </VaultCard>
    </VaultRoom>
  );
}
