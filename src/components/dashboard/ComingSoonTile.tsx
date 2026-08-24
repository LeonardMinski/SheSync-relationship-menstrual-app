import type { ComponentType } from "react";

export function ComingSoonTile({
  label,
  description,
  icon: Icon,
}: {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-[2rem] border border-border bg-bg-surface p-5 opacity-75 shadow-md">
      <span className="rounded-md bg-bg-elevated px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
        Coming Soon
      </span>
      <div className="mt-5 flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-lg font-bold text-foreground">{label}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
}
