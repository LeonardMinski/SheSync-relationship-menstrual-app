import { Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import { FeaturePlaceholder } from "@/components/ui/FeaturePlaceholder";
import { StatusPill } from "@/components/ui/StatusPill";

/**
 * A clearly-labeled design preview of what a saved Vault entry will look
 * like once real persistence exists. This is NOT the signed-in user's real
 * data — the Vault has no backend yet, so the honest default state above is
 * the empty state. This card only illustrates layout.
 */
export function VaultEntryPreviewCard() {
  return (
    <FeaturePlaceholder
      title="Design preview — not your real entries"
      description="This is what a saved entry will look like once Vault has real persistence. It isn't a list of anything you've written."
    >
      <Card className="opacity-90">
        <CardContent className="flex items-start justify-between gap-4 pt-4">
          <div className="space-y-1">
            <p className="font-display text-lg font-semibold text-foreground">
              Example entry title
            </p>
            <p className="text-sm text-muted-foreground">
              A short excerpt of the entry content would appear here...
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <StatusPill tone="muted">example tag</StatusPill>
              <StatusPill tone="muted">another tag</StatusPill>
            </div>
          </div>
          <StatusPill tone="rose">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Private
          </StatusPill>
        </CardContent>
      </Card>
    </FeaturePlaceholder>
  );
}
