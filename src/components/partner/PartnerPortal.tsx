"use client";

import { PublicFooter, PublicHeader } from "@/components/layout/PublicChrome";
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
    <div className="ss-page min-h-screen text-[color:var(--design-ink)]">
      <PublicHeader />

      <main className="mx-auto w-full max-w-6xl space-y-8 px-5 py-16 sm:px-8 lg:px-10">
        <div className="flex justify-end">
          <PartnerRefreshButton
            refreshing={refreshing}
            onRefresh={refreshPartnerData}
          />
        </div>
        <PartnerPortalHero partnerName={partnerData?.partnerName} />
        <PartnerSharedSummary partnerData={partnerData} />
        <RecentActivitySection partnerData={partnerData} />
        <SupportiveActions />
      </main>

      <PublicFooter />
    </div>
  );
}
