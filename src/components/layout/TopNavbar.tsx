"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/utils/cn";

interface TopNavbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  isDark?: boolean;
  onThemeToggle?: () => void;
  userAvatar?: string;
  onAvatarUpload?: (file: File) => void;
}

/**
 * Page-header bar. Primary navigation lives in TopNav (desktop) and
 * BottomTabBar (mobile) — this component only renders the current page's
 * title/subtitle and page-local actions, it does not duplicate site nav.
 */
export function TopNavbar({
  title,
  subtitle,
  actions,
  className,
  isDark = false,
  onThemeToggle,
  userAvatar,
  onAvatarUpload,
}: TopNavbarProps) {
  return (
    <header
      className={cn(
        // top-14 accounts for MobileHeader's 56px height so the two sticky
        // bars stack instead of overlapping on mobile; md:static drops this
        // entirely once TopNav (desktop) is the only chrome above it.
        "sticky top-14 z-30 border-b border-border bg-[var(--bg-surface)] shadow-md md:static md:top-0 md:shadow-none",
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex min-h-16 items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground md:text-xl">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-0.5 hidden truncate text-sm text-muted-foreground sm:block">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {actions && (
              <div className="hidden items-center gap-2 sm:flex">
                {actions}
              </div>
            )}

            {onThemeToggle && (
              <button
                type="button"
                onClick={onThemeToggle}
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}

            {onAvatarUpload && (
              <Avatar
                src={userAvatar}
                size="md"
                editable
                onUpload={onAvatarUpload}
              />
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 pb-3 sm:hidden">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
