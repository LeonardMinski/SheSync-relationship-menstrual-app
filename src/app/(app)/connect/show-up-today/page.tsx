"use client";

import { HowToShowUpToday } from "@/components/relationship/HowToShowUpToday";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

/** Partner-facing: only makes sense when the caller is a VIEWER of someone else's shared context. */
export default function ShowUpTodayPage() {
  const { viewerLink, loading, dataLoading } = usePartnerPortalData();

  if (loading || dataLoading) {
    return <p className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">Loading...</p>;
  }

  if (!viewerLink || viewerLink.status !== "active") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">
          You&apos;re not currently connected as a partner to anyone.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <HowToShowUpToday ownerId={viewerLink.owner_user_id} ownerName={viewerLink.personName} />
    </div>
  );
}
