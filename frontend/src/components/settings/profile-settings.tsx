"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/wizard/image-upload";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { User } from "@/lib/api/types";
import { useChangeEmail, useUpdateProfile } from "@/lib/hooks/use-account";
import { useMe } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { SettingsSection } from "./settings-nav";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "required").max(80, "tooLong"),
  lastName: z.string().trim().min(1, "required").max(80, "tooLong"),
  preferredLanguage: z.enum(["en", "ar"]),
  profileImage: z.string(),
});
const emailSchema = z.object({ newEmail: z.string().trim().min(1, "required").email("emailInvalid"), password: z.string().min(1, "required") });

export function ProfileSettings() {
  const { data: user } = useMe();
  if (!user) return null;
  return (
    <div className="grid gap-6">
      <ProfileForm user={user} />
      <EmailForm user={user} />
    </div>
  );
}

function ProfileForm({ user }: { user: User }) {
  const t = useTranslations("settings.profile");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const update = useUpdateProfile();
  const errorMessage = useErrorMessage();
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName, preferredLanguage: user.preferredLanguage, profileImage: user.profileImage ?? "" },
  });
  const { errors, isDirty } = form.formState;
  const [profileImage, preferredLanguage] = useWatch({ control: form.control, name: ["profileImage", "preferredLanguage"] });

  const onSubmit = form.handleSubmit((v) =>
    update.mutate(
      { ...v, profileImage: v.profileImage || null },
      {
        onSuccess: ({ user: u }) => {
          toast.success(t("saved"));
          form.reset({ ...v });
          if (u.preferredLanguage !== locale) router.replace(pathname, { locale: u.preferredLanguage });
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection
        title={t("title")}
        description={t("subtitle")}
        footer={<Button type="submit" loading={update.isPending} disabled={!isDirty}>{tc("saveChanges")}</Button>}
      >
        <ImageUpload
          label={t("photo")}
          purpose="avatar"
          value={profileImage}
          onChange={(url) => form.setValue("profileImage", url, { shouldDirty: true })}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="firstName" label={t("firstName")} error={errors.firstName?.message}>
            <Input id="firstName" {...form.register("firstName")} />
          </FormField>
          <FormField id="lastName" label={t("lastName")} error={errors.lastName?.message}>
            <Input id="lastName" {...form.register("lastName")} />
          </FormField>
        </div>
        <FormField id="lang" label={t("language")} hint={t("languageHint")}>
          <Select value={preferredLanguage} onValueChange={(v) => form.setValue("preferredLanguage", v as "en" | "ar", { shouldDirty: true })}>
            <SelectTrigger id="lang" className="sm:w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{tc("english")}</SelectItem>
              <SelectItem value="ar">{tc("arabic")}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </SettingsSection>
    </form>
  );
}

function EmailForm({ user }: { user: User }) {
  const t = useTranslations("settings.profile");
  const change = useChangeEmail();
  const errorMessage = useErrorMessage();
  const form = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema), defaultValues: { newEmail: "", password: "" } });
  const { errors } = form.formState;
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((v) =>
        change.mutate(v, {
          onSuccess: () => {
            toast.success(t("emailSent"));
            form.reset();
          },
          onError: (e) => toast.error(errorMessage(e)),
        }),
      )}
    >
      <SettingsSection title={t("emailTitle")} description={t("emailSubtitle")} footer={<Button type="submit" variant="outline" loading={change.isPending}>{t("changeEmail")}</Button>}>
        <FormField id="currentEmail" label={t("currentEmail")}>
          <Input id="currentEmail" value={user.email} dir="ltr" disabled />
        </FormField>
        <FormField id="newEmail" label={t("newEmail")} error={errors.newEmail?.message}>
          <Input id="newEmail" type="email" dir="ltr" autoComplete="email" {...form.register("newEmail")} />
        </FormField>
        <FormField id="emailPassword" label={t("password")} error={errors.password?.message}>
          <PasswordInput id="emailPassword" autoComplete="current-password" {...form.register("password")} />
        </FormField>
      </SettingsSection>
    </form>
  );
}
