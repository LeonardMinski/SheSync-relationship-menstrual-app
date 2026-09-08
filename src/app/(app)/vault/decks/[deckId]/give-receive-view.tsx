"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, HandHeart } from "lucide-react";

import { createSpark, getPartnerVaultSummary, listSparks } from "@/services/vault/data";
import {
  VAULT_TEXTAREA_CLASSES,
  VaultBackLink,
  VaultButton,
  VaultCard,
  VaultHeader,
  VaultPill,
  VaultRoom,
  VaultSectionLabel,
} from "@/components/vault/primitives";
import type { VaultPartnerSparkSummary, VaultSpark } from "@/types/vault";

const STATUS_CAPTION: Record<VaultSpark["status"], string> = {
  private: "Private draft · Keep in Vault",
  teased: "Teased · Waiting on response",
  waiting: "They're curious · Waiting on reveal",
  ready_to_reveal: "Ready to reveal together",
  revealed: "Revealed together",
  archived: "Archived",
};

function DeckItemRow({ label, statusCaption }: { label: string; statusCaption: string }) {
  return (
    <div className="rounded-xl border border-[var(--vault-border-surface)] bg-[var(--vault-bg-deep)] p-4">
      <p className="font-instrument text-lg italic text-[var(--vault-text-primary)]">{label}</p>
      <p className="mt-1 text-xs text-[var(--vault-text-muted)]">{statusCaption}</p>
    </div>
  );
}

export default function GiveAndReceivePage() {
  const [mySparks, setMySparks] = useState<VaultSpark[]>([]);
  const [partnerSparks, setPartnerSparks] = useState<VaultPartnerSparkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState<"give" | "receive" | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [own, partner] = await Promise.all([listSparks(), getPartnerVaultSummary()]);
    setMySparks(own.filter((spark) => spark.deckId === "give_receive"));
    setPartnerSparks(partner);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave() {
    if (!draft.trim() || !composing) return;
    setSaving(true);
    try {
      await createSpark({
        heatLevel: "warm",
        content: draft.trim(),
        deckId: "give_receive",
        deckPromptId: composing,
      });
      setDraft("");
      setComposing(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  const receiveItems = mySparks.filter((spark) => spark.deckPromptId === "receive");
  const giveItems = mySparks.filter((spark) => spark.deckPromptId === "give");
  const partnerOffering = partnerSparks.find((spark) => spark.status !== "private" && spark.status !== "archived");

  return (
    <VaultRoom>
      <VaultBackLink href="/vault/decks" label="Back to Decks" />
      <VaultHeader
        eyebrow="Give & Receive"
        title="Give & Receive"
        subtitle="Explore mutual generosity. Outward intentions meet inward desires."
        pill={<VaultPill tone="purple">Generosity Hub</VaultPill>}
      />

      {!loading && partnerOffering && (
        <VaultCard highlighted className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-instrument text-lg italic text-[var(--vault-text-primary)]">
            A new Spark has been shared — unveil it together.
          </p>
          <Link href={`/vault/partner/${partnerOffering.id}`}>
            <VaultButton variant="outline">Reveal offering</VaultButton>
          </Link>
        </VaultCard>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <VaultCard className="space-y-4">
          <VaultSectionLabel tone="rose">
            <span className="inline-flex items-center gap-1.5">
              <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
              I&apos;d love to receive...
            </span>
          </VaultSectionLabel>
          <div className="space-y-3">
            {receiveItems.map((spark) => (
              <DeckItemRow key={spark.id} label={spark.content} statusCaption={STATUS_CAPTION[spark.status]} />
            ))}
          </div>
          {composing === "receive" ? (
            <div className="space-y-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                className={VAULT_TEXTAREA_CLASSES}
                placeholder="Something I'd love to receive..."
              />
              <div className="flex gap-2">
                <VaultButton variant="cta" disabled={saving || !draft.trim()} loading={saving} onClick={handleSave}>
                  Save
                </VaultButton>
                <VaultButton variant="secondary" onClick={() => setComposing(null)}>
                  Cancel
                </VaultButton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setComposing("receive")}
              className="w-full rounded-xl border border-dashed border-[var(--vault-border)] bg-[var(--vault-bg-deep)] p-4 text-center text-sm text-[var(--vault-text-muted)] transition-colors hover:border-[var(--vault-accent-rose)]"
            >
              + Record another desire to receive
            </button>
          )}
        </VaultCard>

        <VaultCard className="space-y-4">
          <VaultSectionLabel>
            <span className="inline-flex items-center gap-1.5 text-[var(--vault-accent-sage)]">
              <Gift className="h-3.5 w-3.5" aria-hidden="true" />
              I&apos;d love to give...
            </span>
          </VaultSectionLabel>
          <div className="space-y-3">
            {giveItems.map((spark) => (
              <DeckItemRow key={spark.id} label={spark.content} statusCaption={STATUS_CAPTION[spark.status]} />
            ))}
          </div>
          {composing === "give" ? (
            <div className="space-y-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                className={VAULT_TEXTAREA_CLASSES}
                placeholder="Something I'd love to give..."
              />
              <div className="flex gap-2">
                <VaultButton variant="cta" disabled={saving || !draft.trim()} loading={saving} onClick={handleSave}>
                  Save
                </VaultButton>
                <VaultButton variant="secondary" onClick={() => setComposing(null)}>
                  Cancel
                </VaultButton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setComposing("give")}
              className="w-full rounded-xl border border-dashed border-[var(--vault-border)] bg-[var(--vault-bg-deep)] p-4 text-center text-sm text-[var(--vault-text-muted)] transition-colors hover:border-[var(--vault-accent-rose)]"
            >
              + Propose another offering to give
            </button>
          )}
        </VaultCard>
      </div>
    </VaultRoom>
  );
}
