import LoadingSpinner from "@/components/ui/LoadingSpinner";

export function PartnerPortalLoading() {
  return (
    <div className="ss-page flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
