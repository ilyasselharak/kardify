import { Briefcase, LifeBuoy, Mail } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { pageTitle } from "@/i18n/server";
import { Section, SectionHeading } from "@/components/marketing/section";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("contact", "eyebrow") };
}

export default function ContactPage() {
  const t = useTranslations("contact");
  const items = [
    { icon: Mail, title: t("emailUs"), body: t("emailBody"), href: "mailto:hello@kardify.com", link: "hello@kardify.com" },
    { icon: Briefcase, title: t("partnerships"), body: t("partnershipsBody"), href: "mailto:partnerships@kardify.com", link: "partnerships@kardify.com" },
    { icon: LifeBuoy, title: t("support"), body: t("supportBody"), href: "mailto:support@kardify.com", link: "support@kardify.com" },
  ];
  return (
    <Section>
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
        {items.map(({ icon: Icon, title, body, href, link }) => (
          <a key={title} href={href} className="group rounded-2xl border border-border bg-card p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-lifted">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
            <h3 className="mt-5 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            <p dir="ltr" className="mt-4 text-start text-sm font-medium text-primary group-hover:underline">{link}</p>
          </a>
        ))}
      </div>
    </Section>
  );
}
