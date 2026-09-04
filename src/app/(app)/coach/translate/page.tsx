"use client";

import { Suspense } from "react";

import { PartnerTranslationView } from "@/components/coach/PartnerTranslationView";

// UI-only placeholder screen — no partner-sharing backend exists yet.
// See PartnerTranslationView.tsx for the FeaturePlaceholder shown instead
// of a fake "sent" confirmation.
export default function CoachTranslatePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <PartnerTranslationView />
    </Suspense>
  );
}
