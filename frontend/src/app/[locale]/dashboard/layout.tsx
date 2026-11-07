import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DashboardLayout({ children }: LayoutProps<"/[locale]/dashboard">) {
  return <DashboardShell>{children}</DashboardShell>;
}
