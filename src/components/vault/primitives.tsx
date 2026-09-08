import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

/**
 * Vault's shared visual primitives. The approved Figma design (Section
 * "Vault V1 — Approved Implementation") shows its own fixed dark "room" —
 * consistent across all 22 frames — layered on top of the app's real
 * shell (TopNav/MobileHeader/BottomTabBar, unchanged; there is no sidebar
 * anywhere in the current app, see src/app/(app)/layout.tsx). Rather than
 * fork the shared nav shell to match Figma's mockup chrome, every Vault
 * page wraps its content in <VaultRoom>, which applies the .vault-theme
 * token scope (src/styles/vault-tokens.css) to just that content area.
 * TopNav stays in the user's normal light/dark preference, matching every
 * other route — only the Vault "room" itself is a deliberately fixed dark
 * mood, per the design.
 */

export function VaultRoom({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("vault-theme min-h-screen bg-[var(--vault-bg)] text-[var(--vault-text-primary)]", className)}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-14">{children}</div>
    </div>
  );
}

export function VaultBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[var(--vault-text-secondary)] transition-colors hover:text-[var(--vault-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vault-accent-rose)]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

interface VaultHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  pill?: React.ReactNode;
  reassurance?: React.ReactNode;
  actions?: React.ReactNode;
}

/** The repeated "welcome-header" pattern seen across nearly every frame. */
export function VaultHeader({ eyebrow, title, subtitle, pill, reassurance, actions }: VaultHeaderProps) {
  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="space-y-2">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--vault-accent-rose)]">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl italic text-[var(--vault-text-primary)] sm:text-4xl">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {pill}
          {actions}
        </div>
      </div>
      {(subtitle || reassurance) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {subtitle && <p className="max-w-2xl text-base text-[var(--vault-text-secondary)]">{subtitle}</p>}
          {reassurance}
        </div>
      )}
    </div>
  );
}

type VaultPillTone = "rose" | "purple" | "sage" | "muted";

const VAULT_PILL_TONE_CLASSES: Record<VaultPillTone, string> = {
  rose: "bg-[var(--vault-accent-rose-tint)] border-[var(--vault-accent-rose-border)] text-[var(--vault-accent-rose)]",
  purple: "bg-[var(--vault-accent-purple-tint)] border-[color:var(--vault-accent-purple)]/40 text-[var(--vault-accent-purple)]",
  sage: "bg-[var(--vault-accent-sage-tint)] border-[color:var(--vault-accent-sage)]/40 text-[var(--vault-accent-sage)]",
  muted: "bg-[var(--vault-bg-elevated)] border-[var(--vault-border-surface)] text-[var(--vault-text-secondary)]",
};

export function VaultPill({
  tone,
  children,
  className,
}: {
  tone: VaultPillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold",
        VAULT_PILL_TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The sage "Private to you · ..." reassurance pill repeated across every frame. */
export function PrivacyReassurance({ children }: { children: React.ReactNode }) {
  return (
    <VaultPill tone="sage" className="rounded-md px-2.5 py-1">
      {children}
    </VaultPill>
  );
}

interface VaultCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "md" | "lg";
  highlighted?: boolean;
}

/** The elevated "workspace-card" container reused across every frame. */
export function VaultCard({ padding = "lg", highlighted = false, className, children, ...props }: VaultCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border",
        highlighted
          ? "border-[var(--vault-highlight-border)] bg-[var(--vault-highlight-bg)]"
          : "border-[var(--vault-border-surface)] bg-[var(--vault-bg-elevated)]",
        padding === "lg" ? "p-6 sm:p-8" : "p-4 sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type VaultButtonVariant = "cta" | "secondary" | "outline" | "ghost";

const VAULT_BUTTON_VARIANT_CLASSES: Record<VaultButtonVariant, string> = {
  cta: "bg-[var(--vault-accent-rose)] text-[var(--vault-text-on-accent)] hover:brightness-105",
  secondary:
    "border border-[var(--vault-border-surface)] bg-[var(--vault-bg-elevated)] text-[var(--vault-text-primary)] hover:border-[var(--vault-accent-rose)]",
  outline:
    "border border-[var(--vault-accent-rose)] bg-transparent text-[var(--vault-accent-rose)] hover:bg-[var(--vault-accent-rose-tint)]",
  ghost: "bg-transparent text-[var(--vault-accent-rose)] hover:bg-[var(--vault-accent-rose-tint)]",
};

/**
 * Vault's pill-shaped buttons (Figma is consistently rounded-[100px]) —
 * wraps the shared Button for touch targets/loading/disabled/focus-ring
 * behavior, using variant="ghost" as a neutral base so vault token classes
 * fully replace (not fight) the shared cta/secondary gradient styling.
 */
export function VaultButton({
  variant = "cta",
  className,
  ...props
}: React.ComponentProps<typeof Button> & { variant?: VaultButtonVariant }) {
  return (
    <Button
      variant="ghost"
      className={cn("rounded-full font-semibold", VAULT_BUTTON_VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}

const HEAT_LABELS = { warm: "Warm", hot: "Hot", bold: "Bold" } as const;

/**
 * Normalized to one consistent rose treatment for all three heat levels,
 * per the design spec's own normalization note (the mockups inconsistently
 * used rose for some instances and purple for others of the same label).
 */
export function HeatBadge({ heatLevel, className }: { heatLevel: keyof typeof HEAT_LABELS; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-[var(--vault-accent-rose-border)] bg-[var(--vault-accent-rose-tint)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--vault-accent-rose)]",
        className,
      )}
    >
      {HEAT_LABELS[heatLevel]}
    </span>
  );
}

export function VaultSectionLabel({ children, tone = "muted" }: { children: React.ReactNode; tone?: "rose" | "purple" | "muted" }) {
  const toneClass =
    tone === "rose"
      ? "text-[var(--vault-accent-rose)]"
      : tone === "purple"
        ? "text-[var(--vault-accent-purple)]"
        : "text-[var(--vault-text-muted)]";
  return <p className={cn("text-xs font-semibold uppercase tracking-wide", toneClass)}>{children}</p>;
}

export const VAULT_TEXTAREA_CLASSES =
  "w-full rounded-2xl border border-[var(--vault-border-surface)] bg-[var(--vault-bg-deep)] p-5 font-display text-lg italic text-[var(--vault-text-primary)] placeholder:text-[var(--vault-text-muted)] placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-[var(--vault-accent-rose)]";

export const VAULT_INPUT_CLASSES =
  "w-full rounded-xl border border-[var(--vault-border-surface)] bg-[var(--vault-bg-deep)] px-4 py-3 text-sm text-[var(--vault-text-primary)] placeholder:text-[var(--vault-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--vault-accent-rose)]";
