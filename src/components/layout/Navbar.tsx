"use client";

import React, { useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  Users,
  Settings,
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  BarChart3,
  Brain,
  CreditCard,
  HeartHandshake,
  LockKeyhole,
  Menu,
  Sparkles,
  X,
} from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  status?: "soon";
}

const coreNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/cycle",
    label: "Log",
    icon: CalendarDays,
  },
  {
    href: "/partner",
    label: "Partner",
    icon: Users,
  },
  {
    href: "/dashboard#insights",
    label: "Insights",
    icon: BarChart3,
    status: "soon",
  },
  {
    href: "/coach",
    label: "Coach",
    icon: Sparkles,
    status: "soon",
  },
  {
    href: "/ai-coach",
    label: "AI Coach",
    icon: Brain,
    status: "soon",
  },

  {
    href: "/fantasy",
    label: "Fantasy Vault",
    icon: LockKeyhole,
    status: "soon",
  },
  {
    href: "/intimacy",
    label: "Intimacy",
    icon: HeartHandshake,
    status: "soon",
  },
  {
    href: "/partner/intimacy",
    label: "Partner Intimacy",
    icon: Users,
    status: "soon",
  },
  {
    href: "/pricing",
    label: "Pricing",
    icon: CreditCard,
    status: "soon",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

const allNavItems = coreNavItems;

interface NavbarProps {
  className?: string;
}

function isItemActive(pathname: string, href: string) {
  const itemPath = href.split("#")[0];
  const isHashLink = href.includes("#");

  return (
    !isHashLink &&
    (pathname === itemPath || pathname.startsWith(`${itemPath}/`))
  );
}

export function Navbar(_props: NavbarProps) {
  return null;
}

function FeatureLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={item.status === "soon" ? false : undefined}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start",
        active
          ? "bg-cta-start text-[color:var(--cta-foreground)]"
          : "text-muted-foreground hover:bg-bg-elevated hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.status === "soon" && (
        <span
          aria-label="Coming soon"
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]",
            active
              ? "bg-bg-elevated text-[color:var(--cta-foreground)]"
              : "bg-bg-elevated text-muted-foreground",
          )}
        >
          Soon
        </span>
      )}
    </Link>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-2">
      {title && (
        <p className="px-4 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <FeatureLink
            key={item.href}
            item={item}
            active={isItemActive(pathname, item.href)}
          />
        ))}
      </div>
    </div>
  );
}

export function AppSidebar({ className }: NavbarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border bg-[var(--bg-surface)] px-5 py-8 text-foreground shadow-lg md:flex md:flex-col",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className="mb-10 flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cta-start text-[color:var(--cta-foreground)]">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>SheSync+</span>
      </Link>

      <nav
        aria-label="Primary navigation"
        className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1"
      >
        <SidebarSection items={allNavItems} pathname={pathname} />
      </nav>

      <div className="mt-6 space-y-5">
        <Link
          href="/settings/privacy"
          className="flex min-h-11 items-center justify-center rounded-full bg-cta-start px-4 text-sm font-bold text-[color:var(--cta-foreground)] shadow-[var(--shadow-glow)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-start"
        >
          Privacy Controls
        </Link>

        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-3">
            <Avatar size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                Sarah J.
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Premium Secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

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
            {allNavItems.map((item) => (
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
          </div>
        </nav>
      )}
    </>
  );
}
