import Link from "next/link";
import { Heart, Lock, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

const LINKS: {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    href: "/coach",
    label: "Ask Coach",
    description: "Reflect on patterns in your logs.",
    icon: Sparkles,
  },
  {
    href: "/connect",
    label: "Explore Connect",
    description: "Cards, boundaries, and your partner.",
    icon: Heart,
  },
  {
    href: "/vault",
    label: "Open Vault",
    description: "A private place for your own thoughts.",
    icon: Lock,
  },
];

export function QuickExploreLinks() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {LINKS.map(({ href, label, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex min-h-[44px] flex-col gap-2 rounded-2xl border border-border bg-bg-surface p-4 transition-colors hover:border-cta-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
        >
          <Icon className="h-5 w-5 text-[color:var(--accent-rose)]" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </Link>
      ))}
    </div>
  );
}
