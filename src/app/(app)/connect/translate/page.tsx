"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { PartnerTranslationComposer } from "@/components/relationship/PartnerTranslationComposer";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

function TranslatePageContent() {
  const { ownerLink, loading, dataLoading } = usePartnerPortalData();
  const searchParams = useSearchParams();
  const initialInsight = searchParams.get("insight") ?? undefined;

  if (loading || dataLoading) {
    return <p className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">Loading...</p>;
  }

  if (!ownerLink || ownerLink.status !== "active") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted-foreground">
          Connect with a partner first to share context with them.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PartnerTranslationComposer partnerName={ownerLink.personName} initialInsight={initialInsight} />
    </div>
  );
}

export default function TranslatePage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6">Loading...</p>
      }
    >
      <TranslatePageContent />
    </Suspense>
  );
}
