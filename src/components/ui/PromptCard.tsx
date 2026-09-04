import type { ReactNode } from "react";

import { cn } from "@/utils/cn";
import { Card, CardContent } from "./Card";
import { StatusPill } from "./StatusPill";

interface PromptCardProps {
  eyebrow: string;
  eyebrowTone?: "sage" | "rose" | "amber" | "muted";
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  /** Rose left border for the "current/primary" card in a grid. */
  highlighted?: boolean;
}

/** A prompt/suggestion tile — reused for Coach's "jobs to be done" cards and Connect's Explore prompts. */
export function PromptCard({
  eyebrow,
  eyebrowTone = "muted",
  title,
  description,
  actions,
  className,
  highlighted = false,
}: PromptCardProps) {
  return (
    <Card
      className={cn(
        "h-full",
        highlighted && "border-l-4 border-l-[color:var(--accent-rose)]",
        className,
      )}
    >
      <CardContent className="space-y-2 pt-4">
        <StatusPill tone={eyebrowTone}>{eyebrow}</StatusPill>
        <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {actions}
      </CardContent>
    </Card>
  );
}
