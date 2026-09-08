"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { LogOut, Moon, Settings as SettingsIcon, Sun } from "lucide-react";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { canUseTracking } from "@/features/account/capabilities";
import { getPartnerStatus } from "@/services/partner/data";
import { cn } from "@/utils/cn";

import { getVisibleNavItems, isItemActive } from "./navItems";
import {
  CoachNavIcon,
  ConnectNavIcon,
  CycleNavIcon,
  HomeNavIcon,
  PartnerIndicatorIcon,
  VaultNavIcon,
} from "./sidebar-icons";

const NAV_ICONS: Record<string, (props: React.SVGProps<SVGSVGElement>) => React.ReactElement> = {
  "/dashboard": HomeNavIcon,
  "/cycle": CycleNavIcon,
  "/coach": CoachNavIcon,
  "/connect": ConnectNavIcon,
  "/vault": VaultNavIcon,
};

/**
 * The approved Vault Figma design's 260px sidebar, promoted to the
 * canonical DESKTOP shell for the whole authenticated app (Home, Cycle,
 * Coach, Connect, Vault) — see docs/vault-v1.md "Desktop shell". Fixed
 * dark (#110710 etc.) regardless of the app's light/dark content
 * preference: Figma never shows a light variant of this sidebar across
 * any of the 22 approved frames, and a single always-dark rail next to a
 * light/dark-togglable content area is a deliberate, documented choice —
 * not an invented redesign.
 *
 * Hidden below `md`; MobileHeader + BottomTabBar (unchanged, no approved
 * mobile Figma frames exist for Vault) remain the mobile shell.
 */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, signOut } = useAuth();
  const { state, toggleTheme } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerLoaded, setPartnerLoaded] = useState(false);

  const visibleNavItems = getVisibleNavItems(canUseTracking(user));

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void getPartnerStatus().then((status) => {
      if (cancelled) return;
      const activeLink =
        status.ownerLink?.status === "active"
          ? status.ownerLink
          : status.viewerLink?.status === "active"
            ? status.viewerLink
            : null;
      setPartnerName(activeLink?.personName ?? null);
      setPartnerLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const tierLabel = user.subscriptionTier && user.subscriptionTier !== "free" ? "Premium Member" : "Free Account";

  return (
    <aside
      className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col justify-between border-r border-[#2a1425] bg-[#110710] p-8 md:flex"
      data-testid="desktop-sidebar"
    >
      <div className="flex w-full flex-col gap-12">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#e57c95]">
            <span className="font-instrument text-xl italic text-[#0d080d]">S</span>
          </span>
          <span className="font-geist text-lg font-bold text-[#f7f4f6]">SheSync+</span>
        </Link>

        <nav aria-label="Primary navigation" className="flex w-full flex-col gap-2">
          {visibleNavItems.map((item) => {
            const active = isItemActive(pathname, item.href);
            const Icon = NAV_ICONS[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e57c95]",
                  active
                    ? "border border-[#48263e] bg-[rgba(229,124,149,0.12)]"
                    : "border border-transparent hover:bg-[#1c101b]",
                )}
              >
                {Icon && (
                  <Icon
                    className={cn("size-[18px] shrink-0", active ? "text-[#e57c95]" : "text-[#877484]")}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "font-geist text-[15px]",
                    active ? "font-semibold text-[#e57c95]" : "font-medium text-[#bcaeba]",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex w-full flex-col gap-4 border-t border-[#2a1425] pt-5">
        <div className="flex w-full items-center gap-2 rounded-xl bg-[#1c101b] px-3 py-2">
          <PartnerIndicatorIcon
            className={cn("size-2 shrink-0", partnerName ? "text-[#82a992]" : "text-[#877484]")}
            aria-hidden="true"
          />
          <p className="font-geist text-[13px] text-[#bcaeba]">
            {!partnerLoaded ? (
              "Loading..."
            ) : partnerName ? (
              <>
                Partner: <span className="font-semibold text-[#f7f4f6]">{partnerName}</span>
              </>
            ) : (
              "No partner connected"
            )}
          </p>
        </div>

        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={`Account menu for ${user.name}`}
            className="flex w-full items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e57c95]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1c101b] font-geist text-sm font-bold text-[#f7f4f6]">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-geist text-sm font-semibold text-[#f7f4f6]">{user.name}</span>
              <span className="font-geist text-[11px] text-[#877484]">{tierLabel}</span>
            </span>
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-2xl border border-[#2a1425] bg-[#1c101b] p-2 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left font-geist text-sm font-semibold text-[#bcaeba] transition-colors hover:bg-[#251421] hover:text-[#f7f4f6]"
              >
                {state.isDarkMode ? (
                  <Sun className="h-5 w-5 shrink-0" aria-hidden="true" />
                ) : (
                  <Moon className="h-5 w-5 shrink-0" aria-hidden="true" />
                )}
                <span>{state.isDarkMode ? "Light content mode" : "Dark content mode"}</span>
              </button>
              <Link
                href="/settings"
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left font-geist text-sm font-semibold text-[#bcaeba] transition-colors hover:bg-[#251421] hover:text-[#f7f4f6]"
              >
                <SettingsIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Settings</span>
              </Link>
              {session && (
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={async () => {
                    setSigningOut(true);
                    try {
                      await signOut();
                      router.replace("/");
                      router.refresh();
                    } finally {
                      setSigningOut(false);
                    }
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left font-geist text-sm font-semibold text-[#bcaeba] transition-colors hover:bg-[#251421] hover:text-[#f7f4f6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{signingOut ? "Logging out..." : "Log out"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
