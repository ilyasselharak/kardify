import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";
import { HeroCardStack } from "@/components/marketing/hero-card-stack";

/** Split-screen auth layout: brand panel + form. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth.brandPanel");
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.06] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]" />
        <div className="pointer-events-none absolute -end-32 -top-32 size-[28rem] rounded-full bg-primary/40 blur-3xl" />
        <Link href="/" className="relative">
          <Logo light />
        </Link>
        <div className="relative my-auto max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{t("title")}</h2>
          <p className="mt-4 text-white/70">{t("subtitle")}</p>
          <ul className="mt-8 grid gap-3">
            {(["point1", "point2", "point3"] as const).map((k) => (
              <li key={k} className="flex items-center gap-3 text-sm text-white/90">
                <CheckCircle2 className="size-5 text-primary" /> {t(k)}
              </li>
            ))}
          </ul>
          <div className="mt-12 max-w-sm">
            <HeroCardStack compact />
          </div>
        </div>
      </aside>
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible">
            <Logo />
          </Link>
          <LocaleSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
