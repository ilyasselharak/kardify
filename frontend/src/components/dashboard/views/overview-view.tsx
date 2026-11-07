"use client";

import { ArrowRight, BarChart3, CreditCard, Eye, PlusCircle, QrCode, Share2, Smartphone, UserRound, Users, Wallet, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ActivityList } from "@/components/analytics/activity-list";
import { ViewsChart } from "@/components/analytics/views-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useAnalyticsOverview } from "@/lib/hooks/use-analytics";
import { useMe } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatNumber } from "@/lib/utils";
import { ErrorState } from "../empty-state";
import { PageHeader } from "../page-header";
import { StatCard } from "../stat-card";

export function OverviewView() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { data: user } = useMe();
  const overview = useAnalyticsOverview("30d");
  const errorMessage = useErrorMessage();
  const totals = overview.data?.totals;
  const n = (v?: number) => formatNumber(v ?? 0, locale);

  const stats = [
    { label: t("stats.totalCards"), value: n(totals?.cards), icon: CreditCard },
    { label: t("stats.activeCards"), value: n(totals?.activeCards), icon: Zap },
    { label: t("stats.views"), value: n(totals?.VIEW), icon: Eye, hint: t("last30") },
    { label: t("stats.uniqueVisitors"), value: n(totals?.uniqueVisitors), icon: Users, hint: t("last30") },
    { label: t("stats.shares"), value: n(totals?.SHARE), icon: Share2, hint: t("last30") },
    { label: t("stats.scans"), value: n(totals?.QR_SCAN), icon: QrCode, hint: t("last30") },
    { label: t("stats.appleWallet"), value: n(totals?.APPLE_WALLET_ADD), icon: Smartphone, hint: t("last30") },
    { label: t("stats.googleWallet"), value: n(totals?.GOOGLE_WALLET_ADD), icon: Wallet, hint: t("last30") },
  ];

  const actions = [
    { href: "/dashboard/cards/new", icon: PlusCircle, title: t("qa.create"), body: t("qa.createBody") },
    { href: "/dashboard/cards", icon: CreditCard, title: t("qa.manage"), body: t("qa.manageBody") },
    { href: "/dashboard/analytics", icon: BarChart3, title: t("qa.analytics"), body: t("qa.analyticsBody") },
    { href: "/dashboard/settings/profile", icon: UserRound, title: t("qa.profile"), body: t("qa.profileBody") },
  ];

  return (
    <>
      <PageHeader
        title={user ? t("greeting", { name: user.firstName }) : <Skeleton className="h-8 w-56" />}
        description={t("overviewSubtitle")}
        actions={<Button asChild><Link href="/dashboard/cards/new"><PlusCircle /> {t("qa.create")}</Link></Button>}
      />

      {overview.isError ? (
        <ErrorState message={errorMessage(overview.error)} onRetry={() => overview.refetch()} retryLabel={tc("retry")} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} loading={overview.isLoading} />)}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("viewsOverTime")}</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/analytics">{t("viewAll")} <ArrowRight className="rtl-flip" /></Link></Button>
          </CardHeader>
          <CardContent>
            {overview.data ? <ViewsChart data={overview.data.series} /> : <Skeleton className="h-[300px]" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("quickActions")}</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {actions.map(({ href, icon: Icon, title, body }) => (
              <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/40 hover:bg-primary/5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-muted-foreground">{body}</span>
                </span>
                <ArrowRight className="rtl-flip size-4 text-muted-foreground transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>{t("recentActivity")}</CardTitle></CardHeader>
        <CardContent className="pt-2">
          {overview.data ? <ActivityList items={overview.data.recentActivity} empty={t("noActivity")} /> : <Skeleton className="h-40" />}
        </CardContent>
      </Card>
    </>
  );
}
