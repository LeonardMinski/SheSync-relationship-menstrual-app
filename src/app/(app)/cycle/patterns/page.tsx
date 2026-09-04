"use client";

import { useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/ui/EmptyState";
import { InsightPanel } from "@/components/ui/InsightPanel";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useAuth } from "@/context/AuthContext";
import { useCycleLogger } from "@/hooks/useCycleLogger";
import {
  countDaysLogged,
  findLowEnergyHighStressPattern,
  loggingConsistency,
  toTrendPoints,
} from "@/features/cycle/patterns.utils";

const WINDOW_DAYS = 14;

export default function CyclePatternsPage() {
  const { user, loading: authLoading } = useAuth();
  const { cycles, fetchCycles, loading: cycleLoading } = useCycleLogger();

  useEffect(() => {
    if (user && !authLoading) {
      void fetchCycles();
    }
  }, [user, authLoading, fetchCycles]);

  const loading = authLoading || cycleLoading;
  const daysLogged = countDaysLogged(cycles, WINDOW_DAYS);
  const consistency = loggingConsistency(cycles, WINDOW_DAYS);
  const trend = toTrendPoints(cycles).slice(-WINDOW_DAYS);
  const pattern = findLowEnergyHighStressPattern(cycles.slice(0, WINDOW_DAYS));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <SectionHeading
        title="Your Patterns"
        description="Based on what you've logged."
        actions={<PremiumBadge />}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your logs...</p>
      ) : cycles.length === 0 ? (
        <EmptyState
          title="Not enough data yet"
          description="Log a few days on the Cycle page and your patterns will start showing up here."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Cycle length" value="Not enough data yet" caption="Needs a completed cycle to calculate — coming later." />
            <StatCard label="Days logged" value={String(daysLogged)} caption={`In the last ${WINDOW_DAYS} days`} />
            <StatCard
              label="Logging consistency"
              value={consistency !== null ? `${consistency}%` : "—"}
              caption="Based on your logged data"
            />
          </div>

          <div className="rounded-2xl border border-border bg-bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-foreground">
              Mood &amp; energy trend
            </h2>
            {trend.length >= 2 ? (
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                    <Tooltip />
                    <Line type="monotone" dataKey="mood" stroke="var(--accent-rose)" strokeWidth={2} dot={false} name="Mood" />
                    <Line type="monotone" dataKey="energy" stroke="var(--accent-sage)" strokeWidth={2} dot={false} name="Energy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Log at least two days to see a trend line.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Possible pattern · Based on {trend.length} logged days. Still learning.
            </p>
          </div>

          {pattern.matchCount > 0 && (
            <InsightPanel
              title="A pattern worth exploring"
              description={`Lower energy appeared alongside higher stress on ${pattern.matchCount} of ${pattern.totalCount} recently logged days. We display this as a possible pattern based on your logged data — not a diagnosis.`}
            />
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}
