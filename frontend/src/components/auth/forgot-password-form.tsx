"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { useForgotPassword } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { AuthHeader } from "./auth-shell";
import { FormAlert } from "./form-error";
import { StatusPanel } from "./status-panel";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgot");
  const tl = useTranslations("auth.login");
  const forgot = useForgotPassword();
  const errorMessage = useErrorMessage();
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  if (forgot.isSuccess) {
    return (
      <StatusPanel icon={MailCheck} title={t("sentTitle")} body={t("sentBody", { email: form.getValues("email") })}>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login"><ArrowLeft className="rtl-flip" /> {t("backToLogin")}</Link>
        </Button>
      </StatusPanel>
    );
  }

  return (
    <>
      <AuthHeader title={t("title")} subtitle={t("subtitle")} />
      <form onSubmit={form.handleSubmit(({ email }) => forgot.mutate(email))} noValidate className="grid gap-5">
        {forgot.isError && <FormAlert>{errorMessage(forgot.error)}</FormAlert>}
        <FormField id="email" label={tl("email")} error={form.formState.errors.email?.message}>
          <Input id="email" type="email" dir="ltr" autoComplete="email" aria-invalid={!!form.formState.errors.email} {...form.register("email")} />
        </FormField>
        <Button type="submit" size="lg" loading={forgot.isPending}>{t("submit")}</Button>
        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="rtl-flip size-4" /> {t("backToLogin")}
        </Link>
      </form>
    </>
  );
}
