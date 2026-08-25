import type { ComponentType } from "react";
import { Heart, MessageCircle, Users } from "lucide-react";

export function SupportiveActions() {
  return (
    <section
      className="ss-card p-6 sm:p-8"
      data-testid="supportive-actions"
    >
      <h2 className="ss-display text-3xl font-bold text-[color:var(--design-ink)]">
        Supportive Actions
      </h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SupportTile
          icon={Heart}
          title="Be present"
          text="Listen when your partner shares context."
        />
        <SupportTile
          icon={MessageCircle}
          title="Ask gently"
          text="Use the shared view as a conversation starter."
        />
        <SupportTile
          icon={Users}
          title="Respect privacy"
          text="Treat hidden details as intentional boundaries."
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
    <article className="rounded-2xl bg-[color:var(--design-footer)] p-5">
      <Icon
        className="h-6 w-6 text-[color:var(--design-sage)]"
        aria-hidden="true"
      />
      <h3 className="mt-4 font-bold text-[color:var(--design-ink)]">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-[color:var(--design-muted)]">
        {text}
      </p>
    </article>
  );
}
