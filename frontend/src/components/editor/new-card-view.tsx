"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FlippableCard } from "@/components/cards/business-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { CompanyInput } from "@/components/ui/company-input";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/lib/api/types";
import { cardToFormValues, formValuesToPayload } from "@/lib/card-form";
import { switchTemplate } from "@/lib/design/templates";
import { TEMPLATE_IDS, type TemplateId } from "@/lib/design/types";
import { useMe } from "@/lib/hooks/use-auth";
import { useCreateCard } from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { CardTemplateGallery } from "./card-template-gallery";

/** Quick start: pick a template, enter a name, then continue in the full editor. */
export function NewCardView() {
  const t = useTranslations("editor.new");
  const tw = useTranslations("wizard.personal");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const params = useSearchParams();
  const { data: user } = useMe();
  const create = useCreateCard();

  const fromQuery = params.get("template");
  const [picked, setPicked] = useState<TemplateId | null>(TEMPLATE_IDS.includes(fromQuery as TemplateId) ? (fromQuery as TemplateId) : null);
  const [name, setName] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [side, setSide] = useState<"front" | "back">("front");
  const [error, setError] = useState<string>();

  const base = cardToFormValues(undefined, user?.preferences, locale);
  const fullName = name ?? (user ? `${user.firstName} ${user.lastName}` : "");
  const design = picked ? switchTemplate(base.designSettings, picked) : base.designSettings;
  const template = picked ?? design.template;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return setError("required");
    const payload = formValuesToPayload({ ...base, name: fullName, jobTitle, companyName, email: user?.email ?? "", designSettings: design });
    create.mutate(payload, {
      onSuccess: (card) => card && router.replace(`/dashboard/cards/${card.id}/edit`),
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  const sample = { name: fullName || "Kardify", jobTitle, companyName, email: user?.email };

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <form onSubmit={submit} noValidate className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="grid min-w-0 gap-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="mb-4 text-base font-semibold">{t("details")}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField id="name" label={tw("name")} error={error}>
                <Input id="name" dir="auto" maxLength={120} value={fullName} aria-invalid={!!error} onChange={(e) => { setName(e.target.value); setError(undefined); }} placeholder={tw("namePlaceholder")} />
              </FormField>
              <FormField id="jobTitle" label={tw("jobTitle")} optional>
                <Input id="jobTitle" dir="auto" maxLength={120} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={tw("jobTitlePlaceholder")} />
              </FormField>
              <FormField id="companyName" label={tw("company")} optional>
                <CompanyInput id="companyName" value={companyName} onChange={setCompanyName} placeholder={tw("companyPlaceholder")} />
              </FormField>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="mb-1 text-base font-semibold">{t("chooseTemplate")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t("chooseTemplateHint")}</p>
            <CardTemplateGallery value={template} onSelect={setPicked} sample={sample} columns={3} />
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">{t("preview")}</span>
              <Tabs value={side} onValueChange={(v) => setSide(v as typeof side)}>
                <TabsList className="h-8">
                  <TabsTrigger value="front" className="px-3 text-xs">{t("front")}</TabsTrigger>
                  <TabsTrigger value="back" className="px-3 text-xs">{t("back")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="rounded-xl bg-[radial-gradient(circle_at_top,#eaf2ff,transparent_70%)] px-3 py-8">
              <FlippableCard card={{ ...sample, designSettings: design }} side={side} className="mx-auto max-w-[400px]" />
            </div>
            <Button type="submit" size="lg" className="mt-5 w-full" loading={create.isPending}>
              <Sparkles /> {t("create")} <ArrowRight className="rtl-flip" />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">{t("createHint")}</p>
          </div>
        </aside>
      </form>
      <span className="sr-only">{tc("loading")}</span>
    </>
  );
}
