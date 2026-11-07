"use client";

import { hardNavigate, safeNext } from "@/lib/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { useLogin } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { AuthHeader } from "./auth-shell";
import { FormAlert } from "./form-error";
import { PasswordInput } from "./password-input";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const params = useSearchParams();
  const login = useLogin();
  const errorMessage = useErrorMessage();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: ({ user }) => {
        // Hard navigation so the proxy sees the new session cookie; honour the user's language.
        const lang = user.preferredLanguage ?? locale;
        const target = safeNext(params.get("next"), lang).replace(/^\/(en|ar)(?=\/|$)/, `/${lang}`);
        hardNavigate(target);
      },
    }),
  );

  return (
    <>
      <AuthHeader title={t("title")} subtitle={t("subtitle")} />
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        {login.isError && <FormAlert>{errorMessage(login.error)}</FormAlert>}
        <FormField id="email" label={t("email")} error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" dir="ltr" aria-invalid={!!errors.email} {...form.register("email")} />
        </FormField>
        <FormField
          id="password"
          label={
            <span className="flex w-full items-center justify-between">
              {t("password")}
              <Link href="/forgot-password" className="text-[13px] font-medium text-primary hover:underline">
                {t("forgot")}
              </Link>
            </span>
          }
          error={errors.password?.message}
        >
          <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
        </FormField>
        <div className="flex items-center gap-2.5">
          <Controller
            control={form.control}
            name="rememberMe"
            render={({ field }) => <Checkbox id="rememberMe" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />}
          />
          <Label htmlFor="rememberMe" className="font-normal text-muted-foreground">{t("rememberMe")}</Label>
        </div>
        <Button type="submit" size="lg" loading={login.isPending}>{t("submit")}</Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">{t("signup")}</Link>
        </p>
      </form>
    </>
  );
}
