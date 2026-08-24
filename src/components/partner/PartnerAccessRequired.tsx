export function PartnerAccessRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Access Required
        </h1>
        <p className="text-muted-foreground">
          Please sign in to access partner features.
        </p>
      </div>
    </div>
  );
}
