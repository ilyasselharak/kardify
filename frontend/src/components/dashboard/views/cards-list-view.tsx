"use client";

import { ChevronLeft, ChevronRight, CreditCard, PlusCircle, Search, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";
import { CardGridItem } from "@/components/cards/card-grid-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import type { CardStatus } from "@/lib/api/types";
import { useCards } from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { EmptyState, ErrorState } from "../empty-state";
import { PageHeader } from "../page-header";

const PAGE_SIZE = 12;

export function CardsListView() {
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const errorMessage = useErrorMessage();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CardStatus | "ALL">("ALL");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());

  const query = useCards({ search: deferredSearch || undefined, status: status === "ALL" ? undefined : status, sort, page, pageSize: PAGE_SIZE });
  const filtered = !!deferredSearch || status !== "ALL";
  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / PAGE_SIZE)) : 1;

  const resetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={<Button asChild><Link href="/dashboard/cards/new"><PlusCircle /> {t("create")}</Link></Button>}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={tc("search")}
            className="ps-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1); }}>
          <SelectTrigger className="sm:w-44" aria-label={t("filterStatus")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
            <SelectItem value="ACTIVE">{t("status.ACTIVE")}</SelectItem>
            <SelectItem value="DRAFT">{t("status.DRAFT")}</SelectItem>
            <SelectItem value="INACTIVE">{t("status.INACTIVE")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v as typeof sort); setPage(1); }}>
          <SelectTrigger className="sm:w-44" aria-label={t("sort")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("newest")}</SelectItem>
            <SelectItem value="oldest">{t("oldest")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
        </div>
      ) : query.isError ? (
        <ErrorState message={`${t("loadError")} ${errorMessage(query.error)}`} onRetry={() => query.refetch()} retryLabel={tc("retry")} />
      ) : query.data && query.data.items.length === 0 ? (
        filtered ? (
          <EmptyState icon={SearchX} title={t("noResults")} action={<Button variant="outline" onClick={resetFilters}>{t("clearFilters")}</Button>} />
        ) : (
          <EmptyState
            icon={CreditCard}
            title={t("emptyTitle")}
            description={t("emptyBody")}
            action={<Button asChild><Link href="/dashboard/cards/new"><PlusCircle /> {t("emptyCta")}</Link></Button>}
          />
        )
      ) : (
        <>
          <div className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
            {query.data?.items.map((card) => <CardGridItem key={card.id} card={card} />)}
          </div>
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={tc("back")}>
                <ChevronLeft className="rtl-flip" />
              </Button>
              <span className="text-sm text-muted-foreground">{t("pagination", { page, total: totalPages })}</span>
              <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label={tc("next")}>
                <ChevronRight className="rtl-flip" />
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
