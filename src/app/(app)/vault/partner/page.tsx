"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

import { useAuth } from "@/context/AuthContext";
import { getPartnerStatus } from "@/services/partner/data";
import { getPartnerVaultSummary } from "@/services/vault/data";
import {
  HeatBadge,
  PrivacyReassurance,
  VaultBackLink,
  VaultCard,
  VaultHeader,
  VaultPill,
  VaultRoom,
} from "@/components/vault/primitives";
import type { VaultPartnerSparkSummary } from "@/types/vault";

const STATUS_LABEL: Record<VaultPartnerSparkSummary["status"], string> = {
  private: "Private",
  teased: "Teased",
  waiting: "Waiting on you",
  ready_to_reveal: "Ready to reveal",
  revealed: "Revealed",
  archived: "Archived",
};

export default function PartnerVaultPage() {
  const { user, loading: authLoading } = useAuth();
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [sparks, setSparks] = useState<VaultPartnerSparkSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    void Promise.all([getPartnerStatus(), getPartnerVaultSummary()]).then(([status, partnerSparks]) => {
      const activeLink =
        status.ownerLink?.status === "active" ? status.ownerLink : status.viewerLink?.status === "active" ? status.viewerLink : null;
      setPartnerName(activeLink?.personName ?? null);
      setSparks(partnerSparks);
      setLoading(false);
    });
  }, [authLoading, user]);

  const waiting = sparks.filter((spark) => spark.status !== "revealed");
  const revealed = sparks.filter((spark) => spark.status === "revealed");

  return (
    <VaultRoom>
      <VaultBackLink href="/vault" label="Back to Vault" />
      <VaultHeader
        eyebrow="Shared Discovery"
        title={partnerName ? `${partnerName}'s Vault` : "Partner Vault"}
        subtitle="Explore the teasers and hints they've shared. Connect without pressure."
        pill={<VaultPill tone="purple">Shared Discovery</VaultPill>}
        reassurance={<PrivacyReassurance>Private to you · Their private files are hidden</PrivacyReassurance>}
      />

      {loading && <p className="text-sm text-[var(--vault-text-muted)]">Loading...</p>}

      {!loading && (
        <>
          <p className="mb-6 text-sm text-[var(--vault-text-secondary)]">
            Currently: {waiting.length} Waiting For You · {revealed.length} Revealed Together
          </p>

          {sparks.length === 0 ? (
            <VaultCard className="border-dashed py-16 text-center">
              <p className="font-instrument text-xl italic text-[var(--vault-text-primary)]">Nothing shared yet</p>
              <p className="mt-2 text-sm text-[var(--vault-text-secondary)]">
                When {partnerName ?? "your partner"} shares a tease or reveal, it will appear here.
              </p>
            </VaultCard>
          ) : (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--vault-text-muted)]">
                Waiting for you ({waiting.length})
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {sparks.map((spark) => (
                  <Link key={spark.id} href={`/vault/partner/${spark.id}`}>
                    <VaultCard
                      padding="md"
                      className="flex h-full flex-col gap-3 transition-colors hover:border-[var(--vault-accent-rose)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <HeatBadge heatLevel={spark.heatLevel} />
                        <VaultPill tone={spark.status === "revealed" ? "sage" : "rose"} className="px-2.5 py-0.5 text-[10px]">
                          {STATUS_LABEL[spark.status]}
                        </VaultPill>
                      </div>
                      {spark.teaseText ? (
                        <p className="line-clamp-3 font-instrument text-lg italic text-[var(--vault-text-primary)]">
                          {spark.teaseText}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--vault-text-muted)]">
                          Waiting on both of you to click reveal.
                        </p>
                      )}
                      <p className="mt-auto text-xs text-[var(--vault-text-muted)]">
                        {format(new Date(spark.createdAt), "d MMMM")}
                      </p>
                    </VaultCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </VaultRoom>
  );
}
