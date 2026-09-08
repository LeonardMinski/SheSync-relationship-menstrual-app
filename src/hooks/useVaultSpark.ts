"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { getSpark } from "@/services/vault/data";
import type { VaultSpark } from "@/types/vault";

/**
 * Loads one of the caller's own Sparks by id, with lightweight polling
 * while the reveal ceremony is in progress (waiting/ready_to_reveal) so
 * the owner sees the partner's ready state update without a manual
 * refresh — there's no realtime/websocket infra in this app yet, so this
 * is an honest short-interval poll, not a push subscription.
 */
export function useVaultSpark(id: string) {
  const { user, loading: authLoading } = useAuth();
  const [spark, setSpark] = useState<VaultSpark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getSpark(id);
      setSpark(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load this Spark");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && user) {
      void load();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, load]);

  useEffect(() => {
    if (!spark || !["waiting", "ready_to_reveal"].includes(spark.status)) return;
    const interval = setInterval(() => void load(), 4000);
    return () => clearInterval(interval);
  }, [spark, load]);

  return { spark, loading: authLoading || loading, error, refresh: load };
}
