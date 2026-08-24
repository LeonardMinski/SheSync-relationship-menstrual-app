"use client";

import { TopNavbar } from "@/components/layout/TopNavbar";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

import { NoPartnerState } from "./NoPartnerState";
import { PartnerAccessRequired } from "./PartnerAccessRequired";
import { PartnerPortalHero } from "./PartnerPortalHero";
import { PartnerPortalLoading } from "./PartnerPortalLoading";
import { PartnerRefreshButton } from "./PartnerRefreshButton";
import { PartnerSharedSummary } from "./PartnerSharedSummary";
import { RecentActivitySection } from "./RecentActivitySection";
import { SupportiveActions } from "./SupportiveActions";

export default function PartnerPortal() {
  const {
    dataLoading,
    loading,
    partnerData,
    partnerLink,
    refreshPartnerData,
    refreshing,
    user,
  } = usePartnerPortalData();

  if (loading || dataLoading) {
    return <PartnerPortalLoading />;
  }

  if (!user) {
    return <PartnerAccessRequired />;
  }

  if (!partnerLink) {
    return <NoPartnerState />;
  }

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title="Partner View"
        subtitle={`Supporting ${partnerData?.partnerName || "your partner"}`}
        actions={
          <PartnerRefreshButton
            refreshing={refreshing}
            onRefresh={refreshPartnerData}
          />
        }
      />

      <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 lg:px-10">
        <PartnerPortalHero partnerName={partnerData?.partnerName} />
        <PartnerSharedSummary partnerData={partnerData} />
        <RecentActivitySection partnerData={partnerData} />
        <SupportiveActions />
      </main>
    </div>
  );
}
