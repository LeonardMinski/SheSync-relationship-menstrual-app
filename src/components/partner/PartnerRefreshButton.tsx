import { RefreshCw } from "lucide-react";

export function PartnerRefreshButton({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-surface text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
      data-testid="refresh-button"
      aria-label="Refresh partner data"
    >
      <RefreshCw
        className={refreshing ? "h-5 w-5 motion-reduce:animate-none animate-spin" : "h-5 w-5"}
        aria-hidden="true"
      />
    </button>
  );
}
