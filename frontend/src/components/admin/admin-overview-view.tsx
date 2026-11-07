"use client";

import { Activity, BadgeCheck, CreditCard, Eye, KeyRound, ShieldCheck, UserPlus, Users, UserX, Wallet, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorState } from "@/components/dashboard/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useAdminStats } from "@/lib/hooks/use-admin";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatDate, formatNumber, formatRelative } from "@/lib/utils";
import { RoleBadge, UserCell, UserStatusBadges } from "./admin-ui";

export function AdminOverviewView() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const stats = useAdminStats();
  const d = stats.data;
  const n = (v?: number) => formatNumber(v ?? 0, locale);

  if (stats.isError) return <ErrorState message={errorMessage(stats.error)} onRetry={() => stats.refetch()} retryLabel={tc("retry")} />;

  const tiles = [
    { label: t("stats.users"), value: n(d?.users.total), icon: Users },
    { label: t("stats.newUsers"), value: n(d?.users.new30d), icon: UserPlus },
    { label: t("stats.verified"), value: n(d?.users.verified), icon: BadgeCheck },
    { label: t("stats.suspended"), value: n(d?.users.suspended), icon: UserX },
    { label: t("stats.cards"), value: n(d?.cards.total), icon: CreditCard },
    { label: t("stats.activeCards"), value: n(d?.cards.active), icon: Zap },
    { label: t("stats.views"), value: n(d?.engagement.views30d), icon: Eye },
    { label: t("stats.events"), value: n(d?.engagement.events30d), icon: Activity },
    { label: t("stats.walletPasses"), value: n((d?.wallet.apple ?? 0) + (d?.wallet.google ?? 0)), icon: Wallet },
    { label: t("stats.sessions"), value: n(d?.activeSessions), icon: KeyRound },
    { label: t("stats.admins"), value: n(d?.users.admins), icon: ShieldCheck },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {tiles.map((s) => <StatCard key={s.label} {...s} loading={!d} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader><CardTitle>{t("signups")}</CardTitle></CardHeader>
          <CardContent>
            {d ? (
              <div className="h-[260px]" dir="ltr" aria-label={t("signupsLegend")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.signups} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid vertical={false} stroke="#e5eaf1" />
                    <XAxis dataKey="date" reversed={locale === "ar"} tickLine={false} axisLine={false} minTickGap={24}
                      tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v: string) => formatDate(v, locale, { month: "short", day: "numeric" })} />
                    <YAxis orientation={locale === "ar" ? "right" : "left"} allowDecimals={false} tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      cursor={{ fill: "rgb(0 106 254 / 0.06)" }}
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lifted">
                            <p className="font-medium">{formatDate(String(label), locale)}</p>
                            <p className="text-muted-foreground">{t("signupsLegend")}: <span className="font-semibold text-foreground">{String(payload[0].value)}</span></p>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="count" fill="#006afe" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <Skeleton className="h-[260px]" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("recentUsers")}</CardTitle></CardHeader>
          <CardContent className="grid gap-1 pt-3">
            {d ? d.recentUsers.map((u) => (
              <Link key={u.id} href={`/dashboard/admin/users/${u.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-muted">
                <div className="min-w-0 flex-1"><UserCell user={u} /></div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {u.role === "ADMIN" ? <RoleBadge role={u.role} /> : <UserStatusBadges user={u} />}
                  <span className="text-[11px] text-muted-foreground">{formatRelative(u.createdAt, locale)}</span>
                </div>
              </Link>
            )) : <Skeleton className="h-64" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
