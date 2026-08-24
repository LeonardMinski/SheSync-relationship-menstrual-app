"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { getPartnerSharedData } from "@/services/partner/data";
import type { PartnerLink, PartnerSharedData } from "@/types";

export function usePartnerPortalData() {
  const { user, loading } = useAuth();
  const [partnerData, setPartnerData] = useState<PartnerSharedData | null>(
    null,
  );
  const [partnerLink, setPartnerLink] = useState<PartnerLink | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPartnerData = useCallback(async () => {
    if (!user) return;

    try {
      setDataLoading(true);
      const data = await getPartnerSharedData(user.id);
      setPartnerData(data.sharedData);
      setPartnerLink(data.partnerLink);
    } catch (error) {
      console.error("Error loading partner data:", error);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      setDataLoading(false);
      return;
    }

    if (user && !loading) {
      void loadPartnerData();
    }
  }, [user, loading, loadPartnerData]);

  const refreshPartnerData = async () => {
    setRefreshing(true);
    await loadPartnerData();
    setRefreshing(false);
  };

  return {
    dataLoading,
    loading,
    partnerData,
    partnerLink,
    refreshPartnerData,
    refreshing,
    user,
  };
}
