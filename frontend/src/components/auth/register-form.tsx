"use client";

import { hardNavigate } from "@/lib/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/client";
import { useRegister } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { AuthHeader } from "./auth-shell";
import { FormAlert } from "./form-error";
import { PasswordInput, PasswordStrength } from "./password-input";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const locale = useLocale();
  const register = useRegister();
  const errorMessage = useErrorMessage();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: "password" });

  const onSubmit = form.handleSubmit((values) =>
    register.mutate(
      { ...values, language: locale },
      {
        onSuccess: () => hardNavigate(`/${locale}/verify-email`),
        onError: (err) => {
          if (err instanceof ApiError && err.code === "EMAIL_TAKEN") form.setError("email", { message: errorMessage(err) });
        },
      },
    ),
  );

  return (
    <>
      <AuthHeader title={t("title")} subtitle={t("subtitle")} />
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        {register.isError && !(register.error instanceof ApiError && register.error.code === "EMAIL_TAKEN") && (
          <FormAlert>{errorMessage(register.error)}</FormAlert>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="firstName" label={t("firstName")} error={errors.firstName?.message}>
            <Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...form.register("firstName")} />
          </FormField>
          <FormField id="lastName" label={t("lastName")} error={errors.lastName?.message}>
            <Input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...form.register("lastName")} />
          </FormField>
        </div>
        <FormField id="email" label={t("email")} error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" dir="ltr" aria-invalid={!!errors.email} {...form.register("email")} />
        </FormField>
        <FormField id="password" label={t("password")} error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
          <PasswordStrength value={password} />
        </FormField>
        <FormField id="confirmPassword" label={t("confirmPassword")} error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...form.register("confirmPassword")} />
        </FormField>
        <FormField id="acceptTerms" error={errors.acceptTerms?.message}>
          <div className="flex items-start gap-2.5">
            <Controller
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <Checkbox id="acceptTerms" className="mt-0.5" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} aria-invalid={!!errors.acceptTerms} />
              )}
            />
            <label htmlFor="acceptTerms" className="text-sm leading-relaxed text-muted-foreground">
              {t.rich("acceptTerms", {
                terms: (chunks) => <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">{chunks}</Link>,
                privacy: (chunks) => <Link href="/privacy" target="_blank" className="font-medium text-primary hover:underline">{chunks}</Link>,
              })}
            </label>
          </div>
        </FormField>
        <Button type="submit" size="lg" loading={register.isPending}>{t("submit")}</Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">{t("login")}</Link>
        </p>
      </form>
    </>
  );
}
