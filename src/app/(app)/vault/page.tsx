"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Heart, Lock, Plus, Sparkles } from "lucide-react";

import { useVaultHome } from "@/hooks/useVaultHome";
import {
  HeatBadge,
  PrivacyReassurance,
  VaultButton,
  VaultCard,
  VaultHeader,
  VaultPill,
  VaultRoom,
} from "@/components/vault/primitives";
import type { VaultSpark } from "@/types/vault";

const STATUS_LABEL: Record<VaultSpark["status"], string> = {
  private: "Private",
  teased: "Teased",
  waiting: "Waiting on you",
  ready_to_reveal: "Ready to reveal",
  revealed: "Revealed",
  archived: "Archived",
};

function statusTone(status: VaultSpark["status"]): "rose" | "purple" | "sage" | "muted" {
  if (status === "revealed") return "sage";
  if (status === "private") return "purple";
  return "rose";
}

export default function VaultPage() {
  const { sparks, partnerName, hasPartner, loading, error, refresh } = useVaultHome();
  const privateCount = sparks.filter((spark) => spark.status === "private").length;

  return (
    <VaultRoom>
      <VaultHeader
        eyebrow="Private by default"
        title={hasPartner ? "Your Vault" : "Solo Vault"}
        subtitle={
          hasPartner
            ? `Your personal archive of desires, prompts, and shared moments with ${partnerName}.`
            : "Your completely private archive of things you want, wonder about, or aren't quite ready to say."
        }
        pill={<VaultPill tone="purple">{hasPartner ? "Private Desire" : "No Partner Connected"}</VaultPill>}
        reassurance={
          <PrivacyReassurance>
            {hasPartner ? "Private to you · Nothing is shared" : "Private to you · No partner connected"}
          </PrivacyReassurance>
        }
      />

      {!hasPartner && (
        <VaultCard highlighted className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 shrink-0 text-[var(--vault-accent-purple)]" aria-hidden="true" />
            <p className="font-display text-lg italic text-[var(--vault-text-primary)]">
              Ready to explore with someone? Connect with a partner later to safely share.
            </p>
          </div>
          <Link href="/connect">
            <VaultButton variant="cta">Invite Partner</VaultButton>
          </Link>
        </VaultCard>
      )}

      {hasPartner && (
        <VaultCard highlighted className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 shrink-0 text-[var(--vault-accent-rose)]" aria-hidden="true" />
            <p className="font-display text-lg italic text-[var(--vault-text-primary)]">
              See what {partnerName} has teased or revealed with you.
            </p>
          </div>
          <Link href="/vault/partner">
            <VaultButton variant="secondary">View {partnerName}&apos;s Vault</VaultButton>
          </Link>
        </VaultCard>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold text-[var(--vault-accent-purple)]">
          Archive: {privateCount} Private Spark{privateCount === 1 ? "" : "s"}
        </p>
        <Link href="/vault/new">
          <VaultButton variant="cta">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add a Spark
          </VaultButton>
        </Link>
      </div>

      {error && (
        <VaultCard className="mb-6 border-[color:var(--error)]/40 text-sm text-[color:var(--error)]">
          {error}{" "}
          <button type="button" onClick={() => void refresh()} className="underline">
            Try again
          </button>
        </VaultCard>
      )}

      {loading ? (
        <p className="text-sm text-[var(--vault-text-muted)]">Loading your Vault...</p>
      ) : sparks.length === 0 ? (
        <VaultCard className="flex flex-col items-center gap-3 border-dashed py-16 text-center">
          <Lock className="h-8 w-8 text-[var(--vault-text-muted)]" aria-hidden="true" />
          <p className="font-display text-xl italic text-[var(--vault-text-primary)]">Nothing here yet</p>
          <p className="max-w-sm text-sm text-[var(--vault-text-secondary)]">
            Start writing to create your first Spark. It stays just yours until you choose to share something from
            it.
          </p>
          <Link href="/vault/new">
            <VaultButton variant="cta" className="mt-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Write your first Spark
            </VaultButton>
          </Link>
        </VaultCard>
      ) : (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--vault-accent-purple)]">
            My Vault · Sparks ({sparks.length})
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sparks.map((spark) => (
              <Link key={spark.id} href={`/vault/${spark.id}`}>
                <VaultCard
                  padding="md"
                  className="flex h-full flex-col gap-3 transition-colors hover:border-[var(--vault-accent-rose)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <HeatBadge heatLevel={spark.heatLevel} />
                    <VaultPill tone={statusTone(spark.status)} className="px-2.5 py-0.5 text-[10px]">
                      {STATUS_LABEL[spark.status]}
                    </VaultPill>
                  </div>
                  <p className="line-clamp-3 font-display text-lg italic text-[var(--vault-text-primary)]">
                    {spark.content}
                  </p>
                  <p className="mt-auto text-xs text-[var(--vault-text-muted)]">
                    {format(new Date(spark.createdAt), "d MMMM")}
                  </p>
                </VaultCard>
              </Link>
            ))}
          </div>
        </div>
      )}
    </VaultRoom>
  );
}
