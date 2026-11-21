"use client";

import { ArrowRight, BarChart3, CreditCard, Eye, FilePlus2, FileText, Globe, LayoutTemplate, PlusCircle, QrCode, Share2, Smartphone, Users, Wallet, Zap } from "lucide-react";
import { useFormatter, useNow, useLocale, useTranslations } from "next-intl";
import { ActivityList } from "@/components/analytics/activity-list";
import { ViewsChart } from "@/components/analytics/views-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useAnalyticsOverview } from "@/lib/hooks/use-analytics";
import { useCvList } from "@/lib/hooks/use-cv";
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
  const cvs = useCvList();
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const errorMessage = useErrorMessage();
  const totals = overview.data?.totals;
  const n = (v?: number) => formatNumber(v ?? 0, locale);

  const primary = [
    { label: t("stats.totalCards"), value: n(totals?.cards), icon: CreditCard, loading: overview.isLoading },
    { label: t("stats.activeCards"), value: n(totals?.activeCards), icon: Zap, loading: overview.isLoading },
    { label: t("stats.totalCvs"), value: n(cvs.data?.stats.total), icon: FileText, loading: cvs.isLoading },
    { label: t("stats.publicCvs"), value: n(cvs.data?.stats.public), icon: Globe, loading: cvs.isLoading },
  ];
  const engagement = [
    { label: t("stats.views"), value: n(totals?.VIEW), icon: Eye },
    { label: t("stats.uniqueVisitors"), value: n(totals?.uniqueVisitors), icon: Users },
    { label: t("stats.shares"), value: n(totals?.SHARE), icon: Share2 },
    { label: t("stats.scans"), value: n(totals?.QR_SCAN), icon: QrCode },
    { label: t("stats.appleWallet"), value: n(totals?.APPLE_WALLET_ADD), icon: Smartphone },
    { label: t("stats.googleWallet"), value: n(totals?.GOOGLE_WALLET_ADD), icon: Wallet },
  ];

  const actions = [
    { href: "/dashboard/cards/new", icon: PlusCircle, title: t("qa.create"), body: t("qa.createBody") },
    { href: "/dashboard/cv?new=1", icon: FilePlus2, title: t("qa.createCv"), body: t("qa.createCvBody") },
    { href: "/dashboard/templates", icon: LayoutTemplate, title: t("qa.templates"), body: t("qa.templatesBody") },
    { href: "/dashboard/analytics", icon: BarChart3, title: t("qa.analytics"), body: t("qa.analyticsBody") },
  ];
  const recentCvs = (cvs.data?.items ?? []).slice(0, 5);

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
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {primary.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {engagement.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-soft">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
                <span className="min-w-0">
                  <span className="block truncate text-xs text-muted-foreground">{label}</span>
                  <span className="block text-lg font-semibold tabular-nums text-navy">{overview.isLoading ? "…" : value}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("last30")}</p>
        </>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader><CardTitle>{t("recentActivity")}</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {overview.data ? <ActivityList items={overview.data.recentActivity} empty={t("noActivity")} /> : <Skeleton className="h-40" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("recentCvs")}</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/cv">{t("viewAll")} <ArrowRight className="rtl-flip" /></Link></Button>
          </CardHeader>
          <CardContent className="grid gap-1 pt-2">
            {cvs.isLoading ? <Skeleton className="h-32" /> : recentCvs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-sm text-muted-foreground">{t("noCvs")}</p>
                <Button asChild size="sm" className="mt-3"><Link href="/dashboard/cv?new=1"><FilePlus2 /> {t("qa.createCv")}</Link></Button>
              </div>
            ) : recentCvs.map((cv) => (
              <Link key={cv.id} href={`/dashboard/cv/${cv.id}/edit`} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span dir="auto" className="block truncate text-sm font-medium">{cv.title}</span>
                  <span className="block text-xs text-muted-foreground">{t("cvUpdated", { when: format.relativeTime(new Date(cv.updatedAt), now) })}</span>
                </span>
                {cv.isPublic && <Globe className="size-4 text-success" aria-label={t("stats.publicCvs")} />}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
