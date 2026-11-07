"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, ShieldCheck, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Link } from "@/i18n/navigation";
import { useResetPassword } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { AuthHeader } from "./auth-shell";
import { FormAlert } from "./form-error";
import { PasswordInput, PasswordStrength } from "./password-input";
import { StatusPanel } from "./status-panel";

export function ResetPasswordForm() {
  const t = useTranslations("auth.reset");
  const tl = useTranslations("auth.login");
  const token = useSearchParams().get("token");
  const reset = useResetPassword();
  const errorMessage = useErrorMessage();
  const form = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });
  const password = useWatch({ control: form.control, name: "password" });
  const { errors } = form.formState;

  if (!token) {
    return (
      <StatusPanel icon={XCircle} tone="destructive" title={t("title")} body={t("missingToken")}>
        <Button asChild><Link href="/forgot-password">{t("requestNew")}</Link></Button>
      </StatusPanel>
    );
  }

  if (reset.isSuccess) {
    return (
      <StatusPanel icon={ShieldCheck} tone="success" title={t("successTitle")} body={t("successBody")}>
        <Button asChild><Link href="/login">{tl("submit")}</Link></Button>
      </StatusPanel>
    );
  }

  return (
    <>
      <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <KeyRound className="size-6" />
      </div>
      <AuthHeader title={t("title")} subtitle={t("subtitle")} />
      <form onSubmit={form.handleSubmit((v) => reset.mutate({ ...v, token }))} noValidate className="grid gap-5">
        {reset.isError && (
          <FormAlert>
            {errorMessage(reset.error)}{" "}
            <Link href="/forgot-password" className="font-medium underline">{t("requestNew")}</Link>
          </FormAlert>
        )}
        <FormField id="password" label={t("password")} error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
          <PasswordStrength value={password} />
        </FormField>
        <FormField id="confirmPassword" label={t("confirmPassword")} error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...form.register("confirmPassword")} />
        </FormField>
        <Button type="submit" size="lg" loading={reset.isPending}>{t("submit")}</Button>
      </form>
    </>
  );
}
