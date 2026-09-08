"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { getAfterglowReflections, saveAfterglowReflection } from "@/services/vault/data";
import {
  VAULT_TEXTAREA_CLASSES,
  VaultBackLink,
  VaultButton,
  VaultCard,
  VaultHeader,
  VaultRoom,
} from "@/components/vault/primitives";
import { cn } from "@/utils/cn";
import type { AfterglowReaction, VaultAfterglowReflection } from "@/types/vault";

const REACTIONS: { value: AfterglowReaction; emoji: string; label: string; helper: string }[] = [
  { value: "loved_it", emoji: "❤️", label: "Loved it", helper: "Definitely do it again" },
  { value: "liked_it", emoji: "✨", label: "Liked it", helper: "A positive experience" },
  { value: "not_sure", emoji: "🤔", label: "Not sure", helper: "Need to process or tweak" },
  { value: "not_for_me", emoji: "🙅", label: "Not for me", helper: "Glad we tried, but no" },
];

export default function VaultAfterglowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [reaction, setReaction] = useState<AfterglowReaction | null>(null);
  const [note, setNote] = useState("");
  const [reflections, setReflections] = useState<VaultAfterglowReflection[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getAfterglowReflections(id).then((data) => {
      setReflections(data);
      const own = data.find((reflection) => reflection.authorId === user?.id);
      if (own) {
        setReaction(own.reaction);
        setNote(own.note ?? "");
        setSaved(true);
      }
    });
  }, [id, user?.id]);

  async function handleSave() {
    if (!reaction) return;
    setSaving(true);
    setError(null);
    try {
      await saveAfterglowReflection(id, { reaction, note: note.trim() || null });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your reflection");
    } finally {
      setSaving(false);
    }
  }

  const partnerReflection = reflections.find((reflection) => reflection.authorId !== user?.id);
  const mutual = saved && partnerReflection && ["loved_it", "liked_it"].includes(partnerReflection.reaction) && reaction && ["loved_it", "liked_it"].includes(reaction);

  return (
    <VaultRoom>
      <VaultBackLink href={`/vault/${id}`} label="Back to Spark" />
      <VaultHeader
        eyebrow="Vault Afterglow"
        title={mutual ? "More of this?" : "How did that feel?"}
        subtitle={
          mutual
            ? "You both said you'd be open to this again."
            : "A quiet space to process, reflect, and decide your path forward."
        }
      />

      <VaultCard className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {REACTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setReaction(option.value)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-colors",
                reaction === option.value
                  ? "border-[var(--vault-accent-rose)] bg-[var(--vault-highlight-bg)]"
                  : "border-[var(--vault-border-surface)] bg-[var(--vault-bg-deep)] hover:border-[var(--vault-accent-rose)]/50",
              )}
            >
              <p className="text-2xl">{option.emoji}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--vault-text-primary)]">{option.label}</p>
              <p className="text-xs text-[var(--vault-text-muted)]">{option.helper}</p>
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--vault-text-muted)]">
            Optional private reflection
          </p>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Type your private thoughts here. No pressure — this is just for your own memory..."
            rows={4}
            className={VAULT_TEXTAREA_CLASSES}
          />
        </div>

        {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-[var(--vault-accent-sage)]">
            Your reflection is entirely private and never shared automatically.
          </p>
          <VaultButton variant="cta" disabled={!reaction || saving} loading={saving} onClick={handleSave}>
            Save Reflection
          </VaultButton>
        </div>

        {mutual && (
          <VaultCard highlighted className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--vault-accent-rose)]">
              Shared alignment
            </p>
            <p className="text-sm text-[var(--vault-text-secondary)]">
              No pressure of a performance or scoring — just two partners acknowledging a shared resonance.
            </p>
            <VaultButton variant="cta" onClick={() => router.push("/connect")}>
              Save to Connect Hub
            </VaultButton>
          </VaultCard>
        )}
      </VaultCard>
    </VaultRoom>
  );
}
