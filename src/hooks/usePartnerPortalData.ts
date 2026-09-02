"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { getSharingSummaryLabels } from "@/features/partner/sharing-summary";
import { getPrivacySettings } from "@/services/privacy/settings";
import {
  getPartnerSharedData,
  getPartnerStatus,
  respondToInvite,
  revokePartnerConnection,
  sendPartnerInvite,
} from "@/services/partner/data";
import type {
  PartnerLinkWithPerson,
  PartnerSharedData,
} from "@/types/partner";

export function usePartnerPortalData() {
  const { user, loading } = useAuth();
  const [ownerLink, setOwnerLink] = useState<PartnerLinkWithPerson | null>(
    null,
  );
  const [viewerLink, setViewerLink] = useState<PartnerLinkWithPerson | null>(
    null,
  );
  const [partnerData, setPartnerData] = useState<PartnerSharedData | null>(
    null,
  );
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ownSharingSummary, setOwnSharingSummary] = useState<string[]>([]);

  const loadPartnerData = useCallback(async () => {
    if (!user) return;

    try {
      setDataLoading(true);
      const status = await getPartnerStatus();
      setOwnerLink(status.ownerLink);
      setViewerLink(status.viewerLink);

      if (status.viewerLink?.status === "active") {
        const data = await getPartnerSharedData();
        setPartnerData(data.sharedData);
      } else {
        setPartnerData(null);
      }

      if (status.ownerLink) {
        const ownSettings = await getPrivacySettings(user.id);
        setOwnSharingSummary(getSharingSummaryLabels(ownSettings));
      } else {
        setOwnSharingSummary([]);
      }
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

  const invitePartner = async (email: string) => {
    setActionError(null);
    try {
      await sendPartnerInvite(email);
      await loadPartnerData();
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to send invitation");
      return false;
    }
  };

  const respondToIncomingInvite = async (
    linkId: string,
    action: "accept" | "decline",
  ) => {
    setActionError(null);
    try {
      await respondToInvite(linkId, action);
      await loadPartnerData();
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to respond to invitation");
      return false;
    }
  };

  const revokeConnection = async () => {
    setActionError(null);
    try {
      await revokePartnerConnection();
      await loadPartnerData();
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to revoke connection");
      return false;
    }
  };

  return {
    actionError,
    dataLoading,
    invitePartner,
    loading,
    ownerLink,
    ownSharingSummary,
    partnerData,
    refreshing,
    refreshPartnerData,
    respondToIncomingInvite,
    revokeConnection,
    user,
    viewerLink,
  };
}
