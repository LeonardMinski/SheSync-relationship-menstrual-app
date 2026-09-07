"use client";

import { AppreciationComposer } from "@/components/relationship/AppreciationComposer";
import { resolveActivePartner } from "@/features/partner/activePartner";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

export default function AppreciatePage() {
  const { ownerLink, viewerLink, loading, dataLoading } = usePartnerPortalData();
  const partner = resolveActivePartner(ownerLink, viewerLink);

  if (loading || dataLoading) {
    return <p className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">Loading...</p>;
  }

  if (!partner) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">Connect with a partner first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AppreciationComposer partnerName={partner.name} />
    </div>
  );
}
