"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { type DeckPromptMatch, getForTonightMatches } from "@/services/vault/data";
import { VAULT_DECKS } from "@/types/vault";
import { VaultBackLink, VaultButton, VaultHeader, VaultPill, VaultRoom } from "@/components/vault/primitives";

export default function ForTonightPage() {
  const [matches, setMatches] = useState<DeckPromptMatch[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getForTonightMatches().then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const match = matches[index];
  const deck = match ? VAULT_DECKS.find((item) => item.id === match.deckId) : null;

  return (
    <VaultRoom>
      <VaultBackLink href="/vault/decks" label="Back to Decks" />
      <VaultHeader
        eyebrow="For Tonight"
        title="For Tonight"
        subtitle="Surfacing your mutual connection. Atmospheric and completely free of pressure."
        pill={<VaultPill tone="rose">Cinematic Session</VaultPill>}
      />

      {loading && <p className="text-sm text-[var(--vault-text-muted)]">Loading...</p>}

      {!loading && matches.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[var(--vault-border-surface)] bg-[var(--vault-bg-elevated)] p-16 text-center">
          <p className="font-instrument text-xl italic text-[var(--vault-text-primary)]">Nothing to spotlight yet</p>
          <p className="mt-2 text-sm text-[var(--vault-text-secondary)]">
            Answer some Desire Deck prompts — when you and your partner independently choose the same thing, it
            shows up here.
          </p>
          <Link href="/vault/decks" className="mt-4 inline-block">
            <VaultButton variant="cta">Explore Desire Decks</VaultButton>
          </Link>
        </div>
      )}

      {!loading && match && (
        <div
          className="rounded-3xl border border-[var(--vault-accent-rose)] p-10 text-center sm:p-16"
          style={{
            background:
              "radial-gradient(circle at center, rgba(59,24,46,1) 0%, rgba(28,16,27,1) 100%)",
          }}
        >
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--vault-accent-rose)] bg-[var(--vault-accent-rose-tint)] px-4 py-1.5 text-xs font-semibold text-[var(--vault-accent-rose)]">
            Something you both chose
          </p>
          <p className="mx-auto mt-6 max-w-2xl font-instrument text-3xl italic leading-relaxed text-[var(--vault-text-primary)] sm:text-4xl">
            You and your partner are both drawn to something from the {deck?.name ?? "Desire"} deck.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--vault-text-secondary)]">
            Neither of you has seen what the other wrote. Open your own Spark to decide how — or whether — to
            share it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href={`/vault/${match.sparkId}`}>
              <VaultButton variant="cta">Keep this for tonight</VaultButton>
            </Link>
            {matches.length > 1 && (
              <button
                type="button"
                onClick={() => setIndex((current) => (current + 1) % matches.length)}
                className="text-sm text-[var(--vault-text-secondary)] underline"
              >
                Choose something else
              </button>
            )}
          </div>
        </div>
      )}
    </VaultRoom>
  );
}
