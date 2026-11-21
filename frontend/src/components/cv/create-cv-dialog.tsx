"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";
import type { CvLang, CvListItem, CvTemplateId } from "@/lib/cv/types";
import { useCreateCv } from "@/lib/hooks/use-cv";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { CvTemplatePicker } from "./editor/design-panel";

export function CreateCvDialog({ open, onOpenChange, existing, initialTemplate }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing: CvListItem[];
  initialTemplate?: CvTemplateId;
}) {
  const t = useTranslations("cv.createDialog");
  const tc = useTranslations("common");
  const locale = useLocale() as CvLang;
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const create = useCreateCv();
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<CvTemplateId>(initialTemplate ?? "modern");
  const [language, setLanguage] = useState<CvLang>(locale);
  const [copyFrom, setCopyFrom] = useState("");
  const [error, setError] = useState<string>();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = title.trim() || t("defaultTitle");
    if (name.length > 120) return setError("tooLong");
    create.mutate(
      { title: name, template, language, ...(copyFrom ? { copyFromId: copyFrom } : {}) },
      {
        onSuccess: (cv) => cv && router.push(`/dashboard/cv/${cv.id}/edit`),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto">
        <form onSubmit={submit} className="grid gap-5" noValidate>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <FormField id="cv-title" label={t("name")} hint={t("nameHint")} error={error}>
              <Input id="cv-title" dir="auto" autoFocus maxLength={120} value={title} placeholder={t("defaultTitle")} onChange={(e) => { setTitle(e.target.value); setError(undefined); }} />
            </FormField>
            <FormField id="cv-lang" label={t("language")}>
              <Tabs value={language} onValueChange={(v) => setLanguage(v as CvLang)}>
                <TabsList>
                  <TabsTrigger value="en" className="px-4">{tc("english")}</TabsTrigger>
                  <TabsTrigger value="ar" className="px-4">{tc("arabic")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </FormField>
          </div>
          {existing.length > 0 && (
            <FormField id="cv-copy" label={t("startFrom")} hint={t("startFromHint")}>
              <select id="cv-copy" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} className="h-10 rounded-lg border border-input bg-card px-2.5 text-sm">
                <option value="">{t("blank")}</option>
                {existing.map((c) => <option key={c.id} value={c.id}>{t("copyOf", { title: c.title })}</option>)}
              </select>
            </FormField>
          )}
          <div className="grid gap-2">
            <span className="text-sm font-medium">{t("template")}</span>
            <CvTemplatePicker value={template} lang={language} onSelect={setTemplate} columns={4} thumb={140} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
            <Button type="submit" loading={create.isPending}>{t("submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
