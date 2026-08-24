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
      className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-lg"
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
    <div className="rounded-[1.5rem] bg-bg p-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
        Current Phase
      </p>
      {partnerData.privacySettings.shareCyclePhase && partnerData.todayCycle ? (
        <div data-testid="cycle-phase">
          <div className="mt-5 flex items-center gap-3">
            <span className="text-5xl" aria-hidden="true">
              {getMoodEmoji(partnerData.todayCycle.phase || "")}
            </span>
            <h2 className="text-5xl font-black text-foreground">
              {getPhaseDisplayName(partnerData.todayCycle.phase || "unknown")}
            </h2>
          </div>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
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
      className="rounded-[1.5rem] border border-border bg-bg p-5"
      data-testid="mood"
    >
      <div className="flex items-center justify-between">
        <p className="font-bold text-foreground">Today&apos;s Mood</p>
        <Smile className="h-5 w-5 text-cta-start" aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-black text-foreground">
        {partnerData.todayCycle.mood}/10
      </p>
      <p className="mt-1 text-sm text-muted-foreground">Shared mood context</p>
    </div>
  );
}

function PrivacyNotice() {
  return (
    <div
      className="rounded-[1.5rem] border border-info/25 bg-info/10 p-5"
      data-testid="privacy-notice"
    >
      <div className="flex gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-info" />
        <div>
          <p className="font-bold text-foreground">Privacy Settings</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
        <EyeOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Data Paused</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        Your partner has disabled sharing or has not shared any data yet.
      </p>
    </div>
  );
}

function LockedPanel({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-bg p-6 text-center">
      <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-3 text-sm font-bold text-muted-foreground">{label}</p>
    </div>
  );
}
