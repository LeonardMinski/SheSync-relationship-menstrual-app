"use client";

/**
 * Dashboard Page - Home destination for both account types.
 *
 * Tracking-enabled accounts (including dual-role viewers) get the full
 * tracked Dashboard, unchanged. Partner-only accounts with an active
 * connection get the purpose-built PartnerHome ("Hey Alex" design).
 * Partner-only accounts with no active connection yet fall back to
 * PartnerPortal, which already correctly handles no-partner/pending/
 * declined states — no need to rebuild those from scratch.
 */
import Dashboard from "@/components/dashboard/Dashboard";
import PartnerPortal from "@/components/partner/PartnerPortal";
import { PartnerHome } from "@/components/relationship/PartnerHome";
import { useAuth } from "@/context/AuthContext";
import { canUseTracking, isTrackingStatusResolved } from "@/features/account/capabilities";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

function PartnerOnlyHome() {
  const { user, viewerLink, loading, dataLoading } = usePartnerPortalData();

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div
          className="h-9 w-9 motion-reduce:animate-none animate-spin rounded-full border-2 border-border border-t-cta-start"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!viewerLink || viewerLink.status !== "active") {
    return <PartnerPortal />;
  }

  const firstName = user?.name?.split(" ")[0] || user?.name || "there";

  return (
    <div className="min-h-screen bg-bg pb-10 pt-6">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
        <PartnerHome
          ownerId={viewerLink.owner_user_id}
          ownerName={viewerLink.personName}
          viewerFirstName={firstName}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  // While tracking status is still resolving, keep showing the tracked
  // Dashboard's own loading state (it already handles `!user`/loading)
  // rather than flashing the partner experience first — canUseTracking is
  // false during this same window, so without this check every account
  // would start there for a moment.
  if (isTrackingStatusResolved(user) && !canUseTracking(user)) {
    return <PartnerOnlyHome />;
  }

  return <Dashboard />;
}
