export function PartnerAccessRequired() {
  return (
    <div className="ss-page flex min-h-screen items-center justify-center px-5 text-[color:var(--design-ink)]">
      <div className="ss-card w-full max-w-md p-8 text-center">
        <h1 className="ss-display mb-4 text-4xl font-bold text-[color:var(--design-ink)]">
          Access Required
        </h1>
        <p className="text-[color:var(--design-muted)]">
          Please sign in to access partner features.
        </p>
      </div>
    </div>
  );
}
