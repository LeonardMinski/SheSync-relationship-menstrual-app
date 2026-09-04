import { Card, CardContent } from "./Card";

interface PrivacyPreviewProps {
  partnerName: string;
  visible: string[];
  hidden: string[];
}

/**
 * "What [partner] can see" vs "Private — not shared" split panel. Both
 * lists must be driven by real sharing state — never fabricated content.
 */
export function PrivacyPreview({ partnerName, visible, hidden }: PrivacyPreviewProps) {
  return (
    <Card className="border-[color:var(--accent-rose)]/20 bg-[color:var(--accent-rose)]/5">
      <CardContent className="space-y-5 pt-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Live privacy preview
          </p>
          <p className="text-sm text-muted-foreground">
            What {partnerName} can currently see vs. what stays private.
          </p>
        </div>

        <div className="rounded-2xl border border-[color:var(--accent-sage)]/25 bg-bg-surface p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[color:var(--accent-sage)]">
            Visible to {partnerName}
          </p>
          {visible.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {visible.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-[color:var(--accent-sage-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-sage)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-bg-surface p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Private — not shared with partner
          </p>
          <ul className="flex flex-wrap gap-2">
            {hidden.map((item) => (
              <li
                key={item}
                className="rounded-full bg-bg-elevated px-3 py-1 text-xs font-semibold text-muted-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
