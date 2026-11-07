"use client";

import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { useMe } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/admin", key: "overview", exact: true },
  { href: "/dashboard/admin/users", key: "users", exact: false },
  { href: "/dashboard/admin/cards", key: "cards", exact: false },
  { href: "/dashboard/admin/audit", key: "audit", exact: false },
] as const;

/**
 * UI gate for the admin area. The API enforces the ADMIN role on every request;
 * this only avoids showing admin screens to regular users.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("admin");
  const tn = useTranslations("dashboard.nav");
  const pathname = usePathname();
  const { data: user } = useMe();

  if (user && user.role !== "ADMIN") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("forbiddenTitle")}
        description={t("forbiddenBody")}
        action={<Button asChild variant="outline"><Link href="/dashboard">{tn("overview")}</Link></Button>}
      />
    );
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} className="mb-6" />
      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition",
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${tab.key}`)}
            </Link>
          );
        })}
      </nav>
      {children}
    </>
  );
}
