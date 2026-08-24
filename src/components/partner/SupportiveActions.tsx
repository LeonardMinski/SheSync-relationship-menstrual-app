import type { ComponentType } from "react";
import { Heart, MessageCircle, Users } from "lucide-react";

export function SupportiveActions() {
  return (
    <section
      className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md"
      data-testid="supportive-actions"
    >
      <h2 className="text-2xl font-bold text-foreground">Supportive Actions</h2>
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
    <article className="rounded-2xl bg-bg p-4">
      <Icon className="h-6 w-6 text-cta-start" aria-hidden="true" />
      <h3 className="mt-4 font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </article>
  );
}
