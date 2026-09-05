"use client";

/**
 * Dashboard Page - Home destination for both account types.
 *
 * Tracking-enabled accounts (including dual-role viewers) get the full
 * tracked Dashboard, unchanged. Partner-only accounts get PartnerPortal
 * instead — it already is the deliberately simplified, relationship-only
 * experience Section 9 asks for (real relationship state, real
 * privacy-filtered shared data, zero self-tracking content), so this
 * reuses it directly rather than building a parallel "Partner Home".
 */
import Dashboard from "@/components/dashboard/Dashboard";
import PartnerPortal from "@/components/partner/PartnerPortal";
import { useAuth } from "@/context/AuthContext";
import { canUseTracking, isTrackingStatusResolved } from "@/features/account/capabilities";

export default function DashboardPage() {
  const { user } = useAuth();

  // While tracking status is still resolving, keep showing the tracked
  // Dashboard's own loading state (it already handles `!user`/loading)
  // rather than flashing PartnerPortal first — canUseTracking is false
  // during this same window, so without this check every account would
  // start on PartnerPortal for a moment.
  if (isTrackingStatusResolved(user) && !canUseTracking(user)) {
    return <PartnerPortal />;
  }

  return <Dashboard />;
}
