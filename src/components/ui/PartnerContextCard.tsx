import type { ReactNode } from "react";
import { Users } from "lucide-react";

import { Card, CardContent } from "./Card";
import { StatusPill } from "./StatusPill";

interface PartnerContextCardProps {
  partnerName: string;
  statusLabel: string;
  statusTone?: "sage" | "amber" | "muted";
  meta?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

/** Compact "connected with X" summary card — always driven by real partner data from the caller. */
export function PartnerContextCard({
  partnerName,
  statusLabel,
  statusTone = "sage",
  meta,
  actions,
  children,
}: PartnerContextCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-elevated text-foreground">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">Connected with {partnerName}</p>
              <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
            </div>
            {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
          </div>
        </div>
        {actions}
      </CardContent>
      {children}
    </Card>
  );
}
