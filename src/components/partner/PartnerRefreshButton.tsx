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
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--design-border)] bg-white text-[color:var(--design-muted)] shadow-[var(--design-shadow-soft)] hover:text-[color:var(--design-brown)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)]"
      data-testid="refresh-button"
      aria-label="Refresh partner data"
    >
      <RefreshCw
        className={refreshing ? "h-5 w-5 animate-spin" : "h-5 w-5"}
        aria-hidden="true"
      />
    </button>
  );
}
