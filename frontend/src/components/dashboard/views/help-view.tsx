import { LifeBuoy, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Faq } from "@/components/marketing/faq";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../page-header";

export function HelpView() {
  const t = useTranslations("help");
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="-mt-12">
          <Faq items={[1, 2, 3, 4, 5].map((i) => ({ q: t(`q${i}` as "q1"), a: t(`a${i}` as "a1") }))} />
        </div>
        <div className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><LifeBuoy className="size-5" /></span>
          <h2 className="mt-4 font-semibold">{t("contactTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("contactBody")}</p>
          <Button asChild className="mt-5 w-full"><a href="mailto:support@kardify.com"><Mail /> {t("contactCta")}</a></Button>
        </div>
      </div>
    </>
  );
}
