"use client";

import { TopNavbar } from "@/components/layout/TopNavbar";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

import { IncomingInvitationState } from "./IncomingInvitationState";
import { NoPartnerState } from "./NoPartnerState";
import { OwnerConnectedState } from "./OwnerConnectedState";
import { PartnerAccessRequired } from "./PartnerAccessRequired";
import { PartnerPortalHero } from "./PartnerPortalHero";
import { PartnerPortalLoading } from "./PartnerPortalLoading";
import { PartnerRefreshButton } from "./PartnerRefreshButton";
import { PartnerSharedSummary } from "./PartnerSharedSummary";
import { PendingOutgoingState } from "./PendingOutgoingState";
import { RecentActivitySection } from "./RecentActivitySection";
import { SupportiveActions } from "./SupportiveActions";

export default function PartnerPortal() {
  const {
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
  } = usePartnerPortalData();

  if (loading || dataLoading) {
    return <PartnerPortalLoading />;
  }

  if (!user) {
    return <PartnerAccessRequired />;
  }

  const yourConnectionSection = (() => {
    if (!ownerLink) {
      return <NoPartnerState onInvite={invitePartner} />;
    }
    if (ownerLink.status === "pending") {
      return (
        <PendingOutgoingState
          invitedEmail={ownerLink.personEmail}
          cancelling={refreshing}
          onCancel={revokeConnection}
        />
      );
    }
    return (
      <OwnerConnectedState
        viewerName={ownerLink.personName}
        sharingSummary={ownSharingSummary}
        onRevoke={revokeConnection}
      />
    );
  })();

  // No one has invited this user to view anyone else's data.
  if (!viewerLink) {
    return (
      <div className="min-h-screen bg-bg pb-10">
        {yourConnectionSection}
      </div>
    );
  }

  if (viewerLink.status === "pending") {
    return (
      <div className="min-h-screen bg-bg pb-10">
        <IncomingInvitationState
          inviterName={viewerLink.personName}
          onRespond={(action) => respondToIncomingInvite(viewerLink.id, action)}
        />
        {ownerLink && (
          <main className="mx-auto w-full max-w-xl px-4 pb-10">
            {yourConnectionSection}
          </main>
        )}
      </div>
    );
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
        {yourConnectionSection}
        <SupportiveActions />
      </main>
    </div>
  );
}
