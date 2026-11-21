import { BarChart3, CreditCard, FileText, HelpCircle, LayoutDashboard, LayoutTemplate, Settings, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  key: string;
  icon: LucideIcon;
  /** Pathnames (locale-free) that mark this item as active. */
  match: (pathname: string) => boolean;
}

const under = (base: string) => (p: string) => p === base || p.startsWith(`${base}/`);

export const DASHBOARD_NAV: { group: "main" | "account"; items: NavItem[] }[] = [
  {
    group: "main",
    items: [
      { href: "/dashboard", key: "overview", icon: LayoutDashboard, match: (p) => p === "/dashboard" },
      { href: "/dashboard/cards", key: "cards", icon: CreditCard, match: under("/dashboard/cards") },
      { href: "/dashboard/cv", key: "cv", icon: FileText, match: under("/dashboard/cv") },
      { href: "/dashboard/templates", key: "templates", icon: LayoutTemplate, match: under("/dashboard/templates") },
      { href: "/dashboard/analytics", key: "analytics", icon: BarChart3, match: under("/dashboard/analytics") },
    ],
  },
  {
    group: "account",
    items: [
      { href: "/dashboard/settings/profile", key: "profile", icon: UserRound, match: (p) => p === "/dashboard/settings" || p === "/dashboard/settings/profile" },
      { href: "/dashboard/settings/preferences", key: "settings", icon: Settings, match: (p) => p === "/dashboard/settings/preferences" || p === "/dashboard/settings/account" },
      { href: "/dashboard/settings/security", key: "security", icon: ShieldCheck, match: (p) => p === "/dashboard/settings/security" },
      { href: "/dashboard/help", key: "help", icon: HelpCircle, match: under("/dashboard/help") },
    ],
  },
];
