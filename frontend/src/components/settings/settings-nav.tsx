"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = ["profile", "security", "preferences", "account"] as const;

export function SettingsNav() {
  const t = useTranslations("settings.tabs");
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const href = `/dashboard/settings/${tab}`;
        const active = pathname === href;
        return (
          <Link
            key={tab}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition",
              active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(tab)}
          </Link>
        );
      })}
    </nav>
  );
}

export function SettingsSection({ title, description, children, footer, danger }: {
  title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode; danger?: boolean;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-soft", danger ? "border-destructive/30" : "border-border")}>
      <div className="grid gap-6 p-6 md:grid-cols-[260px_1fr]">
        <div>
          <h2 className={cn("font-semibold", danger && "text-destructive")}>{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="grid content-start gap-5">{children}</div>
      </div>
      {footer && <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
    </section>
  );
}
