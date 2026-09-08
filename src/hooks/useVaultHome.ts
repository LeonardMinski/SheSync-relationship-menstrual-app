"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { getPartnerStatus } from "@/services/partner/data";
import { listSparks } from "@/services/vault/data";
import type { VaultSpark } from "@/types/vault";

export function useVaultHome() {
  const { user, loading: authLoading } = useAuth();
  const [sparks, setSparks] = useState<VaultSpark[]>([]);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setError(null);
    try {
      const [allSparks, status] = await Promise.all([listSparks(), getPartnerStatus()]);
      setSparks(allSparks.filter((spark) => spark.status !== "archived"));

      const activeLink = status.ownerLink?.status === "active" ? status.ownerLink : status.viewerLink?.status === "active" ? status.viewerLink : null;
      setPartnerName(activeLink?.personName ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your Vault");
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      void load();
    } else if (!authLoading) {
      setDataLoading(false);
    }
  }, [authLoading, user, load]);

  return {
    sparks,
    partnerName,
    hasPartner: partnerName !== null,
    loading: authLoading || dataLoading,
    error,
    refresh: load,
  };
}
