"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, MessageCircleHeart } from "lucide-react";

import { useVaultSpark } from "@/hooks/useVaultSpark";
import {
  archiveSpark,
  markSparkReady,
  revealSparkTogether,
  shareSparkDirectly,
  updateSpark,
} from "@/services/vault/data";
import {
  HeatBadge,
  VAULT_TEXTAREA_CLASSES,
  VaultBackLink,
  VaultButton,
  VaultCard,
  VaultHeader,
  VaultPill,
  VaultRoom,
  VaultSectionLabel,
} from "@/components/vault/primitives";
import type { VaultSpark } from "@/types/vault";

const TEASE_RESPONSE_LABEL: Record<string, string> = {
  curious: "curious",
  maybe_later: "wants to revisit this later",
  not_tonight: "chose not tonight",
  not_for_me: "said this isn't for them",
};

function useActionState() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };
  return { pending, error, run };
}

function SparkContent({ spark }: { spark: VaultSpark }) {
  return (
    <p className="whitespace-pre-wrap font-display text-2xl italic leading-relaxed text-[var(--vault-text-primary)] sm:text-3xl">
      {spark.content}
    </p>
  );
}

function PrivateView({ spark, refresh }: { spark: VaultSpark; refresh: () => Promise<void> }) {
  const router = useRouter();
  const { pending, error, run } = useActionState();
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(spark.content);

  return (
    <VaultCard className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HeatBadge heatLevel={spark.heatLevel} />
        <VaultPill tone="purple">Private to you</VaultPill>
      </div>

      <div className="h-px bg-[var(--vault-border-surface)]" />

      {editing ? (
        <div className="space-y-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={6}
            className={VAULT_TEXTAREA_CLASSES}
          />
          <div className="flex gap-3">
            <VaultButton
              variant="cta"
              disabled={pending || !draft.trim()}
              onClick={() =>
                run(async () => {
                  await updateSpark(spark.id, { content: draft.trim() });
                  await refresh();
                  setEditing(false);
                })
              }
            >
              Save changes
            </VaultButton>
            <VaultButton variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </VaultButton>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <SparkContent spark={spark} />
          <p className="text-sm text-[var(--vault-text-muted)]">
            Created {format(new Date(spark.createdAt), "d MMMM")}
            {spark.updatedAt !== spark.createdAt && ` · Last edited ${format(new Date(spark.updatedAt), "d MMMM")}`}
          </p>
        </div>
      )}

      <div className="h-px bg-[var(--vault-border-surface)]" />

      {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}

      {!editing && !showShareOptions && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3">
            <VaultButton
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await archiveSpark(spark.id);
                  router.push("/vault");
                })
              }
            >
              Archive Spark
            </VaultButton>
            <VaultButton variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </VaultButton>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-[var(--vault-text-secondary)]">Only you can see this.</p>
            <VaultButton variant="cta" onClick={() => setShowShareOptions(true)}>
              Maybe this is for us →
            </VaultButton>
          </div>
        </div>
      )}

      {showShareOptions && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="font-display text-2xl italic text-[var(--vault-text-primary)]">
              How would you like to soften the enclosure?
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--vault-text-secondary)]">
              Nothing leaves your Vault until you explicitly authorize it. You control the rate of discovery.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <VaultCard padding="md" className="flex flex-col gap-3">
              <p className="font-display text-lg italic text-[var(--vault-text-primary)]">Create a Tease</p>
              <p className="flex-1 text-xs text-[var(--vault-text-secondary)]">
                Give them just enough to wonder, without revealing the core Spark.
              </p>
              <Link href={`/vault/${spark.id}/tease`}>
                <VaultButton variant="secondary" className="w-full">
                  Select Create a Tease
                </VaultButton>
              </Link>
            </VaultCard>
            <VaultCard padding="md" className="flex flex-col gap-3">
              <p className="font-display text-lg italic text-[var(--vault-text-primary)]">Share Directly</p>
              <p className="flex-1 text-xs text-[var(--vault-text-secondary)]">
                Reveal the full Spark immediately — highly intimate, immediate visibility.
              </p>
              <VaultButton
                variant="secondary"
                className="w-full"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    await shareSparkDirectly(spark.id);
                    await refresh();
                    setShowShareOptions(false);
                  })
                }
              >
                Select Share Directly
              </VaultButton>
            </VaultCard>
            <VaultCard padding="md" className="flex flex-col gap-3">
              <p className="font-display text-lg italic text-[var(--vault-text-primary)]">Keep Private</p>
              <p className="flex-1 text-xs text-[var(--vault-text-secondary)]">
                Change nothing. Take all the time you need.
              </p>
              <VaultButton variant="secondary" className="w-full" onClick={() => setShowShareOptions(false)}>
                Select Keep Private
              </VaultButton>
            </VaultCard>
          </div>
        </div>
      )}
    </VaultCard>
  );
}

