import {
  BarChart3,
  Brain,
  CalendarDays,
  CreditCard,
  HeartHandshake,
  Home,
  LockKeyhole,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import type { NavItem } from "@/types/navigation";

export const navItems: NavItem[] = [
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

export function isItemActive(pathname: string, href: string) {
  const itemPath = href.split("#")[0];
  const isHashLink = href.includes("#");

  if (isHashLink) {
    return false;
  }

  if (pathname === itemPath) {
    return true;
  }

  return itemPath === "/settings" && pathname.startsWith("/settings/");
}
