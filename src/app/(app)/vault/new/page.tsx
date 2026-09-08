"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { createSpark } from "@/services/vault/data";
import {
  VAULT_TEXTAREA_CLASSES,
  VaultBackLink,
  VaultButton,
  VaultCard,
  VaultHeader,
  VaultRoom,
} from "@/components/vault/primitives";
import { cn } from "@/utils/cn";
import type { SparkHeatLevel } from "@/types/vault";

const STARTER_PROMPTS = [
  { title: "I want...", subtitle: "Express a direct desire" },
  { title: "I'm curious about...", subtitle: "Explore a fantasy" },
  { title: "I fantasise about...", subtitle: "Deep personal wonderings" },
  { title: "I'd love you to...", subtitle: "Invite them into action" },
  { title: "I'd love to do this for you...", subtitle: "Generous intimacy" },
  { title: "Something I've never told you...", subtitle: "Deconstruct walls" },
  { title: "Something I want more of...", subtitle: "Multiply goodness" },
  { title: "Something I'd like us to try...", subtitle: "Curated experiences" },
];

const HEAT_LEVELS: { value: SparkHeatLevel; label: string }[] = [
  { value: "warm", label: "Warm" },
  { value: "hot", label: "Hot" },
  { value: "bold", label: "Bold" },
];

export default function NewVaultSparkPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [heatLevel, setHeatLevel] = useState<SparkHeatLevel>("warm");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = content.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const spark = await createSpark({ heatLevel, content: content.trim() });
      router.push(`/vault/${spark.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save this Spark");
      setSaving(false);
    }
  }

  return (
    <VaultRoom>
      <VaultBackLink href="/vault" label="Back to Vault" />

      <VaultHeader eyebrow="Add a Spark" title="What's on your mind?" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--vault-text-muted)]">
            Intimate starting prompts
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt.title}
                type="button"
                onClick={() => setContent((current) => (current ? current : `${prompt.title} `))}
                className="rounded-xl border border-[var(--vault-border-surface)] bg-[var(--vault-bg-elevated)] p-4 text-left transition-colors hover:border-[var(--vault-accent-rose)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vault-accent-rose)]"
              >
                <p className="font-instrument text-lg italic text-[var(--vault-text-primary)]">{prompt.title}</p>
                <p className="mt-1 text-xs text-[var(--vault-text-muted)]">{prompt.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        <VaultCard className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-[var(--vault-text-secondary)]">Choose Intensity Level:</label>
            <div className="flex gap-1.5 rounded-lg bg-[var(--vault-bg-deep)] p-1">
              {HEAT_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setHeatLevel(level.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    heatLevel === level.value
                      ? "bg-[var(--vault-accent-rose)] text-[var(--vault-text-on-accent)]"
                      : "text-[var(--vault-text-secondary)] hover:text-[var(--vault-text-primary)]",
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Start writing here..."
            rows={8}
            className={cn(VAULT_TEXTAREA_CLASSES, "flex-1")}
          />

          {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--vault-accent-sage)]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Saved to Private Vault
            </div>
            <VaultButton variant="cta" onClick={handleSave} disabled={!canSave} loading={saving}>
              Save Spark to Vault
            </VaultButton>
          </div>
        </VaultCard>
      </div>
    </VaultRoom>
  );
}
