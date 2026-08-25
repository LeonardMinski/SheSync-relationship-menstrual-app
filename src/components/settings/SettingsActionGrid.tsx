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
      className="ss-card p-6 transition hover:border-[color:var(--design-brown)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--design-brown)] sm:p-8"
    >
      <Icon
        className="h-7 w-7 text-[color:var(--design-sage)]"
        aria-hidden="true"
      />
      <h2 className="ss-display mt-5 text-3xl font-bold text-[color:var(--design-ink)]">
        {title}
      </h2>
      <p className="mt-2 text-base leading-relaxed text-[color:var(--design-muted)]">
        {description}
      </p>
    </Link>
  );
}
