import { Eye } from "lucide-react";

export function PartnerPortalHero({
  partnerName,
}: {
  partnerName?: string | null;
}) {
  return (
    <section className="mx-auto max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--design-border)] bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--design-muted)]">
        <Eye
          className="h-4 w-4 text-[color:var(--design-sage)]"
          aria-hidden="true"
        />
        Partner Perspective
      </div>
      <h1 className="ss-display mt-7 text-5xl font-bold tracking-tight text-[color:var(--design-brown)] md:text-6xl">
        {partnerName || "Partner"}&apos;s Context
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-xl leading-8 text-[color:var(--design-muted)]">
        A calm, read-only view of the details they explicitly shared.
      </p>
    </section>
  );
}
