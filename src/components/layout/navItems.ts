import { CalendarDays, Heart, Home, Lock, Sparkles } from "lucide-react";

import type { NavItem } from "@/types/navigation";

// Primary navigation. Settings is accessed from the avatar/profile menu,
// not from this list (see TopNav / MobileHeader).
export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/cycle",
    label: "Cycle",
    icon: CalendarDays,
  },
  {
    href: "/coach",
    label: "Coach",
    icon: Sparkles,
  },
  {
    href: "/connect",
    label: "Connect",
    icon: Heart,
  },
  {
    href: "/vault",
    label: "Vault",
    icon: Lock,
  },
];

// Partner-only accounts (tracking_enabled = false) get a deliberately
// simplified nav — everything that assumes self-tracking data is hidden,
// not just route-guarded. Home already carries their relationship/shared
// content (see (app)/dashboard/page.tsx), and Connect is universal.
const TRACKED_ONLY_HREFS = new Set(["/cycle", "/coach", "/vault"]);

export function getVisibleNavItems(canTrack: boolean): NavItem[] {
  if (canTrack) return navItems;
  return navItems.filter((item) => !TRACKED_ONLY_HREFS.has(item.href));
}

export function isItemActive(pathname: string, href: string) {
  const itemPath = href.split("#")[0];
  const isHashLink = href.includes("#");

  if (isHashLink) {
    return false;
  }

  if (pathname === itemPath) {
    return true;
  }

  return pathname.startsWith(`${itemPath}/`);
}
