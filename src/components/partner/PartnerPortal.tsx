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

  // OwnerConnectedState is already an understated inline card in every
  // context, so it doesn't need a compact variant. NoPartnerState and
  // PendingOutgoingState default to a full hero-style treatment, which is
  // only appropriate when one of them IS the whole page (the `!viewerLink`
  // branch below) — everywhere else they're a secondary aside next to the
  // real content of the page, so `compact` renders them as a modest card
  // instead, matching OwnerConnectedState's weight.
  const renderConnectionSection = (compact: boolean) => {
    if (!ownerLink) {
      return <NoPartnerState onInvite={invitePartner} compact={compact} />;
    }
    if (ownerLink.status === "pending") {
      return (
        <PendingOutgoingState
          invitedEmail={ownerLink.personEmail}
          cancelling={refreshing}
          onCancel={revokeConnection}
          compact={compact}
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
  };

  // No one has invited this user to view anyone else's data — this state
  // IS the whole page, so it gets the full, non-compact treatment.
  if (!viewerLink) {
    const subtitle = !ownerLink
      ? "Invite a trusted partner"
      : ownerLink.status === "pending"
        ? "Invitation pending"
        : "Sharing active";

    return (
      <div className="min-h-screen bg-bg pb-10">
        <TopNavbar title="Partner" subtitle={subtitle} />
        <main className="px-4 py-16">{renderConnectionSection(false)}</main>
      </div>
    );
  }

  if (viewerLink.status === "pending") {
    return (
      <div className="min-h-screen bg-bg pb-10">
        <TopNavbar title="Partner" subtitle="Invitation received" />
        <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-16">
          <IncomingInvitationState
            inviterName={viewerLink.personName}
            onRespond={(action) => respondToIncomingInvite(viewerLink.id, action)}
          />
          {ownerLink && renderConnectionSection(true)}
        </main>
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
        {renderConnectionSection(true)}
        <SupportiveActions />
      </main>
    </div>
  );
}
