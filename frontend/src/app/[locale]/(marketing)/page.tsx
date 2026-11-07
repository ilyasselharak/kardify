import type { Metadata } from "next";
import {
  ArrowRight, BarChart3, Check, Contact, Mail, MessageCircle, Palette, QrCode, RefreshCw, Share2, Smartphone, Sparkles, Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Faq } from "@/components/marketing/faq";
import { HeroCardStack } from "@/components/marketing/hero-card-stack";
import { Section, SectionHeading } from "@/components/marketing/section";
import { BusinessCardFront } from "@/components/cards/business-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { templateDesign } from "@/lib/design/templates";
import { TEMPLATE_IDS } from "@/lib/design/types";

/** hreflang alternates for the home page (static, so it stays prerenderable). */
export const metadata: Metadata = { alternates: { languages: { en: "/en", ar: "/ar", "x-default": "/en" } } };

export default function LandingPage() {
  const t = useTranslations("landing");
  const tw = useTranslations("wizard.design.templateNames");

  const features = [
    { key: "design", icon: Palette },
    { key: "wallet", icon: Wallet },
    { key: "qr", icon: QrCode },
    { key: "share", icon: Share2 },
    { key: "contact", icon: Contact },
    { key: "analytics", icon: BarChart3 },
  ] as const;

  const sample = {
    name: t("previewCard.name"),
    jobTitle: t("previewCard.title"),
    companyName: t("previewCard.company"),
    phone: "+212 600 123 456",
    email: "sara@atlas.vc",
    socialLinks: [
      { platform: "linkedin" as const, url: "https://linkedin.com", visible: true },
      { platform: "x" as const, url: "https://x.com", visible: true },
    ],
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 start-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> {t("hero.badge")}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-balance text-navy sm:text-5xl lg:text-6xl">
              {t.rich("hero.title", {
                highlight: (c) => <span className="bg-gradient-to-r from-primary to-[#5b8cff] bg-clip-text text-transparent">{c}</span>,
              })}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">{t("hero.cta")} <ArrowRight className="rtl-flip" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#how-it-works">{t("hero.secondary")}</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">{t("hero.trust")}</p>
          </div>
          <HeroCardStack />
        </div>
      </section>

      {/* Features */}
      <Section id="features" className="bg-white">
        <SectionHeading eyebrow={t("features.eyebrow")} title={t("features.title")} subtitle={t("features.subtitle")} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ key, icon: Icon }) => (
            <div key={key} className="group rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-lifted">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 font-semibold">{t(`features.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`features.${key}.body`)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works">
        <SectionHeading eyebrow={t("how.eyebrow")} title={t("how.title")} />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {(["step1", "step2", "step3"] as const).map((s, i) => (
            <li key={s} className="relative rounded-2xl border border-border bg-card p-7 shadow-soft">
              <span className="flex size-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-5 text-lg font-semibold">{t(`how.${s}.title`)}</h3>
              <p className="mt-2 text-muted-foreground">{t(`how.${s}.body`)}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Customization */}
      <Section className="bg-white">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading center={false} eyebrow={t("customize.eyebrow")} title={t("customize.title")} subtitle={t("customize.subtitle")} />
            <ul className="mt-8 grid gap-3">
              {(["point1", "point2", "point3", "point4"] as const).map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-3.5" /></span>
                  {t(`customize.${p}`)}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8"><Link href="/register">{t("customize.cta")}</Link></Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {TEMPLATE_IDS.slice(0, 6).map((id) => (
              <figure key={id} className="grid gap-2">
                <BusinessCardFront card={{ ...sample, designSettings: templateDesign(id) }} />
                <figcaption className="text-center text-xs font-medium text-muted-foreground">{tw(id)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Section>

      {/* Wallet */}
      <section className="relative overflow-hidden bg-navy py-20 text-white sm:py-28">
        <div className="pointer-events-none absolute -end-40 top-0 size-[36rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading light center={false} eyebrow={t("walletSection.eyebrow")} title={t("walletSection.title")} subtitle={t("walletSection.subtitle")} />
            <ul className="mt-8 grid gap-4">
              {[
                { icon: Smartphone, text: t("walletSection.apple") },
                { icon: Wallet, text: t("walletSection.google") },
                { icon: RefreshCw, text: t("walletSection.updates") },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-white/90">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><Icon className="size-4" /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-xs rounded-[2.5rem] border-[10px] border-white/10 bg-black p-4 shadow-2xl">
            <div className="grid gap-3">
              <div className="rounded-2xl bg-[#0d1e37] p-4 ring-1 ring-white/10">
                <p className="text-xs text-white/60">Kardify</p>
                <p className="mt-6 text-lg font-semibold">{t("previewCard.name")}</p>
                <p className="text-sm text-primary">{t("previewCard.title")}</p>
                <div className="mt-6 flex justify-center rounded-xl bg-white p-3">
                  <QrCode className="size-20 text-navy" />
                </div>
              </div>
              <div className="h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-70" />
              <div className="h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 opacity-60" />
            </div>
          </div>
        </div>
      </section>

      {/* Sharing */}
      <Section>
        <SectionHeading eyebrow={t("sharing.eyebrow")} title={t("sharing.title")} subtitle={t("sharing.subtitle")} />
        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3">
          {[
            { icon: Share2, label: "Web Share" },
            { icon: MessageCircle, label: "WhatsApp" },
            { icon: Mail, label: "Email" },
            { icon: QrCode, label: "QR PNG / SVG" },
            { icon: Contact, label: "vCard" },
            { icon: Wallet, label: "Wallet" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft">
              <Icon className="size-4 text-primary" /> {label}
            </span>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="bg-white">
        <SectionHeading title={t("faq.title")} />
        <Faq items={[1, 2, 3, 4, 5, 6, 7].map((i) => ({ q: t(`faq.q${i}` as "faq.q1"), a: t(`faq.a${i}` as "faq.a1") }))} />
      </Section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#0047b3] px-8 py-16 text-center text-white shadow-lifted">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />
            <h2 className="relative text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t("cta.title")}</h2>
            <p className="relative mt-4 text-white/80">{t("cta.subtitle")}</p>
            <Button asChild size="lg" variant="outline" className="relative mt-8 border-white bg-white text-navy hover:bg-white/90">
              <Link href="/register">{t("cta.button")} <ArrowRight className="rtl-flip" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
