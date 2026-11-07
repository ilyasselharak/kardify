"use client";

import { Contact, Eye, Lock, MousePointerClick, QrCode, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ActivityList } from "@/components/analytics/activity-list";
import { EngagementBars } from "@/components/analytics/engagement-bars";
import { ViewsChart } from "@/components/analytics/views-chart";
import { SocialIcon } from "@/components/cards/social-icons";
import { StatusBadge } from "@/components/cards/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import type { AnalyticsRange, EventCounts, SeriesPoint, SocialPlatform } from "@/lib/api/types";
import { useAnalyticsOverview, useCardAnalytics } from "@/lib/hooks/use-analytics";
import { useCards } from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatNumber } from "@/lib/utils";
import { ErrorState } from "../empty-state";
import { PageHeader } from "../page-header";
import { StatCard } from "../stat-card";

const RANGES: AnalyticsRange[] = ["7d", "30d", "90d", "all"];
const INTERACTIONS: (keyof EventCounts)[] = [
  "SHARE", "CONTACT_DOWNLOAD", "APPLE_WALLET_ADD", "GOOGLE_WALLET_ADD", "WHATSAPP_CLICK", "WEBSITE_CLICK",
  "EMAIL_CLICK", "PHONE_CLICK", "LOCATION_CLICK", "SOCIAL_CLICK",
];

export function AnalyticsView() {
  const t = useTranslations("analytics");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const errorMessage = useErrorMessage();
  const cardId = params.get("card") ?? "all";
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const cards = useCards({ pageSize: 100 });
  const overview = useAnalyticsOverview(range);
  const single = useCardAnalytics(cardId === "all" ? undefined : cardId, range);
  const active = cardId === "all" ? overview : single;
  const data = active.data;
  const n = (v?: number) => formatNumber(v ?? 0, locale);

  const totals = data?.totals;
  const interactions = totals ? INTERACTIONS.reduce((s, k) => s + (totals[k] ?? 0), 0) : 0;
  const engagementRate = totals && totals.VIEW > 0 ? Math.round((interactions / totals.VIEW) * 100) : 0;

  const setCard = (id: string) => {
    const q = new URLSearchParams(params.toString());
    if (id === "all") q.delete("card");
    else q.set("card", id);
    router.replace(`?${q.toString()}`, { scroll: false });
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Select value={cardId} onValueChange={setCard}>
              <SelectTrigger className="w-56" aria-label={t("allCards")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCards")}</SelectItem>
                {cards.data?.items.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Tabs value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
              <TabsList>
                {RANGES.map((r) => <TabsTrigger key={r} value={r} className="px-3">{t(`ranges.${r}`)}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </>
        }
      />

      {active.isError ? (
        <ErrorState message={errorMessage(active.error)} onRetry={() => active.refetch()} retryLabel={tc("retry")} />
      ) : (
        <div className={active.isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label={t("views")} value={n(totals?.VIEW)} icon={Eye} loading={!data} />
            <StatCard label={t("visitors")} value={n(totals?.uniqueVisitors)} icon={Users} loading={!data} />
            <StatCard label={t("scans")} value={n(totals?.QR_SCAN)} icon={QrCode} loading={!data} />
            <StatCard label={t("events.CONTACT_DOWNLOAD")} value={n(totals?.CONTACT_DOWNLOAD)} icon={Contact} loading={!data} />
            <StatCard label={t("engagementRate")} value={`${engagementRate}%`} icon={MousePointerClick} loading={!data} className="col-span-2 lg:col-span-1" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
            <Card>
              <CardHeader><CardTitle>{t("viewsOverTime")}</CardTitle></CardHeader>
              <CardContent>
                {data ? (hasData(data.series) ? <ViewsChart data={data.series} height={300} /> : <NoData label={t("noData")} />) : <Skeleton className="h-[320px]" />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t("engagement")}</CardTitle></CardHeader>
              <CardContent>{totals ? <EngagementBars totals={totals} /> : <Skeleton className="h-[320px]" />}</CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {cardId === "all" ? (
              <Card>
                <CardHeader><CardTitle>{t("popular")}</CardTitle></CardHeader>
                <CardContent className="pt-3">
                  {overview.data ? (
                    overview.data.topCards.length ? (
                      <ol className="grid gap-1">
                        {overview.data.topCards.map((c, i) => (
                          <li key={c.id}>
                            <Link href={`/dashboard/cards/${c.id}`} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-muted">
                              <span className="w-5 text-center text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                              <span className="min-w-0 flex-1">
                                <span dir="auto" className="block truncate text-sm font-medium">{c.name}</span>
                                <span dir="auto" className="block truncate text-xs text-muted-foreground">{[c.jobTitle, c.companyName].filter(Boolean).join(" · ")}</span>
                              </span>
                              <StatusBadge status={c.status} />
                              <span className="w-14 text-end text-sm font-semibold tabular-nums">{n(c.views)}</span>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    ) : <NoData label={t("noData")} />
                  ) : <Skeleton className="h-48" />}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader><CardTitle>{t("socialClicks")}</CardTitle></CardHeader>
                <CardContent className="grid gap-4 pt-3">
                  {single.data ? (
                    single.data.socialClicks.length ? (
                      <ul className="grid gap-2">
                        {single.data.socialClicks.map((s) => (
                          <li key={s.platform} className="flex items-center gap-3 text-sm">
                            <SocialIcon platform={s.platform as SocialPlatform} className="size-4 text-muted-foreground" />
                            <span className="flex-1 capitalize">{s.platform}</span>
                            <span className="font-semibold tabular-nums">{s.count}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <NoData label={t("noData")} />
                  ) : <Skeleton className="h-32" />}
                  {single.data && single.data.topReferrers.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold">{t("referrers")}</p>
                      <ul className="grid gap-1.5 text-sm">
                        {single.data.topReferrers.map((r) => (
                          <li key={r.referrer} className="flex justify-between gap-3">
                            <span dir="ltr" className="truncate text-muted-foreground">{r.referrer.replace(/^https?:\/\//, "")}</span>
                            <span className="font-semibold tabular-nums">{r.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle>{t("recent")}</CardTitle></CardHeader>
              <CardContent className="pt-2">
                {data ? <ActivityList items={data.recentActivity} empty={t("noData")} /> : <Skeleton className="h-48" />}
              </CardContent>
            </Card>
          </div>

          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> {t("privacyNote")}
          </p>
        </div>
      )}
    </>
  );
}

function hasData(series: SeriesPoint[]) {
  return series.some((p) => p.views > 0 || p.visitors > 0);
}

function NoData({ label }: { label: string }) {
  return <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">{label}</div>;
}
