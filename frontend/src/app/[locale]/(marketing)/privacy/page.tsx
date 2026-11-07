import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { pageTitle } from "@/i18n/server";
import { Section } from "@/components/marketing/section";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("legal", "privacyTitle") };
}

export default function LegalPage() {
  const t = useTranslations("legal");
  return (
    <Section>
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-navy">{t("privacyTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("updated")}</p>
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{t("privacyBody")}</p>
      </article>
    </Section>
  );
}
