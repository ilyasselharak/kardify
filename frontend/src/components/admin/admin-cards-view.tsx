"use client";

import { CreditCard, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";
import { StatusBadge } from "@/components/cards/status-badge";
import { EmptyState, ErrorState } from "@/components/dashboard/empty-state";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import type { CardStatus } from "@/lib/api/types";
import { useAdminCards } from "@/lib/hooks/use-admin";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatDate } from "@/lib/utils";
import { AdminTable, Pager } from "./admin-ui";
import { CardAdminActions } from "./card-admin-actions";

const PAGE_SIZE = 20;

export function AdminCardsView() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tcs = useTranslations("cards");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CardStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const q = useDeferredValue(search.trim());
  const cards = useAdminCards({ search: q || undefined, status: status === "ALL" ? undefined : status, page, pageSize: PAGE_SIZE });

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" className="ps-9" placeholder={t("searchCards")} aria-label={tc("search")} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
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

      {cards.isError ? (
        <ErrorState message={errorMessage(cards.error)} onRetry={() => cards.refetch()} retryLabel={tc("retry")} />
      ) : cards.isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : cards.data?.items.length === 0 ? (
        <EmptyState icon={CreditCard} title={t("empty")} />
      ) : (
        <Card className={cards.isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <AdminTable head={[t("columns.card"), t("columns.owner"), t("columns.status"), t("columns.views"), t("columns.updated"), <span key="a" className="sr-only">{t("columns.actions")}</span>]}>
            {cards.data?.items.map((c) => (
              <tr key={c.id} className="transition hover:bg-muted/40">
                <td className="max-w-xs px-4 py-3">
                  <p className="truncate font-medium" dir="auto">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground"><bdi dir="ltr">/card/{c.slug}</bdi></p>
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
