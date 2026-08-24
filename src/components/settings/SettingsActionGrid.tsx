import type { ComponentType } from "react";
import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";

export function SettingsActionGrid() {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <SettingsAction
        href="/settings/privacy"
        icon={ShieldCheck}
        title="Privacy & Partner"
        description="Choose exactly what your partner can see."
      />
      <SettingsAction
        href="/partner"
        icon={Users}
        title="Partner View"
        description="Preview the read-only partner experience."
      />
    </section>
  );
}

function SettingsAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[2rem] border border-border bg-bg-surface p-6 shadow-md transition hover:border-cta-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
    >
      <Icon className="h-7 w-7 text-cta-start" aria-hidden="true" />
      <h2 className="mt-5 text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}
