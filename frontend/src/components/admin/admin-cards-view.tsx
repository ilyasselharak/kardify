"use client";

import { Building2, CreditCard, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { StatusBadge } from "@/components/cards/status-badge";
import { EmptyState, ErrorState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { CardStatus } from "@/lib/api/types";
import { useAdminCards, useAdminCompanies } from "@/lib/hooks/use-admin";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatDate } from "@/lib/utils";
import { AdminTable, Pager } from "./admin-ui";
import { CardAdminActions } from "./card-admin-actions";

const PAGE_SIZE = 20;
const NO_COMPANY = "__none__";

export function AdminCardsView() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tcs = useTranslations("cards");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CardStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // Company filter lives in the URL (?company=… or ?company=__none__) so it can be shared and linked.
  const company = params.get("company") ?? "ALL";
  const setCompany = (value: string) => {
    setPage(1);
    router.replace(value === "ALL" ? pathname : `${pathname}?company=${encodeURIComponent(value)}`);
  };
  const companies = useAdminCompanies();
  const q = useDeferredValue(search.trim());
  const cards = useAdminCards({
    search: q || undefined,
    status: status === "ALL" ? undefined : status,
    company: company !== "ALL" && company !== NO_COMPANY ? company : undefined,
    noCompany: company === NO_COMPANY ? "1" : undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const companyLabel = company === NO_COMPANY ? t("noCompany") : company;

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" className="ps-9" placeholder={t("searchCards")} aria-label={tc("search")} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={company} onValueChange={setCompany}>
          <SelectTrigger className="sm:w-60" aria-label={t("columns.company")}>
            <Building2 className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="ALL">{t("allCompanies")}</SelectItem>
            {!!companies.data?.noCompany && <SelectItem value={NO_COMPANY}>{t("noCompany")} ({companies.data.noCompany})</SelectItem>}
            {company !== "ALL" && company !== NO_COMPANY && !companies.data?.items.some((c) => c.name.toLowerCase() === company.toLowerCase()) && (
              <SelectItem value={company}>{company}</SelectItem>
            )}
            {companies.data?.items.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name} ({c.cards})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1); }}>
          <SelectTrigger className="sm:w-44" aria-label={t("columns.status")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{tcs("allStatuses")}</SelectItem>
            <SelectItem value="ACTIVE">{tcs("status.ACTIVE")}</SelectItem>
            <SelectItem value="DRAFT">{tcs("status.DRAFT")}</SelectItem>
            <SelectItem value="INACTIVE">{tcs("status.INACTIVE")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {company !== "ALL" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 ps-3 pe-1 font-medium text-primary">
            <Building2 className="size-3.5" />
            <span dir="auto">{companyLabel}</span>
            <button type="button" onClick={() => setCompany("ALL")} aria-label={t("clearCompany")} className="flex size-5 items-center justify-center rounded-full hover:bg-primary/15">
              <X className="size-3" />
            </button>
          </span>
          {cards.data && <span className="text-muted-foreground">{t("companyCount", { count: cards.data.total })}</span>}
        </div>
      )}

      {cards.isError ? (
        <ErrorState message={errorMessage(cards.error)} onRetry={() => cards.refetch()} retryLabel={tc("retry")} />
      ) : cards.isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : cards.data?.items.length === 0 ? (
        <EmptyState icon={CreditCard} title={t("empty")} />
      ) : (
        <Card className={cards.isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminTable head={[t("columns.card"), t("columns.company"), t("columns.owner"), t("columns.status"), t("columns.views"), t("columns.updated"), <span key="a" className="sr-only">{t("columns.actions")}</span>]}>
            {cards.data?.items.map((c) => (
              <tr key={c.id} className="transition hover:bg-muted/40">
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate font-medium" dir="auto">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground"><bdi dir="ltr">/card/{c.slug}</bdi></p>
                </td>
                <td className="max-w-[12rem] px-4 py-3">
                  {c.companyName ? (
                    <button type="button" onClick={() => setCompany(c.companyName!)} className="block max-w-full truncate text-start hover:text-primary" dir="auto" title={t("filterByCompany")}>
                      {c.companyName}
                    </button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="max-w-[16rem] px-4 py-3">
                  <Link href={`/dashboard/admin/users/${c.user.id}`} className="block truncate hover:text-primary">
                    <bdi dir="ltr">{c.user.email}</bdi>
                  </Link>
                </td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 tabular-nums">{c.views}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(c.updatedAt, locale)}</td>
                <td className="px-4 py-3 text-end"><CardAdminActions card={c} /></td>
              </tr>
            ))}
          </AdminTable>
          {cards.data && <Pager page={page} total={cards.data.total} pageSize={PAGE_SIZE} onChange={setPage} />}
        </Card>
      )}
    </div>
  );
}
