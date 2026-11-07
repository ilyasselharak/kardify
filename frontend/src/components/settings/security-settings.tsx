"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Laptop, LogOut, Smartphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { PasswordInput, PasswordStrength } from "@/components/auth/password-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangePassword, useRevokeOtherSessions, useRevokeSession, useSessions } from "@/lib/hooks/use-account";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validation/auth";
import { formatRelative } from "@/lib/utils";
import { SettingsSection } from "./settings-nav";

/** Turns a user-agent string into a short human label (browser on OS). */
export function describeUserAgent(ua: string | null): { label: string | null; mobile: boolean } {
  if (!ua) return { label: null, mobile: false };
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : null;
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : null;
  const label = [browser, os].filter(Boolean).join(" · ") || ua.slice(0, 40);
  return { label, mobile: /Mobile|iPhone|Android/.test(ua) };
}

export function SecuritySettings() {
  return (
    <div className="grid gap-6">
      <PasswordForm />
      <Sessions />
    </div>
  );
}

function PasswordForm() {
  const t = useTranslations("settings.security");
  const change = useChangePassword();
  const errorMessage = useErrorMessage();
  const form = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  const { errors } = form.formState;
  const pw = useWatch({ control: form.control, name: "newPassword" });
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) =>
        change.mutate(v, {
          onSuccess: () => {
            toast.success(t("updated"));
            form.reset();
          },
          onError: (e) => toast.error(errorMessage(e)),
        }),
      )}
    >
      <SettingsSection title={t("passwordTitle")} description={t("passwordSubtitle")} footer={<Button type="submit" loading={change.isPending}>{t("update")}</Button>}>
        <FormField id="currentPassword" label={t("currentPassword")} error={errors.currentPassword?.message}>
          <PasswordInput id="currentPassword" autoComplete="current-password" {...form.register("currentPassword")} />
        </FormField>
        <FormField id="newPassword" label={t("newPassword")} error={errors.newPassword?.message}>
          <PasswordInput id="newPassword" autoComplete="new-password" {...form.register("newPassword")} />
          <PasswordStrength value={pw} />
        </FormField>
        <FormField id="confirmPassword" label={t("confirmPassword")} error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" {...form.register("confirmPassword")} />
        </FormField>
      </SettingsSection>
    </form>
  );
}

function Sessions() {
  const t = useTranslations("settings.security");
  const locale = useLocale();
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const errorMessage = useErrorMessage();
  const others = (sessions.data ?? []).filter((s) => !s.current).length;

  return (
    <SettingsSection
      title={t("sessionsTitle")}
      description={t("sessionsSubtitle")}
      footer={
        <Button
          variant="outline"
          disabled={others === 0}
          loading={revokeOthers.isPending}
          onClick={() => revokeOthers.mutate(undefined, { onSuccess: () => toast.success(t("othersRevoked")), onError: (e) => toast.error(errorMessage(e)) })}
        >
          <LogOut className="rtl-flip" /> {t("revokeOthers")}
        </Button>
      }
    >
      {sessions.isLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {sessions.data?.map((s) => {
            const { label, mobile } = describeUserAgent(s.userAgent);
            const Icon = mobile ? Smartphone : Laptop;
            return (
              <li key={s.id} className="flex items-center gap-3 p-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{label ?? t("unknownDevice")}</span>
                    {s.current && <Badge variant="success">{t("current")}</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.ipAddress && <span dir="ltr">{s.ipAddress} · </span>}
                    {t("lastActive", { time: formatRelative(s.lastUsedAt, locale) })}
                  </p>
                </div>
                {!s.current && (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={revoke.isPending && revoke.variables === s.id}
                    onClick={() => revoke.mutate(s.id, { onSuccess: () => toast.success(t("revoked")), onError: (e) => toast.error(errorMessage(e)) })}
                  >
                    {t("revoke")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SettingsSection>
  );
}
