import React from "react";

import { cn } from "@/utils/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
  as = "h1",
}: SectionHeadingProps) {
  const Heading = as;

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <Heading className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {title}
        </Heading>
        {description && (
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
