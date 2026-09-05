import type { ComponentType } from "react";
import { Heart, MessageCircle, ShieldCheck } from "lucide-react";

export function SupportiveActions({
  partnerIsSharing,
}: {
  partnerIsSharing: boolean;
}) {
  return (
    <section
      className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md"
      data-testid="connect-supportive-actions"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-l-4 border-cta-start pl-4">
        <h2 className="text-xs font-black uppercase tracking-[0.16em] text-foreground">
          Supportive Actions
        </h2>
        {partnerIsSharing && (
          <p className="text-xs text-muted-foreground">
            Inspired by your partner&apos;s sharing
          </p>
        )}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SupportTile
          icon={Heart}
          title="Be present"
          text="Listen when your partner shares context. Full presence is the greatest gift."
        />
        <SupportTile
          icon={MessageCircle}
          title="Ask gently"
          text="Use the shared view as a conversation starter, not a scoreboard."
        />
        <SupportTile
          icon={ShieldCheck}
          title="Respect privacy"
          text="Treat hidden details as intentional, beautiful boundaries."
        />
      </div>
    </section>
  );
}

function SupportTile({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl bg-bg p-4">
      <Icon className="h-6 w-6 text-cta-start" aria-hidden="true" />
      <h3 className="mt-4 font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </article>
  );
}