function TeasedView({ spark }: { spark: VaultSpark }) {
  const router = useRouter();
  const { pending, error, run } = useActionState();
  const declined =
    spark.partnerTeaseResponse && ["not_tonight", "not_for_me"].includes(spark.partnerTeaseResponse);

  return (
    <VaultCard className="space-y-6 text-center">
      <VaultPill tone="purple">Not Revealed Yet</VaultPill>
      <p className="font-display text-2xl italic text-[var(--vault-text-primary)]">Your tease is out there</p>
      <VaultCard padding="md" className="mx-auto max-w-xl text-left">
        <p className="font-display text-xl italic text-[var(--vault-text-primary)]">{spark.teaseText}</p>
      </VaultCard>

      {!spark.partnerTeaseResponse && (
        <p className="text-sm text-[var(--vault-text-secondary)]">Waiting for a response.</p>
      )}

      {spark.partnerTeaseResponse === "maybe_later" && (
        <p className="text-sm text-[var(--vault-text-secondary)]">
          They&apos;d like to revisit this later — the tease stays active.
        </p>
      )}

      {declined && (
        <div className="mx-auto max-w-md space-y-4">
          <p className="font-display text-xl italic text-[var(--vault-text-primary)]">Taking a pause</p>
          <VaultCard padding="md" className="border-[color:var(--vault-accent-sage)]/40 bg-[var(--vault-accent-sage-tint)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--vault-accent-sage)]">
              Consent &amp; autonomy first
            </p>
            <p className="mt-2 font-display italic text-[var(--vault-text-primary)]">
              Curiosity isn&apos;t consent, and a past yes isn&apos;t a yes for today.
            </p>
          </VaultCard>
          {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}
          <div className="flex justify-center gap-3">
            <VaultButton variant="outline" disabled={pending} onClick={() => run(async () => void 0)}>
              Keep Spark Active
            </VaultButton>
            <VaultButton
              variant="cta"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await archiveSpark(spark.id);
                  router.push("/vault");
                })
              }
            >
              Archive for Later
            </VaultButton>
          </div>
        </div>
      )}
    </VaultCard>
  );
}

function WaitingView({ spark, refresh }: { spark: VaultSpark; refresh: () => Promise<void> }) {
  const { pending, error, run } = useActionState();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <VaultCard highlighted className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl italic text-[var(--vault-text-primary)]">They&apos;re curious</p>
            <p className="mt-1 text-sm text-[var(--vault-text-secondary)]">
              Your tease caught their attention.
            </p>
          </div>
          <VaultPill tone="rose">Ready to Reveal</VaultPill>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <VaultSectionLabel>Your tease (what they responded to)</VaultSectionLabel>
            <VaultCard padding="md" className="mt-2">
              <p className="font-display italic text-[var(--vault-text-secondary)]">{spark.teaseText}</p>
            </VaultCard>
          </div>
          <div>
            <VaultSectionLabel tone="purple">Your private Spark (ready to reveal)</VaultSectionLabel>
            <VaultCard padding="md" className="mt-2 space-y-3">
              <SparkContent spark={spark} />
            </VaultCard>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <VaultButton variant="secondary">Not yet</VaultButton>
          <VaultButton variant="cta" onClick={() => setConfirming(true)}>
            Reveal Spark
          </VaultButton>
        </div>
      </VaultCard>
    );
  }

  return (
    <VaultCard className="space-y-6">
      <div>
        <p className="font-display text-2xl italic text-[var(--vault-text-primary)]">Ready to reveal?</p>
        <p className="mt-1 text-sm text-[var(--vault-text-secondary)]">
          This makes the full Spark visible to your partner in your shared Vault.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <VaultSectionLabel>They currently see:</VaultSectionLabel>
          <VaultCard padding="md" className="mt-2">
            <p className="font-display italic text-[var(--vault-text-secondary)]">{spark.teaseText}</p>
          </VaultCard>
        </div>
        <div>
          <VaultSectionLabel tone="rose">They will now see:</VaultSectionLabel>
          <VaultCard padding="md" className="mt-2 border-[var(--vault-accent-rose)]">
            <SparkContent spark={spark} />
          </VaultCard>
        </div>
      </div>
      {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}
      <div className="flex justify-end gap-3">
        <VaultButton variant="secondary" onClick={() => setConfirming(false)}>
          Not yet
        </VaultButton>
        <VaultButton
          variant="cta"
          disabled={pending}
          onClick={() =>
            run(async () => {
              await markSparkReady(spark.id);
              await refresh();
            })
          }
        >
          Reveal
        </VaultButton>
      </div>
    </VaultCard>
  );
}

