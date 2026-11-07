import { Eye, Gem, Lock } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { pageTitle } from "@/i18n/server";
import { Section, SectionHeading } from "@/components/marketing/section";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("about", "eyebrow") };
}

export default function AboutPage() {
  const t = useTranslations("about");
  const values = [
    { k: "v1", icon: Gem },
    { k: "v2", icon: Lock },
    { k: "v3", icon: Eye },
  ] as const;
  return (
    <>
      <Section>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div className="mx-auto mt-10 grid max-w-2xl gap-5 text-lg leading-relaxed text-muted-foreground">
          <p>{t("body1")}</p>
          <p>{t("body2")}</p>
        </div>
        <div className="mx-auto mt-12 max-w-2xl rounded-3xl bg-navy p-8 text-center text-white">
          <p className="text-sm font-semibold text-primary">{t("mission")}</p>
          <p className="mt-3 text-2xl font-semibold text-balance">{t("missionBody")}</p>
        </div>
      </Section>
      <Section className="bg-white">
        <SectionHeading title={t("values")} />
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-3">
          {values.map(({ k, icon: Icon }) => (
            <div key={k} className="rounded-2xl border border-border bg-background p-6">
              <Icon className="size-6 text-primary" />
              <h3 className="mt-4 font-semibold">{t(k)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`${k}Body` as "v1Body")}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
