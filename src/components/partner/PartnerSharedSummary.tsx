import { EyeOff, Lock, ShieldCheck, Smile } from "lucide-react";

import type { PartnerSharedData } from "@/types";
import { getMoodEmoji, getPhaseDisplayName } from "@/features/partner/partner.selectors";

export function PartnerSharedSummary({
  partnerData,
}: {
  partnerData: PartnerSharedData | null;
}) {
  const sharingPaused = !partnerData?.privacySettings.shareWithPartner;

  return (
    <section
      className="ss-card p-6 sm:p-8"
      data-testid="today-at-glance"
    >
      {partnerData && !sharingPaused ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <PhasePanel partnerData={partnerData} />
          <div className="grid gap-4">
            <MoodPanel partnerData={partnerData} />
            <PrivacyNotice />
          </div>
        </div>
      ) : (
        <PausedPanel />
      )}
    </section>
  );
}

function PhasePanel({ partnerData }: { partnerData: PartnerSharedData }) {
  return (
    <div className="rounded-2xl bg-[color:var(--design-footer)] p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--design-muted)]">
        Current Phase
      </p>
      {partnerData.privacySettings.shareCyclePhase && partnerData.todayCycle ? (
        <div data-testid="cycle-phase">
          <div className="mt-5 flex items-center gap-3">
            <span className="text-5xl" aria-hidden="true">
              {getMoodEmoji(partnerData.todayCycle.phase || "")}
            </span>
            <h2 className="ss-display text-5xl font-bold text-[color:var(--design-brown)]">
              {getPhaseDisplayName(partnerData.todayCycle.phase || "unknown")}
            </h2>
          </div>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--design-muted)]">
            Energy might be lower today. A quiet evening could be appreciated.
          </p>
        </div>
      ) : (
        <LockedPanel label="Cycle phase hidden" />
      )}
    </div>
  );
}

function MoodPanel({ partnerData }: { partnerData: PartnerSharedData }) {
  if (!partnerData.privacySettings.shareMood || !partnerData.todayCycle) {
    return <LockedPanel label="Mood hidden" />;
  }

  return (
    <div
      className="rounded-2xl border border-[color:var(--design-border)] bg-white p-5"
      data-testid="mood"
    >
      <div className="flex items-center justify-between">
        <p className="font-bold text-[color:var(--design-ink)]">
          Today&apos;s Mood
        </p>
        <Smile
          className="h-5 w-5 text-[color:var(--design-sage)]"
          aria-hidden="true"
        />
      </div>
      <p className="mt-4 text-3xl font-bold text-[color:var(--design-ink)]">
        {partnerData.todayCycle.mood}/10
      </p>
      <p className="mt-1 text-sm text-[color:var(--design-muted)]">
        Shared mood context
      </p>
    </div>
  );
}

function PrivacyNotice() {
  return (
    <div
      className="rounded-2xl border border-[color:var(--design-border)] bg-white p-5"
      data-testid="privacy-notice"
    >
      <div className="flex gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[color:var(--design-sage)]" />
        <div>
          <p className="font-bold text-[color:var(--design-ink)]">
            Privacy Settings
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--design-muted)]">
            Only data your partner has chosen to share is visible here.
          </p>
        </div>
      </div>
    </div>
  );
}

function PausedPanel() {
  return (
    <div className="py-10 text-center" data-testid="no-shared-data">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--design-footer)]">
        <EyeOff className="h-8 w-8 text-[color:var(--design-muted)]" />
      </div>
      <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
        Data Paused
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[color:var(--design-muted)]">
        Your partner has disabled sharing or has not shared any data yet.
      </p>
    </div>
  );
}

function LockedPanel({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--design-border)] bg-white p-6 text-center">
      <Lock className="mx-auto h-6 w-6 text-[color:var(--design-muted)]" />
      <p className="mt-3 text-sm font-bold text-[color:var(--design-muted)]">
        {label}
      </p>
    </div>
  );
}
