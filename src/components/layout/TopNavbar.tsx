"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, Moon, ShieldCheck, Sun, X } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/utils/cn";

import { FeatureLink } from "./FeatureLink";
import { LogoutButton } from "./LogoutButton";
import { isItemActive, navItems } from "./navItems";

interface TopNavbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  showNotifications?: boolean;
  hasUnreadNotifications?: boolean;
  isDark?: boolean;
  onThemeToggle?: () => void;
  userAvatar?: string;
  onAvatarUpload?: (file: File) => void;
}

export function TopNavbar({
  title,
  subtitle,
  actions,
  className,
  showNotifications = false,
  hasUnreadNotifications = false,
  isDark = false,
  onThemeToggle,
  userAvatar,
  onAvatarUpload,
}: TopNavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 isolate border-b border-border bg-[var(--bg-surface)] shadow-md",
          className,
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex min-h-16 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated text-foreground transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start md:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>

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
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {actions && (
                <div className="hidden items-center gap-2 sm:flex">
                  {actions}
                </div>
              )}

              {showNotifications && (
                <button
                  type="button"
                  aria-label={
                    hasUnreadNotifications
                      ? "Notifications, unread items"
                      : "Notifications"
                  }
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                >
                  <Bell className="h-5 w-5" />

                  {hasUnreadNotifications && (
                    <span
                      aria-hidden="true"
                      className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[color:var(--accent-peach)] ring-2 ring-bg-surface"
                    />
                  )}
                </button>
              )}

              {onThemeToggle && (
                <button
                  type="button"
                  onClick={onThemeToggle}
                  aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
                >
                  {isDark ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
              )}

              <Avatar
                src={userAvatar}
                size="md"
                editable={Boolean(onAvatarUpload)}
                onUpload={onAvatarUpload}
              />
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2 pb-3 sm:hidden">
              {actions}
            </div>
          )}
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--bg)] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {isMobileMenuOpen && (
        <nav
          aria-label="Mobile feature navigation"
          className="fixed inset-x-3 top-20 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[1.5rem] border border-border bg-[var(--bg-surface)] p-4 shadow-lg md:hidden"
        >
          <div className="space-y-2">
            {navItems.map((item) => (
              <FeatureLink
                key={item.href}
                item={item}
                active={isItemActive(pathname, item.href)}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            ))}
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <FeatureLink
              item={{
                href: "/settings/privacy",
                label: "Privacy Controls",
                icon: ShieldCheck,
              }}
              active={isItemActive(pathname, "/settings/privacy")}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <LogoutButton onDone={() => setIsMobileMenuOpen(false)} />
          </div>
        </nav>
      )}
    </>
  );
}