function ReadyToRevealView({ spark, refresh }: { spark: VaultSpark; refresh: () => Promise<void> }) {
  const { pending, error, run } = useActionState();
  const ownerReady = Boolean(spark.ownerReadyAt);
  const partnerReady = Boolean(spark.partnerReadyAt);
  const bothReady = ownerReady && partnerReady;

  return (
    <VaultCard className="space-y-8 text-center">
      <p className="font-display text-3xl italic text-[var(--vault-text-primary)]">Ready to open this together?</p>
      <p className="mx-auto max-w-md text-sm text-[var(--vault-text-secondary)]">
        When both partners are ready, the Spark unlocks for both of you.
      </p>
      <VaultCard padding="md" className="mx-auto flex max-w-md items-center justify-center gap-10">
        <div className="flex flex-col items-center gap-1">
          <CheckCircle2
            className={`h-8 w-8 ${ownerReady ? "text-[var(--vault-accent-sage)]" : "text-[var(--vault-text-muted)]"}`}
            aria-hidden="true"
          />
          <p className="text-sm">You: {ownerReady ? "Ready ✓" : "Waiting..."}</p>
        </div>
        <div className="h-px w-16 bg-[var(--vault-border-surface)]" />
        <div className="flex flex-col items-center gap-1">
          <CheckCircle2
            className={`h-8 w-8 ${partnerReady ? "text-[var(--vault-accent-sage)]" : "text-[var(--vault-text-muted)]"}`}
            aria-hidden="true"
          />
          <p className="text-sm">Partner: {partnerReady ? "Ready ✓" : "Waiting..."}</p>
        </div>
      </VaultCard>
      {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}
      {bothReady ? (
        <VaultButton
          variant="cta"
          disabled={pending}
          onClick={() =>
            run(async () => {
              await revealSparkTogether(spark.id);
              await refresh();
            })
          }
        >
          Reveal together
        </VaultButton>
      ) : !ownerReady ? (
        <VaultButton
          variant="cta"
          disabled={pending}
          onClick={() =>
            run(async () => {
              await markSparkReady(spark.id);
              await refresh();
            })
          }
        >
          I&apos;m ready
        </VaultButton>
      ) : (
        <p className="text-sm text-[var(--vault-text-muted)]">Waiting for your partner to be ready.</p>
      )}
    </VaultCard>
  );
}

function RevealedView({ spark }: { spark: VaultSpark }) {
  return (
    <VaultCard className="space-y-8 text-center">
      <div className="flex items-center justify-center gap-3">
        <VaultPill tone="rose">Revealed</VaultPill>
      </div>
      <SparkContent spark={spark} />
      <div className="h-px bg-[var(--vault-border-surface)]" />
      <Link href={`/vault/${spark.id}/talk`}>
        <VaultButton variant="cta" className="mx-auto">
          <MessageCircleHeart className="h-4 w-4" aria-hidden="true" />
          Talk about this →
        </VaultButton>
      </Link>
      <Link href={`/vault/${spark.id}/afterglow`} className="block text-sm text-[var(--vault-text-secondary)] underline">
        Reflect privately in Afterglow
      </Link>
    </VaultCard>
  );
}

function ArchivedView({ spark }: { spark: VaultSpark }) {
  return (
    <VaultCard className="space-y-4 opacity-80">
      <VaultPill tone="muted">Archived</VaultPill>
      <SparkContent spark={spark} />
    </VaultCard>
  );
}

export default function VaultSparkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { spark, loading, error, refresh } = useVaultSpark(id);

  return (
    <VaultRoom>
      <VaultBackLink href="/vault" label="Back to Vault" />
      <VaultHeader
        eyebrow={spark ? TEASE_RESPONSE_LABEL[spark.partnerTeaseResponse ?? ""] ?? undefined : undefined}
        title="Spark Detail"
        pill={spark ? <VaultPill tone="purple">Vault Secured</VaultPill> : undefined}
        subtitle="Take your time thinking this desire through."
      />

      {loading && <p className="text-sm text-[var(--vault-text-muted)]">Loading...</p>}
      {error && <p className="text-sm text-[color:var(--error)]">{error}</p>}

      {spark && spark.status === "private" && <PrivateView spark={spark} refresh={refresh} />}
      {spark && spark.status === "teased" && <TeasedView spark={spark} />}
      {spark && spark.status === "waiting" && <WaitingView spark={spark} refresh={refresh} />}
      {spark && spark.status === "ready_to_reveal" && <ReadyToRevealView spark={spark} refresh={refresh} />}
      {spark && spark.status === "revealed" && <RevealedView spark={spark} />}
      {spark && spark.status === "archived" && <ArchivedView spark={spark} />}
    </VaultRoom>
  );
}
