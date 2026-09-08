"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { useVaultSpark } from "@/hooks/useVaultSpark";
import { createTease } from "@/services/vault/data";
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

const FRAMEWORKS = [
  { title: "A Hint", body: "Something involving sensory anticipation and cold mornings..." },
  { title: "A Question", body: "If we could spend a full weekend without our phones, how would we start?" },
  { title: "A Clue", body: "A reminder of our cabin trip, but this time with minimal clothing..." },
  { title: "A Challenge", body: "Let's set aside 24 hours of zero digital contact next Saturday." },
];

export default function CreateTeasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { spark, loading } = useVaultSpark(id);
  const [teaseText, setTeaseText] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setSaving(true);
    setError(null);
    try {
      await createTease(id, teaseText.trim());
      router.push(`/vault/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create this tease");
      setSaving(false);
    }
  }

  return (
    <VaultRoom>
      <VaultBackLink href={`/vault/${id}`} label="Back to Spark" />
      <VaultHeader
        eyebrow="Create a Tease"
        title={previewing ? "Tease Preview" : "Give them just enough to wonder"}
        subtitle={
          previewing
            ? "Review how this will look before you send it."
            : "Invite discovery on your terms."
        }
        pill={<VaultPill tone="purple">Vault Secured</VaultPill>}
      />

      {loading && <p className="text-sm text-[var(--vault-text-muted)]">Loading...</p>}

      {!loading && spark && !previewing && (
        <div className="grid gap-6 lg:grid-cols-2">
          <VaultCard className="space-y-4">
            <div className="flex items-center justify-between">
              <VaultSectionLabel>Original Spark (private to you)</VaultSectionLabel>
              <VaultPill tone="purple" className="px-2.5 py-0.5 text-[10px]">
                Confidential
              </VaultPill>
            </div>
            <div className="relative rounded-xl border border-[var(--vault-border-surface)] bg-[var(--vault-bg-deep)] p-6">
              <p className="select-none font-display text-lg italic text-[var(--vault-text-primary)] opacity-15">
                {spark.content}
              </p>
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[color:var(--vault-bg-elevated)]/80 text-center text-xs text-[var(--vault-text-muted)] backdrop-blur-sm">
                Muted background · Your partner won&apos;t see this
              </div>
            </div>
          </VaultCard>

          <VaultCard className="space-y-4">
            <VaultSectionLabel>Teaser frameworks</VaultSectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {FRAMEWORKS.map((framework) => (
                <button
                  key={framework.title}
                  type="button"
                  onClick={() => setTeaseText(framework.body)}
                  className="rounded-xl border border-[var(--vault-border-surface)] bg-[var(--vault-bg-deep)] p-3 text-left transition-colors hover:border-[var(--vault-accent-rose)]"
                >
                  <p className="font-display text-sm italic text-[var(--vault-accent-rose)]">{framework.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--vault-text-secondary)]">{framework.body}</p>
                </button>
              ))}
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--vault-text-secondary)]">Write your Teaser:</label>
              <textarea
                value={teaseText}
                onChange={(event) => setTeaseText(event.target.value)}
                rows={5}
                className={VAULT_TEXTAREA_CLASSES}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--vault-text-secondary)]">
                {teaseText.trim() ? "Tease ready" : "Write something first"}
              </p>
              <VaultButton variant="cta" disabled={!teaseText.trim()} onClick={() => setPreviewing(true)}>
                Preview tease
              </VaultButton>
            </div>
          </VaultCard>
        </div>
      )}

      {!loading && spark && previewing && (
        <VaultCard className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <VaultSectionLabel tone="rose">They will see (the tease)</VaultSectionLabel>
              <VaultCard padding="md" className="mt-2 space-y-3">
                <p className="font-display text-xl italic text-[var(--vault-text-primary)]">{teaseText}</p>
                <p className="rounded-lg bg-[var(--vault-bg-sidebar)] p-3 text-xs text-[var(--vault-text-secondary)]">
                  Your partner will see this hint and can respond with their curiosity level.
                </p>
              </VaultCard>
            </div>
            <div>
              <VaultSectionLabel>They will not see (private Spark)</VaultSectionLabel>
              <VaultCard padding="md" className="mt-2 space-y-3">
                <div className="relative rounded-lg bg-[var(--vault-bg-sidebar)] p-4">
                  <p className="select-none font-display italic text-[var(--vault-text-muted)] opacity-15">
                    {spark.content}
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-[var(--vault-accent-purple)]" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-center text-xs text-[var(--vault-accent-purple)]">
                  Your full Spark remains private until you choose to reveal it.
                </p>
              </VaultCard>
            </div>
          </div>
          {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}
          <div className="flex justify-end gap-3">
            <VaultButton variant="secondary" onClick={() => setPreviewing(false)}>
              Edit tease
            </VaultButton>
            <VaultButton variant="cta" disabled={saving} loading={saving} onClick={handleShare}>
              Share tease
            </VaultButton>
          </div>
        </VaultCard>
      )}
    </VaultRoom>
  );
}
