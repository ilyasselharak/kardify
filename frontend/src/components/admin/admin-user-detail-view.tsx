"use client";

import { ArrowLeft, Laptop, LogOut, Smartphone, Trash2, UserCheck, UserX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/cards/status-badge";
import { ErrorState } from "@/components/dashboard/empty-state";
import { describeUserAgent } from "@/components/settings/security-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link, useRouter } from "@/i18n/navigation";
import type { AdminUserDetail } from "@/lib/api/types";
import { useAdminUpdateUser, useAdminUser } from "@/lib/hooks/use-admin";
import { useMe } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { formatDate, formatNumber, formatRelative } from "@/lib/utils";
import { ConfirmDialog, RoleBadge, UserCell, UserStatusBadges } from "./admin-ui";
import { CardAdminActions } from "./card-admin-actions";
import { useUserAdminActions } from "./user-actions";

export function AdminUserDetailView() {
  const { id } = useParams<{ id: string }>();
  const tc = useTranslations("common");
  const errorMessage = useErrorMessage();
  const user = useAdminUser(id);
  if (user.isLoading) return <Skeleton className="h-[480px] rounded-2xl" />;
  if (user.isError || !user.data) return <ErrorState message={errorMessage(user.error)} onRetry={() => user.refetch()} retryLabel={tc("retry")} />;
  return <UserDetail key={user.data.updatedAt} user={user.data} />;
}

function UserDetail({ user }: { user: AdminUserDetail }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tp = useTranslations("settings.profile");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const { data: me } = useMe();
  const isMe = me?.id === user.id;
  const update = useAdminUpdateUser();
  const a = useUserAdminActions(user, () => router.replace("/dashboard/admin/users"));
  const [confirm, setConfirm] = useState<"suspend" | "delete" | null>(null);
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    preferredLanguage: user.preferredLanguage,
    role: user.role,
    emailVerified: user.emailVerified,
  });
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== user[k]);

  const save = () => {
    const data = Object.fromEntries((Object.keys(form) as (keyof typeof form)[]).filter((k) => form[k] !== user[k]).map((k) => [k, form[k]]));
    update.mutate({ id: user.id, data }, { onSuccess: () => toast.success(t("toasts.updated")), onError: (e) => toast.error(errorMessage(e)) });
  };

  const facts = [
    { label: t("detail.joined"), value: formatDate(user.createdAt, locale) },
    { label: t("detail.lastUpdated"), value: formatRelative(user.updatedAt, locale) },
    { label: t("detail.totalViews"), value: formatNumber(user.totalViews, locale) },
    { label: t("detail.failedLogins"), value: String(user.failedLoginAttempts) },
    ...(user.lockedUntil && new Date(user.lockedUntil) > new Date() ? [{ label: t("detail.lockedUntil"), value: formatDate(user.lockedUntil, locale, { timeStyle: "short" }) }] : []),
    ...(user.suspendedAt ? [{ label: t("detail.suspendedSince"), value: formatDate(user.suspendedAt, locale) }] : []),
  ];

  return (
    <>
      <title>{`${user.firstName} ${user.lastName} · Kardify`}</title>
      <Link href="/dashboard/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="rtl-flip size-4" /> {t("detail.back")}
      </Link>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <UserCell user={user} isMe={isMe} />
        <div className="flex items-center gap-2"><RoleBadge role={user.role} /><UserStatusBadges user={user} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <CardHeader><CardTitle>{t("detail.profile")}</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField id="fn" label={tp("firstName")}>
                  <Input id="fn" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                </FormField>
                <FormField id="ln" label={tp("lastName")}>
                  <Input id="ln" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
                </FormField>
                <FormField id="lang" label={t("detail.language")}>
                  <Select value={form.preferredLanguage} onValueChange={(v) => setForm((f) => ({ ...f, preferredLanguage: v as "en" | "ar" }))}>
                    <SelectTrigger id="lang"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{tc("english")}</SelectItem>
                      <SelectItem value="ar">{tc("arabic")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField id="role" label={t("detail.role")}>
                  <Select value={form.role} disabled={isMe} onValueChange={(v) => setForm((f) => ({ ...f, role: v as "USER" | "ADMIN" }))}>
                    <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">{t("roles.USER")}</SelectItem>
                      <SelectItem value="ADMIN">{t("roles.ADMIN")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                {t("detail.emailVerified")}
                <Switch checked={form.emailVerified} onCheckedChange={(v) => setForm((f) => ({ ...f, emailVerified: v }))} />
              </label>
              <div className="flex justify-end">
                <Button onClick={save} disabled={!dirty} loading={update.isPending}>{t("detail.save")}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("detail.cards")}</CardTitle></CardHeader>
            <CardContent className="pt-3">
              {user.cards.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("detail.noCards")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {user.cards.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" dir="auto">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground"><bdi dir="ltr">/card/{c.slug}</bdi></p>
                      </div>
                      <StatusBadge status={c.status} />
                      <CardAdminActions card={{ ...c, publicUrl: `${window.location.origin}/card/${c.slug}` }} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <CardContent className="grid gap-3 pt-6">
              {facts.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium tabular-nums">{f.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("detail.sessions")}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 pt-3">
              {user.sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("detail.noSessions")}</p>
              ) : (
                user.sessions.map((s) => {
                  const ua = describeUserAgent(s.userAgent);
                  const Icon = ua.mobile ? Smartphone : Laptop;
                  return (
                    <div key={s.id} className="flex items-center gap-3 text-sm">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{ua.label ?? "—"}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(s.lastUsedAt, locale)}</span>
                    </div>
                  );
                })
              )}
              {!isMe && user.sessions.length > 0 && (
                <Button variant="outline" size="sm" onClick={a.revokeSessions} loading={a.pending}>
                  <LogOut className="rtl-flip" /> {t("actions.revokeSessions")}
                </Button>
              )}
            </CardContent>
          </Card>

          {!isMe && (
            <Card className="border-destructive/30">
              <CardHeader><CardTitle className="text-destructive">{t("detail.dangerZone")}</CardTitle></CardHeader>
              <CardContent className="grid gap-2">
                {user.suspendedAt ? (
                  <Button variant="outline" onClick={() => a.setSuspended(false)} loading={a.pending}><UserCheck /> {t("actions.unsuspend")}</Button>
                ) : (
                  <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirm("suspend")}><UserX /> {t("actions.suspend")}</Button>
                )}
                <Button variant="destructive" onClick={() => setConfirm("delete")}><Trash2 /> {t("actions.delete")}</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "suspend"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("confirm.suspendTitle")}
        description={t("confirm.suspendBody", { email: user.email })}
        confirmLabel={t("actions.suspend")}
        onConfirm={() => a.setSuspended(true)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("confirm.deleteUserTitle")}
        description={t("confirm.deleteUserBody", { email: user.email })}
        confirmLabel={t("actions.delete")}
        onConfirm={a.remove}
      />
    </>
  );
}
