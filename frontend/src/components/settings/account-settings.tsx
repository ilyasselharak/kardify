"use client";

import { hardNavigate } from "@/lib/navigation";
import { Download, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { apiUrl } from "@/lib/api/client";
import { useDeleteAccount } from "@/lib/hooks/use-account";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { downloadFromUrl } from "@/lib/public-card";
import { SettingsSection } from "./settings-nav";

export function AccountSettings() {
  const t = useTranslations("settings.account");
  const tc = useTranslations("common");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const remove = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      await downloadFromUrl(apiUrl("/users/me/export"), "kardify-export.json");
      toast.success(t("exported"));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <SettingsSection title={t("exportTitle")} description={t("exportBody")}>
        <div><Button variant="outline" onClick={exportData} loading={exporting}><Download /> {t("export")}</Button></div>
      </SettingsSection>
      <SettingsSection danger title={t("deleteTitle")} description={t("deleteBody")}>
        <div><Button variant="destructive" onClick={() => setOpen(true)}><Trash2 /> {t("delete")}</Button></div>
      </SettingsSection>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPassword(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("confirmTitle")}</DialogTitle>
            <DialogDescription>{t("confirmBody")}</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              remove.mutate(password, {
                onSuccess: () => {
                  toast.success(t("deleted"));
                  hardNavigate(`/${locale}`);
                },
                onError: (err) => toast.error(errorMessage(err)),
              });
            }}
          >
            <FormField id="deletePassword" label={t("password")}>
              <PasswordInput id="deletePassword" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tc("cancel")}</Button>
              <Button type="submit" variant="destructive" disabled={!password} loading={remove.isPending}>{t("delete")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
