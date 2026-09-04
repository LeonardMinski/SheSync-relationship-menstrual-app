"use client";

import Link from "next/link";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { usePartnerPortalData } from "@/hooks/usePartnerPortalData";

/**
 * A compact, honest partner-connection summary for the Connect hub. Real
 * data only — sourced from the same hook that powers the full /partner
 * experience. This intentionally does not re-implement partner linking; it
 * links out to /partner, which already has the complete, working flow.
 */
export function PartnerConnectSummary() {
  const { dataLoading, loading, ownerLink, ownSharingSummary, viewerLink } =
    usePartnerPortalData();

  if (loading || dataLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle>Partner connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-4 w-48 rounded bg-bg-elevated" />
        </CardContent>
      </Card>
    );
  }

  if (!ownerLink && !viewerLink) {
    return (
      <EmptyState
        icon={Users}
        title="No partner connected yet"
        description="Invite a partner to share cycle context and take part in reflections and boundaries together, at your own pace."
        action={
          <Link href="/partner">
            <Button variant="cta">Invite a partner</Button>
          </Link>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Partner connection</CardTitle>
        {ownerLink?.status === "active" ? (
          <StatusPill tone="sage">Sharing Active</StatusPill>
        ) : ownerLink?.status === "pending" ? (
          <StatusPill tone="warning">Invitation pending</StatusPill>
        ) : viewerLink?.status === "pending" ? (
          <StatusPill tone="warning">Invitation waiting on you</StatusPill>
        ) : (
          <StatusPill tone="muted">Not connected</StatusPill>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {ownerLink?.status === "active" && (
          <p className="text-sm text-muted-foreground">
            {ownSharingSummary.length > 0
              ? `Sharing: ${ownSharingSummary.join(", ")}`
              : "Nothing is currently shared with your partner."}
          </p>
        )}
        {ownerLink?.status === "pending" && (
          <p className="text-sm text-muted-foreground">
            Waiting for {ownerLink.personEmail} to respond.
          </p>
        )}
        {viewerLink?.status === "pending" && (
          <p className="text-sm text-muted-foreground">
            {viewerLink.personName} invited you to connect — review it on the Partner page.
          </p>
        )}
        <Link href="/partner">
          <Button variant="secondary">Manage Space</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
