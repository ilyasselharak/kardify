import { BarChart3, CreditCard, FileText, HelpCircle, LayoutDashboard, LayoutTemplate, ScrollText, Settings, ShieldCheck, UserRound, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  /** Translation key; admin items use the `admin.tabs` namespace. */
  key: string;
  admin?: boolean;
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

/** Admins manage the platform; they don't get the client tools (cards, CVs, templates). */
export const ADMIN_NAV: { group: "admin" | "account"; items: NavItem[] }[] = [
  {
    group: "admin",
    items: [
      { href: "/dashboard/admin", key: "overview", admin: true, icon: LayoutDashboard, match: (p) => p === "/dashboard/admin" },
      { href: "/dashboard/admin/users", key: "users", admin: true, icon: Users, match: under("/dashboard/admin/users") },
      { href: "/dashboard/admin/cards", key: "cards", admin: true, icon: CreditCard, match: under("/dashboard/admin/cards") },
      { href: "/dashboard/admin/audit", key: "audit", admin: true, icon: ScrollText, match: under("/dashboard/admin/audit") },
    ],
  },
  {
    group: "account",
    items: [
      { href: "/dashboard/settings/profile", key: "profile", icon: UserRound, match: (p) => p === "/dashboard/settings" || p === "/dashboard/settings/profile" },
      { href: "/dashboard/settings/security", key: "security", icon: ShieldCheck, match: (p) => p === "/dashboard/settings/security" },
    ],
  },
];

/** Pages an admin may open; everything else in the dashboard redirects to the admin console. */
export const isAdminPath = (p: string) =>
  p.startsWith("/dashboard/admin") || p.startsWith("/dashboard/settings") || p.startsWith("/dashboard/help");
