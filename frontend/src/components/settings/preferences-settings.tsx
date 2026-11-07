"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ColorInput } from "@/components/wizard/color-input";
import type { User, UserPreferences } from "@/lib/api/types";
import { TEMPLATES } from "@/lib/design/templates";
import { TEMPLATE_IDS, type TemplateId } from "@/lib/design/types";
import { useUpdatePreferences } from "@/lib/hooks/use-account";
import { useMe } from "@/lib/hooks/use-auth";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { SettingsSection } from "./settings-nav";

export function PreferencesSettings() {
  const { data: user } = useMe();
  return user ? <PreferencesForm user={user} /> : null;
}

function PreferencesForm({ user }: { user: User }) {
  const t = useTranslations("settings.preferences");
  const tc = useTranslations("common");
  const tt = useTranslations("wizard.design.templateNames");
  const save = useUpdatePreferences();
  const errorMessage = useErrorMessage();
  const p = user.preferences ?? {};
  const template = (p.defaultTemplate as TemplateId) ?? "classic";
  const [prefs, setPrefs] = useState<Required<Omit<UserPreferences, "notifications">> & { notifications: Required<NonNullable<UserPreferences["notifications"]>> }>({
    defaultCardLanguage: p.defaultCardLanguage ?? user.preferredLanguage,
    defaultTemplate: template,
    defaultPrimaryColor: p.defaultPrimaryColor ?? TEMPLATES[template].primaryColor,
    defaultBackgroundColor: p.defaultBackgroundColor ?? TEMPLATES[template].backgroundColor,
    defaultTextColor: p.defaultTextColor ?? TEMPLATES[template].textColor,
    notifications: {
      productUpdates: p.notifications?.productUpdates ?? true,
      weeklySummary: p.notifications?.weeklySummary ?? false,
      securityAlerts: p.notifications?.securityAlerts ?? true,
    },
  });

  const submit = () => save.mutate(prefs, { onSuccess: () => toast.success(t("saved")), onError: (e) => toast.error(errorMessage(e)) });

  return (
    <div className="grid gap-6">
      <SettingsSection title={t("title")} description={t("subtitle")} footer={<Button onClick={submit} loading={save.isPending}>{tc("saveChanges")}</Button>}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="cardLang" label={t("cardLanguage")}>
            <Select value={prefs.defaultCardLanguage} onValueChange={(v) => setPrefs((s) => ({ ...s, defaultCardLanguage: v as "en" | "ar" }))}>
              <SelectTrigger id="cardLang"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{tc("english")}</SelectItem>
                <SelectItem value="ar">{tc("arabic")}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="template" label={t("template")}>
            <Select
              value={prefs.defaultTemplate}
              onValueChange={(v) => {
                const tpl = TEMPLATES[v as TemplateId];
                setPrefs((s) => ({ ...s, defaultTemplate: v, defaultPrimaryColor: tpl.primaryColor, defaultBackgroundColor: tpl.backgroundColor, defaultTextColor: tpl.textColor }));
              }}
            >
              <SelectTrigger id="template"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATE_IDS.map((id) => <SelectItem key={id} value={id}>{tt(id)}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <ColorInput id="pc" label={t("primaryColor")} value={prefs.defaultPrimaryColor} onChange={(v) => setPrefs((s) => ({ ...s, defaultPrimaryColor: v }))} />
          <ColorInput id="bc" label={t("backgroundColor")} value={prefs.defaultBackgroundColor} onChange={(v) => setPrefs((s) => ({ ...s, defaultBackgroundColor: v }))} />
          <ColorInput id="tc" label={t("textColor")} value={prefs.defaultTextColor} onChange={(v) => setPrefs((s) => ({ ...s, defaultTextColor: v }))} />
        </div>
      </SettingsSection>

      <SettingsSection title={t("notificationsTitle")} description={t("notificationsSubtitle")} footer={<Button onClick={submit} loading={save.isPending}>{tc("saveChanges")}</Button>}>
        {(["productUpdates", "weeklySummary", "securityAlerts"] as const).map((key) => (
          <label key={key} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <span>
              <span className="block text-sm font-medium">{t(key)}</span>
              <span className="block text-xs text-muted-foreground">{t(`${key}Body`)}</span>
            </span>
            <Switch
              checked={prefs.notifications[key]}
              onCheckedChange={(v) => setPrefs((s) => ({ ...s, notifications: { ...s.notifications, [key]: v } }))}
            />
          </label>
        ))}
      </SettingsSection>
    </div>
  );
}
