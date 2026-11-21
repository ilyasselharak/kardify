"use client";

import { ArrowRight, Check, CreditCard, FileText, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FlippableCard } from "@/components/cards/business-card";
import { CvTemplateThumb } from "@/components/cv/editor/design-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useRouter } from "@/i18n/navigation";
import { CV_TEMPLATES } from "@/lib/cv/templates";
import { CV_TEMPLATE_IDS, type CvLang } from "@/lib/cv/types";
import { TEMPLATE_CATEGORY, templateDesign } from "@/lib/design/templates";
import { TEMPLATE_CATEGORIES, TEMPLATE_IDS, type TemplateCategory, type TemplateId } from "@/lib/design/types";
import { useMe } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils";

function CardTemplateTile({ id, sample }: { id: TemplateId; sample: { name: string; jobTitle: string; companyName: string; email?: string; phone?: string; website?: string } }) {
  const t = useTranslations("templates");
  const [side, setSide] = useState<"front" | "back">("front");
  return (
    <li className="group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:shadow-lifted">
      <div className="rounded-xl bg-[radial-gradient(circle_at_top,#eaf2ff,transparent_70%)] p-3" onMouseEnter={() => setSide("back")} onMouseLeave={() => setSide("front")}>
        <FlippableCard card={{ ...sample, designSettings: templateDesign(id) }} url="https://kardify.com/card/preview" side={side} />
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-navy">{t(`cardNames.${id}`)}</h3>
          <p className="text-xs text-muted-foreground">{t(`categories.${TEMPLATE_CATEGORY[id]}`)}</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setSide((s) => (s === "front" ? "back" : "front"))} aria-label={t("flip")}><RotateCcw /></Button>
      </div>
      <Button asChild className="mt-3"><Link href={`/dashboard/cards/new?template=${id}`}>{t("useTemplate")} <ArrowRight className="rtl-flip" /></Link></Button>
    </li>
  );
}

/** Template library: business-card and CV templates in one place. */
export function TemplatesView() {
  const t = useTranslations("templates");
  const tc = useTranslations("common");
  const params = useSearchParams();
  const router = useRouter();
  const { data: user } = useMe();
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [cvLang, setCvLang] = useState<CvLang>("en");
  const tab = params.get("tab") === "cv" ? "cv" : "cards";
  const sample = {
    name: user ? `${user.firstName} ${user.lastName}` : "Sara Alami",
    jobTitle: t("sampleTitle"),
    companyName: "Kardify",
    email: user?.email ?? "sara@example.com",
    phone: "+212 600 000 000",
    website: "https://kardify.com",
  };
  const ids = TEMPLATE_IDS.filter((id) => category === "all" || TEMPLATE_CATEGORY[id] === category);

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Tabs value={tab} onValueChange={(v) => router.replace(v === "cv" ? "/dashboard/templates?tab=cv" : "/dashboard/templates")}>
        <TabsList className="mb-6">
          <TabsTrigger value="cards" className="px-4"><CreditCard /> {t("cardsTab", { count: TEMPLATE_IDS.length })}</TabsTrigger>
          <TabsTrigger value="cv" className="px-4"><FileText /> {t("cvTab", { count: CV_TEMPLATE_IDS.length })}</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <div role="tablist" aria-label={t("categoriesLabel")} className="mb-5 flex flex-wrap gap-2">
            {(["all", ...TEMPLATE_CATEGORIES] as const).map((c) => (
              <button key={c} type="button" role="tab" aria-selected={category === c} onClick={() => setCategory(c)} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium transition", category === c ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
                {t(`categories.${c}`)}
              </button>
            ))}
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {ids.map((id) => <CardTemplateTile key={id} id={id} sample={sample} />)}
          </ul>
        </TabsContent>

        <TabsContent value="cv">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{t("cvIntro")}</p>
            <Tabs value={cvLang} onValueChange={(v) => setCvLang(v as CvLang)}>
              <TabsList className="h-9">
                <TabsTrigger value="en" className="px-3 text-xs">{tc("english")}</TabsTrigger>
                <TabsTrigger value="ar" className="px-3 text-xs">{tc("arabic")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CV_TEMPLATE_IDS.map((id) => (
              <li key={id} className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:shadow-lifted">
                <div className="flex justify-center rounded-xl bg-[#eef2f8] p-3"><CvTemplateThumb id={id} lang={cvLang} width={200} /></div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-navy">{t(`cvNames.${id}`)}</h3>
                  {CV_TEMPLATES[id].ats && <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold text-success"><Check className="size-3" /> ATS</span>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t(`cvDescriptions.${id}`)}</p>
                <div className="mt-auto pt-4">
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/cv?new=1&template=${id}`}>{t("useTemplate")} <ArrowRight className="rtl-flip" /></Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </>
  );
}
