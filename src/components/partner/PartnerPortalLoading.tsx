import LoadingSpinner from "@/components/ui/LoadingSpinner";

export function PartnerPortalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <LoadingSpinner />
    </div>
  );
}
