import { BarChart3, CreditCard, HelpCircle, LayoutDashboard, PlusCircle, Settings } from "lucide-react";

export const DASHBOARD_NAV = [
  { href: "/dashboard", key: "overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/cards", key: "cards", icon: CreditCard, exact: false },
  { href: "/dashboard/cards/new", key: "create", icon: PlusCircle, exact: true },
  { href: "/dashboard/analytics", key: "analytics", icon: BarChart3, exact: false },
  { href: "/dashboard/settings", key: "settings", icon: Settings, exact: false },
  { href: "/dashboard/help", key: "help", icon: HelpCircle, exact: false },
] as const;
