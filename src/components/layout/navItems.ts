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
