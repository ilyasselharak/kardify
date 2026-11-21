"use client";

import { ArrowDownUp, Building2, CreditCard, Search, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { useAdminCompanies } from "@/lib/hooks/use-admin";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatDate, formatNumber } from "@/lib/utils";
import { AdminTable } from "./admin-ui";

type SortKey = "people" | "cards" | "name";

/** Every company found on business cards, with how many people hold a card from it. */
export function AdminCompaniesView() {
  const t = useTranslations("admin.companies");
  const tc = useTranslations("common");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const companies = useAdminCompanies();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("people");
  const n = (v: number) => formatNumber(v, locale);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = (companies.data?.items ?? []).filter((c) => !q || c.name.toLowerCase().includes(q));
    return [...rows].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, locale) : b[sort] - a[sort] || a.name.localeCompare(b.name, locale),
    );
  }, [companies.data, search, sort, locale]);

  const all = companies.data?.items ?? [];
  const totals = {
    companies: all.length,
    people: all.reduce((s, c) => s + c.people, 0),
    cards: all.reduce((s, c) => s + c.cards, 0),
  };

  const sortButton = (key: SortKey, label: string) => (
    <button type="button" onClick={() => setSort(key)} className={`inline-flex items-center gap-1 ${sort === key ? "text-primary" : ""}`} aria-pressed={sort === key}>
      {label} <ArrowDownUp className="size-3" />
    </button>
  );

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("totalCompanies")} value={n(totals.companies)} icon={Building2} loading={companies.isLoading} />
        <StatCard label={t("totalPeople")} value={n(totals.people)} icon={Users} loading={companies.isLoading} hint={t("totalPeopleHint")} />
        <StatCard label={t("withoutCompany")} value={n(companies.data?.noCompany ?? 0)} icon={CreditCard} loading={companies.isLoading} hint={t("withoutCompanyHint")} />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" className="ps-9" placeholder={t("search")} aria-label={tc("search")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {companies.isError ? (
        <ErrorState message={errorMessage(companies.error)} onRetry={() => companies.refetch()} retryLabel={tc("retry")} />
      ) : companies.isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState icon={Building2} title={search ? t("noResults") : t("empty")} />
      ) : (
        <Card>
          <AdminTable
            head={[
              sortButton("name", t("columns.company")),
              sortButton("people", t("columns.employees")),
              sortButton("cards", t("columns.cards")),
              t("columns.published"),
              t("columns.lastUpdated"),
              <span key="a" className="sr-only">{t("columns.actions")}</span>,
            ]}
          >
            {items.map((c) => (
              <tr key={c.name} className="cursor-pointer transition hover:bg-muted/40" onClick={(e) => { if (!(e.target as HTMLElement).closest("a")) router.push(`/dashboard/admin/companies/view?name=${encodeURIComponent(c.name)}`); }}>
                <td className="max-w-xs px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-4" /></span>
                    <Link href={`/dashboard/admin/companies/view?name=${encodeURIComponent(c.name)}`} dir="auto" className="truncate font-medium hover:text-primary hover:underline">{c.name}</Link>
                  </span>
                </td>
                <td className="px-4 py-3 text-base font-semibold tabular-nums text-navy">{n(c.people)}</td>
                <td className="px-4 py-3 tabular-nums">{n(c.cards)}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{n(c.activeCards)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(c.lastUpdated, locale)}</td>
                <td className="px-4 py-3 text-end">
                  <Link href={`/dashboard/admin/companies/view?name=${encodeURIComponent(c.name)}`} className="text-sm font-medium whitespace-nowrap text-primary hover:underline">
                    {t("viewEmployees")}
                  </Link>
                </td>
              </tr>
            ))}
          </AdminTable>
        </Card>
      )}
    </div>
  );
}
