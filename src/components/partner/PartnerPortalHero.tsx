import { Eye } from "lucide-react";

export function PartnerPortalHero({
  partnerName,
}: {
  partnerName?: string | null;
}) {
  return (
    <section className="text-center md:text-left">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
        <Eye className="h-4 w-4 text-info" aria-hidden="true" />
        Partner Perspective
      </div>
      <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        {partnerName || "Partner"}&apos;s Context
      </h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        A calm, read-only view of the details they explicitly shared.
      </p>
    </section>
  );
}
