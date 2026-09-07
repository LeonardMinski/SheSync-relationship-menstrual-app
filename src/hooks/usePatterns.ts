"use client";

import { useEffect, useState } from "react";

import { getObservations } from "@/services/patterns";
import type { Observation } from "@/types/patterns";

/** The caller's own deterministic Pattern Engine observations — see /api/patterns. */
export function usePatterns() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getObservations().then((result) => {
      if (!active) return;
      setLoading(false);
      if (result.success) {
        setObservations(result.data);
      } else {
        setError(result.error);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { observations, loading, error };
}
