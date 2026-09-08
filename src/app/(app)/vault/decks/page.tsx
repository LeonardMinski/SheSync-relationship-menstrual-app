"use client";

import Link from "next/link";

import { VaultBackLink, VaultButton, VaultCard, VaultHeader, VaultPill, VaultRoom } from "@/components/vault/primitives";
import { VAULT_DECKS } from "@/types/vault";

export default function DesireDecksPage() {
  return (
    <VaultRoom>
      <VaultBackLink href="/vault" label="Back to Vault" />
      <VaultHeader
        eyebrow="Desire Decks"
        title="Desire Decks"
        subtitle="Thoughtful prompts for exploring what you want, together. Select a path."
        pill={<VaultPill tone="purple">{VAULT_DECKS.length} Decks Loaded</VaultPill>}
        actions={
          <Link href="/vault/for-tonight">
            <VaultButton variant="secondary">For Tonight</VaultButton>
          </Link>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {VAULT_DECKS.map((deck) => (
          <Link key={deck.id} href={`/vault/decks/${deck.id}`}>
            <VaultCard className="flex h-full flex-col gap-4 transition-colors hover:border-[var(--vault-accent-rose)]">
              <div className="flex items-start justify-between gap-3">
                <p className="font-instrument text-3xl italic text-[var(--vault-text-primary)]">{deck.name}</p>
                <VaultPill tone="purple" className="shrink-0 px-2.5 py-0.5 text-[10px]">
                  Premium
                </VaultPill>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-[var(--vault-text-secondary)]">{deck.description}</p>
              <div className="h-0.5 w-10 bg-[var(--vault-accent-rose)]" />
            </VaultCard>
          </Link>
        ))}
      </div>
    </VaultRoom>
  );
}
