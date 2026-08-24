"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  Eye,
  EyeOff,
  Heart,
  Lock,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Smile,
  Users,
} from "lucide-react";

import { TopNavbar, Navbar } from "@/components/layout/Navbar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { getPartnerSharedData } from "@/services/partner/data";
import type { PartnerLink, PartnerSharedData } from "@/types";
import {
  formatDateShort,
  getMoodEmoji,
  getPhaseDisplayName,
} from "@/utils/partnerSelectors";

export default function PartnerPortal() {
  const { user, loading } = useAuth();
  const [partnerData, setPartnerData] = useState<PartnerSharedData | null>(
    null,
  );
  const [partnerLink, setPartnerLink] = useState<PartnerLink | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPartnerData = useCallback(async () => {
    if (!user) return;

    try {
      setDataLoading(true);
      const data = await getPartnerSharedData(user.id);
      setPartnerData(data.sharedData);
      setPartnerLink(data.partnerLink);
    } catch (error) {
      console.error("Error loading partner data:", error);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !loading) {
      void loadPartnerData();
    }
  }, [user, loading, loadPartnerData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPartnerData();
    setRefreshing(false);
  };

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Access Required
          </h1>
          <p className="text-muted-foreground">
            Please sign in to access partner features.
          </p>
        </div>
      </div>
    );
  }

  if (!partnerLink) {
    return (
      <div className="min-h-screen bg-bg pb-10">
        <TopNavbar title="Partner" subtitle="Invite a trusted partner" />
        <main className="mx-auto flex max-w-xl px-4 py-16">
          <div
            className="w-full rounded-[2rem] border border-border bg-bg-surface p-8 text-center shadow-lg"
            data-testid="no-partner"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
              <Users className="h-8 w-8 text-cta-start" aria-hidden="true" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground">
              Invite your Partner
            </h1>
            <p className="mx-auto mb-8 max-w-sm text-muted-foreground">
              Sharing your cycle phases fosters deeper understanding and better
              support. You choose what to share.
            </p>
            <button
              className="btn-cta w-full"
              data-testid="connect-partner-button"
            >
              <Users className="h-5 w-5" aria-hidden="true" />
              Connect Partner
            </button>
          </div>
        </main>
        <Navbar />
      </div>
    );
  }

  const sharingPaused = !partnerData?.privacySettings.shareWithPartner;

  return (
    <div className="min-h-screen bg-bg pb-10">
      <TopNavbar
        title="Partner View"
        subtitle={`Supporting ${partnerData?.partnerName || "your partner"}`}
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-surface text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
            data-testid="refresh-button"
            aria-label="Refresh partner data"
          >
            <RefreshCw
              className={refreshing ? "h-5 w-5 animate-spin" : "h-5 w-5"}
              aria-hidden="true"
            />
          </button>
        }
      />

      <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 lg:px-10">
        <section className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
            <Eye className="h-4 w-4 text-info" aria-hidden="true" />
            Partner Perspective
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {partnerData?.partnerName || "Partner"}&apos;s Context
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A calm, read-only view of the details they explicitly shared.
          </p>
        </section>

        <section
          className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-lg"
          data-testid="today-at-glance"
        >
          {partnerData && !sharingPaused ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[1.5rem] bg-bg p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                  Current Phase
                </p>
                {partnerData.privacySettings.shareCyclePhase &&
                partnerData.todayCycle ? (
                  <div data-testid="cycle-phase">
                    <div className="mt-5 flex items-center gap-3">
                      <span className="text-5xl" aria-hidden="true">
                        {getMoodEmoji(partnerData.todayCycle.phase || "")}
                      </span>
                      <h2 className="text-5xl font-black text-foreground">
                        {getPhaseDisplayName(
                          partnerData.todayCycle.phase || "unknown",
                        )}
                      </h2>
                    </div>
                    <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                      Energy might be lower today. A quiet evening could be
                      appreciated.
                    </p>
                  </div>
                ) : (
                  <LockedPanel label="Cycle phase hidden" />
                )}
              </div>

              <div className="grid gap-4">
                {partnerData.privacySettings.shareMood &&
                partnerData.todayCycle ? (
                  <div
                    className="rounded-[1.5rem] border border-border bg-bg p-5"
                    data-testid="mood"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-foreground">
                        Today&apos;s Mood
                      </p>
                      <Smile className="h-5 w-5 text-cta-start" />
                    </div>
                    <p className="mt-4 text-3xl font-black text-foreground">
                      {partnerData.todayCycle.mood}/10
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Shared mood context
                    </p>
                  </div>
                ) : (
                  <LockedPanel label="Mood hidden" />
                )}

                <div
                  className="rounded-[1.5rem] border border-info/25 bg-info/10 p-5"
                  data-testid="privacy-notice"
                >
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-info" />
                    <div>
                      <p className="font-bold text-foreground">
                        Privacy Settings
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Only data your partner has chosen to share is visible
                        here.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center" data-testid="no-shared-data">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
                <EyeOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Data Paused
              </h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Your partner has disabled sharing or has not shared any data yet.
              </p>
            </div>
          )}
        </section>

        {partnerData && partnerData.recentActivity.length > 0 && (
          <section
            className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md"
            data-testid="recent-activity"
          >
            <div className="mb-5 flex items-center gap-3">
              <Heart className="h-6 w-6 text-[color:var(--accent-peach)]" />
              <h2 className="text-2xl font-bold text-foreground">
                Recent Activity
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {partnerData.recentActivity.map((activity, index) => (
                <div
                  key={`${activity.date}-${index}`}
                  className="rounded-2xl bg-bg p-4"
                  data-testid="activity-item"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {activity.description}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">
                    {formatDateShort(activity.date)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section
          className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md"
          data-testid="supportive-actions"
        >
          <h2 className="text-2xl font-bold text-foreground">
            Supportive Actions
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <SupportTile
              icon={Heart}
              title="Be present"
              text="Listen when your partner shares context."
            />
            <SupportTile
              icon={MessageCircle}
              title="Ask gently"
              text="Use the shared view as a conversation starter."
            />
            <SupportTile
              icon={Users}
              title="Respect privacy"
              text="Treat hidden details as intentional boundaries."
            />
          </div>
        </section>
      </main>

      <Navbar />
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

function SupportTile({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl bg-bg p-4">
      <Icon className="h-6 w-6 text-cta-start" aria-hidden="true" />
      <h3 className="mt-4 font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </article>
  );
}
